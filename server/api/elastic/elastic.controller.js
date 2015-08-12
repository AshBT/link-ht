'use strict';

var _ = require('lodash'),
   db = require('../../databases').neo4j;

var Elastic = require('./elastic.model');

console.log("Bonjour")


function handleError(res, err) {
  return res.send(500, err);
}

var ES_HOST = process.env['ES_HOST'] || 'http://localhost';

// var elasticsearch = require('elasticsearch');
// var client = new elasticsearch.Client({
//   host: ES_HOST + ':9200',
//   log: 'trace'
// });


//------------------------------LOGGING---------------------------------
      var elasticsearch = require('elasticsearch');
      var client = new elasticsearch.Client({
        // host: ES_HOST + ':9200',
        host: 'localhost:9200',
        log: 'trace'
      });

exports.search = function(req) {
  client.create({
    index: 'query_logging',
    type: 'search',
    body: {
      username: "demo_user",
      query: req.body.elasticSearchText,
      published_at: Date.now(),
    }
  });           
}
//------------------------------LOGGING---------------------------------






// var adIds=[]

// exports.search = function(req, res) {


//   client.search({
//     index: 'ads',
//     size: 50,
//     body: {
//       query: {
//         match: {
//           "_all": req.body.elasticSearchText
//         }
//       }
//     }
//   }).then(function (body) {
//     var hits = body.hits.hits;
//     for (var i =0; i<hits.length; i++) {
//       adIds[i] = Number(hits[i]["_source"]["id"])
//       }
//     console.log(adIds)
//     Elastic.getNeo4j(adIds, function(err, entities){
//       if(err) {
//         console.log(err);
//         return handleError(res, err)
//       }
//     console.log(entities)
//     return res.json(entities);
//   });

//                     // return res.json(hits);
//                   }, function (error) {
//           // console.trace(error.message);
//         });
  // }
