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

exports.persist = function(req,res) {
  console.log(req.body.entityInfo)
  client.create({
    index: 'savedentities',
    type: 'entityid',
    body: {
      entityid: req.body.entityInfo.entityId,
      username: req.body.entityInfo.username,
      date: req.body.date,
    }
  },
  function(error,response,status) {
    res.sendStatus(status);
  });
}
//------------------------------PERSISTING---------------------------------

//------------------------------SEARCHING---------------------------------
//TO DO: Search for all notes on a particular entity_id
exports.search = function(req, res) {
  client.search({
    index: 'savedentities',
    type: 'entityid',
    size: 50,
    body: {
      query: {
        match_all: {
        }
      }
    }
  }).then(function (body) {
    console.log("_----------------Debugging-------------------------_")
    var hits = body.hits.hits;
    res.json(hits);
  },
  function(error) {
    res.sendStatus(error);
  });
}
//------------------------------SEARCHING---------------------------------
