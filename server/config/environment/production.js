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

  // MongoDB connection options
  mongo: {
    uri:    process.env.MONGOLAB_URI ||
            process.env.MONGOHQ_URL ||
            process.env.OPENSHIFT_MONGODB_DB_URL+process.env.OPENSHIFT_APP_NAME ||
            'mongodb://' + process.env.MONGO_PORT_27017_TCP_ADDR + ':' + process.env.MONGO_PORT_27017_TCP_PORT + '/memexlinker' ||
            'mongodb://localhost/memexlinker'
  },

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
  }
};
