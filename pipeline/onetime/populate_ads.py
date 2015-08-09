from gevent.monkey import patch_all
patch_all()

import sqlalchemy as sql
import elasticsearch as es
import elasticsearch.helpers as eshelp
import requests

import gevent
import gevent.pool
import datetime
import warnings
import json
import os
import sys
import itertools
import random

import utils
import logging

logging.basicConfig(format='[%(asctime)-15s][%(name)s][%(threadName)s] %(message)s')
log = logging.getLogger('ingest')
log.setLevel(logging.DEBUG)
logging.getLogger('elasticsearch').setLevel(logging.INFO)
logging.getLogger('sqlalchemy.engine').setLevel(logging.INFO)

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

POOL_SIZE=128
LIMIT = 1000

# populate phone list
def get_phone_list(data):
    if 'phone' in data and data['phone']:
        phone_list = data['phone'] if isinstance(data['phone'], list) else [data['phone']]
        phone_list = utils.standardize_numbers(phone_list)  # this may filter out international numbers
    else:
        phone_list = []
    return set(phone_list)

# create the sql tables
def create_tables():
    mysql = "mysql+pymysql://{user}:{passwd}@{host}/{db}?charset=utf8mb4".format(user=SQL_USER, passwd=SQL_PASS, host=SQL_HOST, db=SQL_DB)
    engine = sql.create_engine(mysql, pool_size=20)

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

    metadata.create_all(engine)

    return ({
        'ads': ads,
        'entities': entities,
        'phone_link': phone_link,
        'text_link': text_link
      }, engine)

# simple helper to use with pipeline
def send_to_plumber(payload, attempts=5):
  data = {u"data": payload}
  for attempt in xrange(attempts):
    r = requests.post(LINK_HT_PIPELINE, json=data)
    if r.status_code == 200:
      break
    gevent.sleep((2**attempt - 1)*random.random())
  if r.status_code != 200:
    # dunno what happened
    print >> sys.stderr, repr(r)
    return payload
  elif r.json()['metadata']['errors']:
    print >> sys.stderr, json.dumps(r.json()['metadata']['errors'])
    return r.json()['data']
  else:
    return r.json()['data']

def worker(work, tables, sql_engine, es_client):
  """
  The worker executes the necessary sequence to add a new ad to the
  SQL database and the ES instance.

  The ES instance is in sync with the SQL database.
  """
  insert_ads = tables['ads'].insert()
  insert_link = tables['phone_link'].insert()
  insert_text_link = tables['text_link'].insert()
  insert_entity = tables['entities'].insert()
  entity = tables['entities']
  ad = tables['ads']

  log.debug("got work: {}".format(work['id']))
  conn = sql_engine.connect()

  # check if we processed this ad yet, if we did, move on
  s = sql.select([ad.c.id]).where(ad.c.id == work['id'])
  if not conn.execute(s).fetchall():
    gevent.sleep(0)
    log.debug("Sending to plumber. ({})".format(work['id']))
    blob = send_to_plumber(work)
    gevent.sleep(0)
    log.debug("Got response. ({})".format(work['id']))
    with conn.begin() as trans:
      # store the blob into sql
      log.debug("Storing blob. ({})".format(work['id']))
      blob_json_string = utils.fix_encoding(json.dumps(blob, ensure_ascii=False))
      result = conn.execute(insert_ads, id=blob['id'], json=blob_json_string)

      # add to text_link table
      if 'text_signature' in blob and blob['text_signature']:
        log.debug("Storing text signature. ({})".format(work['id']))
        text_signature = blob['text_signature']
        conn.execute(insert_text_link, ad_id=blob['id'], text_id=text_signature)

      # process phone numbers and add to phone_link table
      phone_list = get_phone_list(work)
      if phone_list:
        log.debug("Inserting phone link and entity. ({})".format(work['id']))
        values = [
          {'ad_id': blob['id'],
           'phone_id': number,
           'entity_id': number,
           'user': 'auto'}
          for number in phone_list
        ]
        conn.execute(insert_link, values)
        # check to see if any
        conn.execute(insert_entity, values)
        # update ES instance
        # {entity: "phone number", username: [...], base: [...]}
        for number in phone_list:
          es_client.update(index='entities-prod',
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
        gevent.sleep(0)
      trans.commit()
  log.debug("finished: {}".format(work['id']))

if __name__ == "__main__":
  # create the sql tables (if they don't already exist)
  tables, engine = create_tables()

  # source of info
  es_instance = "https://{user}:{passwd}@{host}:{port}".format(user=ELS_USER, passwd=ELS_PASS, host=ELS_HOST, port=ELS_PORT)
  client = es.Elasticsearch([es_instance], timeout=60, retry_on_timeout=True, send_get_body_as='POST')

  # dest of info
  es_instances = ["http://{host}:9200".format(host=h) for h in ELS_QAD_HOSTS.split(',')]
  dst = es.Elasticsearch(es_instances, timeout=60, retry_on_timeout=True, send_get_body_as='POST')

  # set up the work pool
  p = gevent.pool.Pool(size=POOL_SIZE)

  all_ads = eshelp.scan(client, index="memex_ht", doc_type="ad", scroll='120m')
  limited_ads = itertools.islice(all_ads, LIMIT)

  def do_work(ad):
    worker(ad['_source'], tables, engine, dst)
    return True

  try:
    with warnings.catch_warnings():
      warnings.simplefilter("ignore")
      for count, success in enumerate(p.imap_unordered(do_work, limited_ads)):
        log.debug("{}/{} greenlets remain in pool".format(p.free_count(), POOL_SIZE))
        log.info("count: {}".format(count))
        gevent.sleep(0)
  except Exception as e:
    log.debug("Caught exception {}, quitting...".format(str(e)))
    p.kill()
    raise e
  finally:
    p.join()
