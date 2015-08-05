from gevent.monkey import patch_all
patch_all()

import sqlalchemy as sql
import elasticsearch as es
import elasticsearch.helpers as eshelp
import requests

import gevent
import gevent.queue
import gipc
import datetime
import warnings
import json
import os
import sys

import utils
import logging

logging.basicConfig(format='[%(asctime)-15s][%(processName)s][%(threadName)s] %(message)s')
log = logging.getLogger('ingest')
log.setLevel(logging.INFO)

# env variables
SQL_USER=os.getenv('SQL_USER', 'root')
SQL_HOST=os.getenv('SQL_HOST', 'localhost')
SQL_PASS=os.getenv('SQL_PASS', '')
SQL_DB=os.getenv('SQL_DB', 'link_ht')

ELS_USER=os.getenv('ELS_USER', '')
ELS_PASS=os.getenv('ELS_PASS', '')
ELS_HOST=os.getenv('ELS_HOST', 'localhost')
ELS_PORT=os.getenv('ELS_PORT', 9200)

LINK_HT_PIPELINE=os.getenv('LINK_HT_PIPELINE', 'localhost')

ELS_QAD_HOSTS=os.getenv('ELS_QAD_HOSTS', 'localhost')

QUEUE_SIZE=1024
NUM_WORKERS=8
NUM_PROCESS=8
LIMIT = 10000

# populate phone list
def get_phone_list(data):
    if 'phone' in data and data['phone']:
        phone_list = data['phone'] if isinstance(data['phone'], list) else [data['phone']]
        phone_list = utils.standardize_numbers(phone_list)  # this may filter out international numbers
    else:
        phone_list = []
    return phone_list

# create the sql tables
def create_tables(create=True):
    mysql = "mysql+pymysql://{user}:{passwd}@{host}/{db}?charset=utf8mb4".format(user=SQL_USER, passwd=SQL_PASS, host=SQL_HOST, db=SQL_DB)
    engine = sql.create_engine(mysql, echo=False, pool_size=20)

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
      return engine

    return ({
        'ads': ads,
        'entities': entities,
        'phone_link': phone_link,
        'text_link': text_link
      }, engine)

# simple helper to use with pipeline
def send_to_plumber(payload):
  data = {u"data": payload}
  r = requests.post(LINK_HT_PIPELINE, json=data)
  if r.status_code != 200:
    # dunno what happened
    print >> sys.stderr, repr(r)
    return payload
  elif r.json()['metadata']['errors']:
    print >> sys.stderr, json.dumps(r.json()['metadata']['errors'])
    return r.json()['data']
  else:
    return r.json()['data']

def worker(q, tables, sql_engine, es_client):
  """
  The worker executes the necessary sequence to add a new ad to the
  SQL database and the ES instance.

  The ES instance is in sync with the SQL database.
  """
  insert_ads = tables['ads'].insert().prefix_with('IGNORE')
  insert_link = tables['phone_link'].insert()
  insert_text_link = tables['text_link'].insert().prefix_with('IGNORE')
  insert_entity = tables['entities'].insert()
  entity = tables['entities']
  while True:
    work = q.get()
    log.info("got work, queue size: {}".format(q.qsize()))
    if work == "DONE":
      log.info("terminating....")
      break
    blob = send_to_plumber(work)
    conn = sql_engine.connect()
    with conn.begin() as trans:
      # store the blob into sql
      blob_json_string = utils.fix_encoding(json.dumps(blob, ensure_ascii=False))
      conn.execute(insert_ads, id=blob['id'], json=blob_json_string)

      # add to text_link table
      if 'text_signature' in blob and blob['text_signature']:
        text_signature = blob['text_signature']
        conn.execute(insert_text_link, ad_id=blob['id'], text_id=text_signature)

      # process phone numbers and add to phone_link table
      phone_list = get_phone_list(work)
      new_phone_list = None
      if phone_list:
        # now, find all exisitng blob id, phone number pairs
        s = sql.select([entity.c.entity_id]).where(
              sql.and_(
                entity.c.entity_id.in_(phone_list),
                entity.c.ad_id == blob['id'],
                entity.c.user == 'auto'
              ))
        found = [r['entity_id'] for r in conn.execute(s).fetchall()]
        # remove any existing pairs from the phone list
        # remaining is the list of new entities this blob is a part of
        new_phone_list = set(phone_list) - set(found)

      if new_phone_list:
        values = [
          {'ad_id': blob['id'],
           'phone_id': number,
           'entity_id': number,
           'user': 'auto'}
          for number in new_phone_list
        ]
        conn.execute(insert_link, values)
        # check to see if any
        conn.execute(insert_entity, values)
      # update ES instance
      # {entity: "phone number", username: [...], base: [...]}
        for number in new_phone_list:
          es_client.update(index='entities',
            doc_type='entity',
            id=number,
            retry_on_conflict=32,
            body={u"script": u"ctx._source[key] += blob",
              u"params": {
                u"key": u"base",
                u"blob": blob
              },
              u"upsert": {
                u"entity": number,
                u"base": [blob]
              }})
      trans.commit()
    gevent.sleep(0)

def worker_process(reader):
  # set up the work queue
  q = gevent.queue.Queue(maxsize=QUEUE_SIZE)

  # source of info
  es_instance = "https://{user}:{passwd}@{host}:{port}".format(user=ELS_USER, passwd=ELS_PASS, host=ELS_HOST, port=ELS_PORT)
  es_src = es.Elasticsearch([es_instance], timeout=60, retry_on_timeout=True)

  # dest of info
  es_instances = ["http://{host}:9200".format(host=h) for h in ELS_QAD_HOSTS.split(',')]
  dst = es.Elasticsearch(es_instances, timeout=60, retry_on_timeout=True)

  # create the Table objects (but not the actual tables themselves)
  tables, engine = create_tables(False)

  # set up the workers
  workers = [gevent.spawn(worker, q, tables, engine, dst) for _ in xrange(NUM_WORKERS)]

  # now iterate over all the ads to put them into our SQL db and ES instance
  try:
    with warnings.catch_warnings():
      warnings.simplefilter("ignore")
      count = 0
      while True:
        work = reader.get()
        count += 1
        #log.info("work received {}".format(count))
        gevent.sleep(0)
        if work == "DONE":
          log.info("terminating process....")
          break
        q.put(work)
        log.info("queue size {}".format(q.qsize()))
        gevent.sleep(0)
  finally:
    # now terminate the workers
    for i in xrange(NUM_WORKERS):
      log.info("terminating greenlet {}".format(i))
      q.put("DONE")

    # wait for them all to finish
    gevent.joinall(workers)

def main_worker(w, q):
  """ We put the main worker behind a queue to limit the rate at which
  we write to the pipes.
  """
  while True:
    work = q.get()
    w.put(work)
    gevent.sleep(0)
    if work == "DONE":
      log.info("main worker done...")
      break


if __name__ == "__main__":
  # create the sql tables (if they don't already exist)
  engine = create_tables()
  engine.dispose()

  # set up the main queue
  main_queue = gevent.queue.Queue(maxsize=QUEUE_SIZE)

  es_instance = "https://{user}:{passwd}@{host}:{port}".format(user=ELS_USER, passwd=ELS_PASS, host=ELS_HOST, port=ELS_PORT)
  client = es.Elasticsearch([es_instance], timeout=60, retry_on_timeout=True)

  all_ads = eshelp.scan(client, index="memex_ht", doc_type="ad", scroll='15m')

  pipes = [gipc.pipe() for _ in xrange(NUM_PROCESS)]
  processes = [gipc.start_process(target=worker_process, args=(r,)) for (r,_) in pipes]
  workers = [gevent.spawn(main_worker, w, main_queue) for (_,w) in pipes]

  try:
    with warnings.catch_warnings():
      warnings.simplefilter("ignore")
      for count, e in enumerate(all_ads):
        # for debugging, stop after 1000 entries
        if count > LIMIT:
          break
        # send the data up to our link-ht-pipeline
        main_queue.put(e['_source'])
        log.info("count: {}, queue size: {}".format(count, main_queue.qsize()))
  finally:
    # shut down the processes
    for _ in workers:
      main_queue.put("DONE")

    for p in processes:
      log.info("waiting for process: {}".format(p.pid))
      p.join()

    # wait for workers
    gevent.joinall(workers)
