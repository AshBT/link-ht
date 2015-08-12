/**
 * Broadcast updates to client when the model changes
 */

'use strict';

var Logging = require('./logging.model');

exports.register = function(socket) {
  Logging.schema.post('save', function (doc) {
    onSave(socket, doc);
  });
  Logging.schema.post('remove', function (doc) {
    onRemove(socket, doc);
  });
}

function onSave(socket, doc, cb) {
  socket.emit('logging:save', doc);
}

function onRemove(socket, doc, cb) {
  socket.emit('logging:remove', doc);
}