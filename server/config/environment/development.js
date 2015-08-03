'use strict';

// Development specific configuration
// ==================================
var env = require('./utils');
module.exports = {
  // MongoDB connection options
  mongo: {
    uri: 'mongodb://localhost/memexlinker-dev'
  },

  mysql: {
    user: 'root',
    password: '',
    host: 'localhost'
  },

  elasticsearch: {
    hosts: ['http://localhost:9200'],
    log: 'trace',
    index: 'entities'
  },

  neo4j: {
    host: 'http://localhost:7474',
    user: 'neo4j',
    password: 'password'
  },

  seedDB: true
};
