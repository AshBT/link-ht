'use strict';

var express = require('express');
var controller = require('./logging.controller');

var router = express.Router();

router.post('/search', controller.search);

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


module.exports = router;