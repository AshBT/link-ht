'use strict';

// Production specific configuration
// =================================
var env = require('./utils');
module.exports = {
  // Server IP
  ip:       process.env.OPENSHIFT_NODEJS_IP ||
            process.env.IP ||
            undefined,

  // Server port
  port:     process.env.OPENSHIFT_NODEJS_PORT ||
            process.env.PORT ||
            8080,
            
  mysql: {
    user: env.required('SQL_USER'),
    password: env.required('SQL_PASS'),
    host: env.required('SQL_HOST')
  },

  elasticsearch: {
    hosts: env.required('ELS_HOSTS').split(","),
    log: [{
      type: 'stdio',
      levels: ['error', 'warning']
    }],
    index: 'entities-prod'
  },

  neo4j: {
    host: env.required('NEO_HOST'),
    user: env.required('NEO_USER'),
    password: env.required('NEO_PASS')
  },

  imagesearch: {
    user: env.required('ISI_USER'),
    pass: env.required('ISI_PASS')
  }
};
