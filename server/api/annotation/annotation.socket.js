/**
 * Broadcast updates to client when the model changes
 */

'use strict';

var Annotation = require('./annotation.model');

exports.register = function(socket) {
  Annotation.schema.post('save', function (doc) {
    onSave(socket, doc);
  });
  Annotation.schema.post('remove', function (doc) {
    onRemove(socket, doc);
  });
}

function onSave(socket, doc, cb) {
  socket.emit('annotation:save', doc);
}

function onRemove(socket, doc, cb) {
  socket.emit('annotation:remove', doc);
}