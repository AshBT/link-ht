'use strict';

/* any database clients should go here. */
module.exports = (function() {

  var connect_elasticsearch = function() {
    var elasticsearch = require('elasticsearch');
    var LINK_HT_ES_HOST = process.env['LINK_HT_ES_HOST'] || 'http://localhost:9200';
    return new elasticsearch.Client({
      host: LINK_HT_ES_HOST,
      log: 'trace'
    });
  }

  var connect_mysql = function() {
    var mysql = require('mysql');
    var SQL_USER = process.env['SQL_USER'] || 'root',
        SQL_HOST = process.env['SQL_HOST'] || 'localhost',
        SQL_PASS = process.env['SQL_PASS'] || '',
        SQL_DB = process.env['SQL_DB'] || 'link_ht';
    return mysql.createConnection({
      host     : SQL_HOST,
      user     : SQL_USER,
      password : SQL_PASS,
      database : SQL_DB
    });
  }

  var _es_client = connect_elasticsearch(),
      _sql_client = connect_mysql();


  return {
    elasticsearch: _es_client,
    mysql: _sql_client
  }
})();
