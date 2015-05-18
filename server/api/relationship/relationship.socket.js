/**
 * Broadcast updates to client when the model changes
 */

'use strict';

// var Relationship = require('./relationship.model');

// exports.register = function(socket) {
//   Relationship.schema.post('save', function (doc) {
//     onSave(socket, doc);
//   });
//   Relationship.schema.post('remove', function (doc) {
//     onRemove(socket, doc);
//   });
// }

// function onSave(socket, doc, cb) {
//   socket.emit('relationship:save', doc);
// }

// function onRemove(socket, doc, cb) {
//   socket.emit('relationship:remove', doc);
// }