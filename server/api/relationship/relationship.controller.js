'use strict';

var _ = require('lodash');
var Relationship = require('./relationship.model');

// Get list of relationships
exports.index = function(req, res) {
  Relationship.getAll(function(err, relationships){
    if(err) {
      console.log(err);
      return handleError(res, err)
    }
    res.json(relationships);
  });
};

// Get a single relationship
exports.show = function(req, res) {
   Relationship.get(req.params.id, function(err, relationship) {
    if(err) return handleError(res, err);
    if(!relationship) return res.send(404);
    return res.json(relationship);
  });
};

// Creates a new relationship in the DB.
exports.create = function(req, res) {
  Relationship.create(req.body, function(err, relationship) {
    if(err) { return handleError(res, err); }
    return res.json(201, relationship);
  });
};

// // Updates an existing relationship in the DB.
// exports.update = function(req, res) {
//   if(req.body._id) { delete req.body._id; }
//   Relationship.findById(req.params.id, function (err, relationship) {
//     if (err) { return handleError(res, err); }
//     if(!relationship) { return res.send(404); }
//     var updated = _.merge(relationship, req.body);
//     updated.save(function (err) {
//       if (err) { return handleError(res, err); }
//       return res.json(200, relationship);
//     });
//   });
// };

// // Deletes a relationship from the DB.
// exports.destroy = function(req, res) {
//   Relationship.findById(req.params.id, function (err, relationship) {
//     if(err) { return handleError(res, err); }
//     if(!relationship) { return res.send(404); }
//     relationship.remove(function(err) {
//       if(err) { return handleError(res, err); }
//       return res.send(204);
//     });
//   });
// };

function handleError(res, err) {
  console.log(err);
  return res.send(500, err);
}