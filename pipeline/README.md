# What's here
This contains the files to ingest (new) ads from IST's ES instance to Qadium's data infrastructure.

## Qadium's data infrastructure
Our infrastructure consists of a MySQL DB and an ElasticSearch instance.

The MySQL DB consists of the following tables: `ads`, `phone_link`, `image_link`, `text_link`, and `entities`.

The `ads` table consists of an ad id along with its JSON blob. The JSON is post-enhanced data.

The `*_link` tables consist of two columns: an ad id and a cluster id. The cluster id should be a hash.

The `entities` table consists of three columns: an ad id, a user id, and an entity id.

All tables have an additional `insertion_time` column.

The server consists of a listener to Pusher events. Whenever an event is triggered, we ensure that the MySQL DB and the ES instance are mirrored.

## Adding a suggested ad
When a user adds a suggested `ad`, it gets put in the `entities` table. The user id is recorded. When this action happens, we trigger a write to ElasticSearch.

## Updating the database
When a new ad is detected on IST's ES instance, we add it to the `ads` table and any `*_link` tables. We also update the `entities` table.

For instance, if a new ad arrives with ad id `1234`, we add a new row to the `ads` table and add rows for each cluster / link type.

## The entities table
Whenever the entities table is written to, it should also write to the ElasticSearch instance by looking up the corresponding ad id in the `ads` table and writing / updating the corresponding entity id in ES.
