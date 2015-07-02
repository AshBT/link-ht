'use strict';

var _ = require('lodash');
var Elastic = require('./elastic.model');

console.log("Bonjour")


function handleError(res, err) {
  return res.send(500, err);
}
var neo4j = require('neo4j');

var NEO_HOST = process.env['NEO_HOST'] || 'http://localhost:7474';
var NEO_USER = process.env['NEO_USER'] || 'neo4j';
var NEO_PASS = process.env['NEO_PASS'] || 'password';

var db = new neo4j.GraphDatabase({
    url: NEO_HOST,
    auth: {username: NEO_USER, password: NEO_PASS},     // optional; see below for more details
    headers: {},    // optional defaults, e.g. User-Agent
    proxy: null,    // optional URL
    agent: null,    // optional http.Agent instance, for custom socket pooling
});

var ES_HOST = process.env['ES_HOST'] || 'http://localhost';

var elasticsearch = require('elasticsearch');
var client = new elasticsearch.Client({
  host: ES_HOST + ':9200',
  log: 'trace'
});

var adIds=[]

exports.search = function(req, res) {


  client.search({
    index: 'ads',
    size: 100,
    body: {
      query: {
        match: {
          "_all": req.body.elasticSearchText
        }
      }
    }          
  }).then(function (body) {
    var hits = body.hits.hits;
    for (var i =0; i<hits.length; i++) {
      adIds[i] = Number(hits[i]["_source"]["id"])
      }
    console.log(adIds)
    Elastic.getNeo4j(adIds, function(err, entities){
      if(err) {
        console.log(err);
        return handleError(res, err)
      }
    console.log(entities)
    return res.json(entities);
  });

                    // return res.json(hits);
                  }, function (error) {
          // console.trace(error.message);
        });
  }








       




