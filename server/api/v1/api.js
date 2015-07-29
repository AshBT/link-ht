'use strict'

// (ECHU): Trying a new style for exporting modules.
module.exports = (function() {
  var LINK_HT_ES_HOST = process.env['LINK_HT_ES_HOST'] || 'http://localhost';
  var elasticsearch = require('elasticsearch');
  var client = new elasticsearch.Client({
    host: LINK_HT_ES_HOST + ':9200',
    log: 'trace'
  });

  var _search = function(query, size, page, res) {
    var starting_from = (page - 1) * size;

    client.search({
      index: 'entities',
      type: 'entity',
      size: size,
      from: starting_from,
      body: {
        query: {
          match: {
            "_all": query
          }
        }
      }
    }).then(function (body) {
      var hits = body.hits.hits;
      res.json({
        _num: size,
        _page: page,
        entities: hits
      })
    }, function (error) {
      res.status(400).json(error);
    });
  }

  var _count = function(query, res) {
    client.count({
      index: 'entities',
      type: 'entity',
      body: {
        query: {
          match: {
            "_all": query
          }
        }
      }
    }).then(function (body) {
      res.json({
        total: body.count
      })
    }, function (error) {
      res.status(400).json(error);
    });
  }

  var search = function(req, res) {
    var number_per_page = req.query.size || 10,
        page = req.query.page || 1;
    var query_string = req.body.query;
    if (query_string) {
      console.log("search called")
      _search(query_string, number_per_page, page, res);
    } else {
      res.status(400).json({error: "Expected 'query' in body."})
    }
  }

  var count = function(req, res) {
    var query_string = req.body.query;
    if (query_string) {
      console.log("count called")
      _count(query_string, res);
    } else {
      res.status(400).json({error: "Expected 'query' in body."})
    }
  }

  return {
    search: search,
    count: count,
    suggestAd: function(req, res) {
      var id = req.params.id;
      console.log("id: " + id)
    },
    getEntity: function(req, res) {
      var id = req.params.id;
      console.log("id: " + id)
    },
    attachAd: function(req, res) {
      var id = req.params.id;
      console.log("ad attached to " + id)
    },
    detachAd: function(req, res) {
      var id = req.params.id;
      console.log("ad detached from " + id)
    }
  }
})();
