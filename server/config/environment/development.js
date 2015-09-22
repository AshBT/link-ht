'use strict';

// Development specific configuration
// ==================================
var env = require('./utils');
module.exports = {

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

  imagesearch: {
    user: env.required('ISI_USER'),
    pass: env.required('ISI_PASS')
  },

  seedDB: true
};
