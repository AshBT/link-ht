/**
 * Broadcast updates to client when the model changes
 */

'use strict';

var Elastic = require('./elastic.model');

exports.register = function(socket) {
  Elastic.schema.post('save', function (doc) {
    onSave(socket, doc);
  });
  Elastic.schema.post('remove', function (doc) {
    onRemove(socket, doc);
  });
}

function onSave(socket, doc, cb) {
  socket.emit('elastic:save', doc);
}

function onRemove(socket, doc, cb) {
  socket.emit('elastic:remove', doc);
}