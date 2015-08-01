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
    log: 'trace'
  },
  seedDB: true
};
