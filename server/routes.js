/**
 * Main application routes
 */

'use strict';

var errors = require('./components/errors');

module.exports = function(app) {

  // Insert routes below
  app.use('/api/notes', require('./api/note'));
  app.use('/api/loggings', require('./api/logging'));
  app.use('/api/elastics', require('./api/elastic'));
  app.use('/api/relationships', require('./api/relationship'));
  app.use('/api/ads', require('./api/ad'));
  app.use('/api/entities', require('./api/entity'));
  app.use('/api/users', require('./api/user'));
  app.use('/api/interactions', require('./api/interaction'));

  // V1 API endpoints
  app.use('/api/v1', require('./api/v1'));

  // google app engine handlers
  app.use(require('./lib/appengine-handlers'));

  app.use('/auth', require('./auth'));

  // All undefined asset or api routes should return a 404
  app.route('/:url(api|auth|components|app|bower_components|assets)/*')
   .get(errors[404]);

  // All other routes should redirect to the index.html
  app.route('/*')
    .get(function(req, res) {
      res.sendfile(app.get('appPath') + '/index.html');
    });
};
