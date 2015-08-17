from gevent.monkey import patch_all
patch_all() #thread=False, select=False)

import sqlalchemy as sql
import elasticsearch as es
import elasticsearch.helpers as eshelp
import requests

import gevent
import gevent.queue
import gevent.event

import datetime
import warnings
import json
import os
import sys
import itertools
import random

import utils
import logging
import time

logging.basicConfig(format='[%(asctime)-15s][%(name)s][%(threadName)s] %(message)s')
log = logging.getLogger('ingest')
plumb = logging.getLogger('plumber')
plumb.setLevel(logging.DEBUG)
log.setLevel(logging.INFO)
logging.getLogger('elasticsearch').setLevel(logging.INFO)

#logging.getLogger('sqlalchemy.engine').setLevel(logging.INFO)

# env variables
SQL_USER=os.getenv('SQL_USER', 'root')
SQL_HOST=os.getenv('SQL_HOST', '127.0.0.1')
SQL_PASS=os.getenv('SQL_PASS', '')
SQL_DB=os.getenv('SQL_DB', 'link_ht')

ELS_USER=os.getenv('ELS_USER', '')
ELS_PASS=os.getenv('ELS_PASS', '')
ELS_HOST=os.getenv('ELS_HOST', 'localhost')
ELS_PORT=os.getenv('ELS_PORT', 9200)

LINK_HT_PIPELINE=os.getenv('LINK_HT_PIPELINE', 'localhost')

ELS_QAD_HOSTS=os.getenv('ELS_QAD_HOSTS', 'localhost')

NUM_GREENLETS=32
QUEUE_SIZE=4*NUM_GREENLETS
MIN_BULK_SIZE=1
MAX_BULK_SIZE=10
LIMIT = 20003

# populate phone list
def get_phone_list(data):
    if 'phone' in data and data['phone']:
        phone_list = data['phone'] if isinstance(data['phone'], list) else [data['phone']]
        phone_list = utils.standardize_numbers(phone_list)  # this may filter out international numbers
    else:
        phone_list = []
    return set(phone_list)

# create the sql tables
def create_tables(create=True):
    mysql = "mysql+pymysql://{user}:{passwd}@{host}/{db}?charset=utf8mb4".format(user=SQL_USER, passwd=SQL_PASS, host=SQL_HOST, db=SQL_DB)
    #mysql = "mysql+mysqldb://{user}:{passwd}@{host}/{db}?charset=utf8mb4".format(user=SQL_USER, passwd=SQL_PASS, host=SQL_HOST, db=SQL_DB)
    engine = sql.create_engine(mysql, poolclass=sql.pool.StaticPool)

    # create the ads table if it doesn't exist
    metadata = sql.MetaData()
    ads = sql.Table('ads', metadata,
      sql.Column('id', sql.Integer, primary_key=True, index=True),
      sql.Column('json', sql.UnicodeText),
      sql.Column('created', sql.TIMESTAMP, server_default=sql.text('NOW()')),
      mysql_charset='utf8mb4'
    )

    # create the phone link table
    phone_link = sql.Table('phone_link', metadata,
      sql.Column('ad_id', None, sql.ForeignKey('ads.id'), primary_key=True, index=True),
      sql.Column('phone_id', sql.String(15), primary_key=True, index=True),
      sql.Column('created', sql.TIMESTAMP, server_default=sql.text('NOW()')),
      sql.UniqueConstraint('ad_id', 'phone_id'),
      mysql_charset='utf8mb4'
    )

    # create the text link table
    text_link = sql.Table('text_link', metadata,
      sql.Column('ad_id', None, sql.ForeignKey('ads.id'), primary_key=True, index=True),
      sql.Column('text_id', sql.String(64), primary_key=True, index=True),
      sql.Column('created', sql.TIMESTAMP, server_default=sql.text('NOW()')),
      sql.UniqueConstraint('ad_id', 'text_id'),
      mysql_charset='utf8mb4'
    )

    # create the entities table if it doesn't exist
    entities = sql.Table('entities', metadata,
      sql.Column('ad_id', None, sql.ForeignKey('ads.id'), primary_key=True, index=True),
      sql.Column('entity_id', None, sql.ForeignKey('phone_link.phone_id'), primary_key=True, index=True),
      sql.Column('user', sql.String(50), primary_key=True, index=True),
      sql.Column('created', sql.TIMESTAMP, server_default=sql.text('NOW()')),
      sql.UniqueConstraint('ad_id', 'entity_id', 'user'),
      mysql_charset='utf8mb4'
    )

    if create:
      metadata.create_all(engine)

    return ({
        'ads': ads,
        'entities': entities,
        'phone_link': phone_link,
        'text_link': text_link
      }, engine)

# simple helper to use with pipeline
def send_to_plumber(payload, session, attempts=5):
  data = {u"data": payload}
  for attempt in xrange(attempts):
    gevent.sleep((2**attempt - 1)*random.random())
    log.debug("Request for {}. Attempt {}/{}".format(payload['id'], attempt+1, attempts))
    timedout = False
    try:
      t0 = time.time()
      r = session.post(LINK_HT_PIPELINE, json=data, timeout=30)
      t1 = time.time()
      plumb.debug("POST {} [status: {}, request: {:.4f}s]".format(LINK_HT_PIPELINE, r.status_code, t1-t0))
      if r.status_code == 200:
        break
    except requests.exceptions.RequestException:
      # we treat all request exceptions as if it "timed out"
      plumb.debug("Request for {} timed out. Attempt {}/{}".format(payload['id'], attempt+1, attempts))
      timedout = True
  log.debug("{} completed in {}/{} attempts.".format(payload['id'], attempt+1, attempts))

  if timedout or r.status_code != 200:
    # dunno what happened
    print >> sys.stderr, repr(r)
    return payload
  elif r.json()['metadata']['errors']:
    print >> sys.stderr, json.dumps(r.json()['metadata']['errors'])
    return r.json()['data']
  else:
    return r.json()['data']

def worker(work, tables, sql_engine, request_session):
  """
  The worker executes the necessary sequence to add a new ad to the
  SQL database and the ES instance.

  The ES instance is in sync with the SQL database.
  """
  # sleep for a random amount of time before running
  gevent.sleep(random.random())
  ad = tables['ads']

  log.debug("got work: {}".format(work['id']))

  # check if we processed this ad yet, if we did, move on
  s = sql.select([ad.c.id]).where(ad.c.id == work['id'])
  if not sql_engine.execute(s).fetchall():
    #gevent.sleep(0)
    log.debug("Sending to plumber. ({})".format(work['id']))
    blob = send_to_plumber(work, request_session)
    #gevent.sleep(0)
    log.debug("Got response. ({})".format(work['id']))
    # fix unicode issues
    for k in blob:
      blob[k] = utils.fix_encoding(blob[k])

    phone_list = get_phone_list(work)

    return (blob, phone_list)
  return None

def es_phone_blob_iter(blob_and_phone_list):
  for blob, phone_list in blob_and_phone_list:
    for number in phone_list:
      yield {
        u'_op_type': 'update',
        u'_index': 'entities',
        u'_type': 'entity',
        u'_id': number,
        u'_retry_on_conflict': 32,
        u"script": u"ctx._source[key] += blob",
          u"params": {
            u"key": u"base",
            u"blob": blob
          },
          u"upsert": {
            u"entity": number,
            u"base": [blob]
          }
        }

def update_es(es_client, blob_and_phone_list):
  """
  Updated the ES client to bring it in sync with the phone list
  """
  # update ES instance
  # {entity: "phone number", username: [...], base: [...]}

  #log.info("numbers {}".format(len(phone_list)))
  success, failure = eshelp.bulk(es_client, es_phone_blob_iter(blob_and_phone_list), stats_only=True)
  if failure != 0:
    raise Exception("Elasticsearch bulk update failed.")
        #for number in phone_list:
        #  es_client.update(index='entities-prod',
        #    doc_type='entity',
        #    id=number,
        #    retry_on_conflict=50,
        #    body={u"script": u"ctx._source[key] += blob",
        #      u"params": {
        #        u"key": u"base",
        #        u"blob": blob
        #      },
        #      u"upsert": {
        #        u"entity": number,
        #        u"base": [blob]
        #      }})
          #gevent.sleep(0)

def construct_ad_values(blob_and_phone_list):
  for b, _ in blob_and_phone_list:
    yield {
      'id': b['id'],
      'json': json.dumps(b, ensure_ascii=False)
    }

def construct_text_signatures(blob_and_phone_list):
  for b, _ in blob_and_phone_list:
    if 'text_signature' in b and b['text_signature']:
      yield {
        'ad_id': b['id'],
        'text_id': b['text_signature']
      }

def construct_phone_link(blob_and_phone_list):
  for b, phone_list in blob_and_phone_list:
    for number in phone_list:
      yield {
        'ad_id': b['id'],
        'phone_id': number,
        'entity_id': number,
        'user': 'auto'
      }

def update_sql(engine, tables, blob_and_phone_list, attempts=5):
  insert_ads = tables['ads'].insert()
  insert_link = tables['phone_link'].insert()
  insert_text_link = tables['text_link'].insert()
  insert_entity = tables['entities'].insert()

  ads = list(construct_ad_values(blob_and_phone_list))
  sigs = list(construct_text_signatures(blob_and_phone_list))
  values = list(construct_phone_link(blob_and_phone_list))

  for attempt in xrange(attempts):
    gevent.sleep((2**attempt - 1)*random.random())
    try:
      with engine.begin() as conn:
        conn.execute(insert_ads, ads)

        if sigs:
          conn.execute(insert_text_link, sigs)
        if values:
          conn.execute(insert_link, values)
          conn.execute(insert_entity, values)
    except sql.exc.InternalError as e:
      if e.orig.args[0] == 1213:
        log.info("Retrying deadlocked transaction. Attempt {}/{}.".format(attempt+1, attempts))
        continue
      else:
        raise
    # if we get here, just quit the loop
    break

count = 0
bulk_count = 0
def create_worker(q, exception_occurred):
  s = requests.Session()

  # create the sql tables (if they don't already exist)
  tables, engine = create_tables(False)

  # dest of info
  es_instances = ["http://{host}:9200".format(host=h) for h in ELS_QAD_HOSTS.split(',')]
  es_instance = es_instances[random.randint(0,len(es_instances)-1)]
  dst = es.Elasticsearch([es_instance], timeout=60, retry_on_timeout=True, send_get_body_as='POST', maxsize=1)

  bulk_size = random.randint(MIN_BULK_SIZE, MAX_BULK_SIZE)

  def do_work():
    global count
    global bulk_count
    blob_and_phone_list = []
    while True:
      work = q.get()
      try:
        if work == "DONE":
          break
        result = worker(work, tables, engine, s)
        if result:
          blob_and_phone_list.append(result)
          if len(blob_and_phone_list) % bulk_size == 0:
            update_sql(engine, tables, blob_and_phone_list)
            update_es(dst, blob_and_phone_list)
            blob_and_phone_list = []
            bulk_count += bulk_size
            log.info("bulk count: {}".format(bulk_count))
        count += 1
        log.info("count: {}".format(count))
      except gevent.GreenletExit:
        break
      except Exception as e:
        exception_occurred.set_exception(e)
        break
      finally:
        gevent.sleep(0)
        q.task_done()

    if blob_and_phone_list:
      log.info("Handling remaining {}".format(len(blob_and_phone_list)))
      update_sql(engine, tables, blob_and_phone_list)
      update_es(dst, blob_and_phone_list)

  greenlet = gevent.Greenlet(do_work)
  return greenlet


if __name__ == "__main__":
  # create the sql tables (if they don't exist)
  create_tables()

  # source of info
  es_instance = "https://{user}:{passwd}@{host}:{port}".format(user=ELS_USER, passwd=ELS_PASS, host=ELS_HOST, port=ELS_PORT)
  client = es.Elasticsearch([es_instance], timeout=60, retry_on_timeout=True, send_get_body_as='POST')

  # set up the work queue
  q = gevent.queue.JoinableQueue(maxsize=QUEUE_SIZE)

  # exception event
  exception_occurred = gevent.event.AsyncResult()

  workers = [create_worker(q, exception_occurred) for _ in xrange(NUM_GREENLETS)]
  for w in workers:
    w.start()

  all_ads = eshelp.scan(client, index="memex_ht", doc_type="ad", scroll='5m')
  limited_ads = itertools.islice(all_ads, LIMIT)
  try:
    with warnings.catch_warnings():
      warnings.simplefilter("ignore")
      for elem in limited_ads:
        log.debug("{}/{} queue size".format(q.qsize(), QUEUE_SIZE))
        q.put(elem['_source'])
        gevent.sleep(0)
        try:
          exception_occurred.get_nowait()
        except gevent.Timeout:
          continue
    for _ in xrange(NUM_GREENLETS):
      q.put("DONE")
    q.join()
  except Exception as e:
    log.debug("Caught exception {}, quitting...".format(str(e)))
    gevent.killall(workers)
    raise e
  finally:
    gevent.joinall(workers)
