/**
 * Broadcast updates to client when the model changes
 */

'use strict';

var Ad = require('./ad.model');

exports.register = function(socket) {
  Ad.schema.post('save', function (doc) {
    onSave(socket, doc);
  });
  Ad.schema.post('remove', function (doc) {
    onRemove(socket, doc);
  });
}

function onSave(socket, doc, cb) {
  socket.emit('ad:save', doc);
}

function onRemove(socket, doc, cb) {
  socket.emit('ad:remove', doc);
}