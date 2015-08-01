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

  var _es_client = connect_elasticsearch(),
      _sql_client = connect_mysql();


  return {
    elasticsearch: _es_client,
    mysql: _sql_client
  }
})();
