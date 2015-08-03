'use strict';

/* any database clients should go here. */
module.exports = (function() {
  var config = require('./config/environment')

  var connect_elasticsearch = function() {
    var elasticsearch = require('elasticsearch');
    return new elasticsearch.Client({
      host: config.elasticsearch.hosts,
      log:  config.elasticsearch.log
    });
  }

  var connect_mysql = function() {
    var mysql = require('mysql');
    return mysql.createConnection({
      host     : config.mysql.host,
      user     : config.mysql.user,
      password : config.mysql.password,
      database : 'link_ht'
    });
  }

  var connect_neo4j = function() {
    var neo4j = require('neo4j');
    return new neo4j.GraphDatabase({
        url: config.neo4j.host,
        auth: {
          username: config.neo4j.user,
          password: config.neo4j.password
        }
    });

  }

  var _es_client = connect_elasticsearch(),
      _sql_client = connect_mysql(),
      _neo4j_client = connect_neo4j();


  return {
    elasticsearch: _es_client,
    mysql: _sql_client,
    neo4j: _neo4j_client
  }
})();
