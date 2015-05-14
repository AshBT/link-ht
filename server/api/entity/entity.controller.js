'use strict';

var _ = require('lodash');
var Entity = require('./entity.model');

// Get list of entities
exports.index = function(req, res) {
  Entity.getAll(function(err, entities){
    if(err) {
      console.log(err);
      return handleError(res, err)
    }
    res.json(entities);
  });
};

// Get a single entity
exports.show = function(req, res) {
  Entity.get(req.params.id, function(err, entity) {
    if(err) return handleError(res, err);
    if(!entity) return res.send(404);
    return res.json(entity);
  });
};

exports.byPhone = function(req, res) {
  Entity.byPhone(req.params.id, function(err, ads) {
    if(err) return handleError(res, err);
      return res.json(ads);
  });
}

exports.byImage = function(req, res) {
  Entity.byImage(req.params.id, function(err, ads) {
    if(err) return handleError(res, err);
      return res.json(ads);
  });
}

// Creates a new entity in the DB.
exports.create = function(req, res) {
  Entity.create(req.body, function(err, entity) {
    if(err) { return handleError(res, err); }
    return res.json(201, entity);
  });
};

// // Updates an existing entity in the DB.
// exports.update = function(req, res) {
//   if(req.body._id) { delete req.body._id; }
//   Entity.findById(req.params.id, function (err, entity) {
//     if (err) { return handleError(res, err); }
//     if(!entity) { return res.send(404); }
//     var updated = _.merge(entity, req.body);
//     updated.save(function (err) {
//       if (err) { return handleError(res, err); }
//       return res.json(200, entity);
//     });
//   });
// };

// // Deletes a entity from the DB.
// exports.destroy = function(req, res) {
//   Entity.findById(req.params.id, function (err, entity) {
//     if(err) { return handleError(res, err); }
//     if(!entity) { return res.send(404); }
//     entity.remove(function(err) {
//       if(err) { return handleError(res, err); }
//       return res.send(204);
//     });
//   });
// };

function handleError(res, err) {
  return res.send(500, err);
}