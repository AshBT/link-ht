'use strict';

var _ = require('lodash');
var Annotation = require('./annotation.model');

var ES_HOST = process.env['ES_HOST'] || 'http://localhost';

//------------------------------PERSISTING---------------------------------

var elasticsearch = require('elasticsearch');
var client = new elasticsearch.Client({
  host: ES_HOST + ':9200',
  log: 'trace'
});

exports.persist = function(req) {
  client.create({
    index: 'annotations',
    type: 'text',
    body: {
      entityid: req.body.entityid,
      text: req.body.text,
      username: req.body.username,
      date: req.body.date,
    }
  });
}
//------------------------------PERSISTING---------------------------------

//------------------------------SEARCHING---------------------------------
//TO DO: Search for all notes on a particular entity_id
exports.search = function(req, res) {
  client.search({
    index: 'annotations',
    type: 'text',
    size: 50,
    body: {
      query: {
        match_all: {
        }
      }
    }
  }).then(function (body) {
    var hits = body.hits.hits;
    return res.json(hits);
  });
}

//------------------------------SEARCHING---------------------------------
