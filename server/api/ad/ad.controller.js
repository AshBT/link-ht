'use strict';

var _ = require('lodash');
var Ad = require('./ad.model');

// Get list of ads
exports.index = function(req, res) {
  Ad.find(function (err, ads) {
    if(err) { return handleError(res, err); }
    return res.json(200, ads);
  });
};

// Get a single ad
exports.show = function(req, res) {
  Ad.findById(req.params.id, function (err, ad) {
    if(err) { return handleError(res, err); }
    if(!ad) { return res.send(404); }
    return res.json(ad);
  });
};

// Creates a new ad in the DB.
exports.create = function(req, res) {
  Ad.create(req.body, function(err, ad) {
    if(err) { return handleError(res, err); }
    return res.json(201, ad);
  });
};

// Updates an existing ad in the DB.
exports.update = function(req, res) {
  if(req.body._id) { delete req.body._id; }
  Ad.findById(req.params.id, function (err, ad) {
    if (err) { return handleError(res, err); }
    if(!ad) { return res.send(404); }
    var updated = _.merge(ad, req.body);
    updated.save(function (err) {
      if (err) { return handleError(res, err); }
      return res.json(200, ad);
    });
  });
};

// Deletes a ad from the DB.
exports.destroy = function(req, res) {
  Ad.findById(req.params.id, function (err, ad) {
    if(err) { return handleError(res, err); }
    if(!ad) { return res.send(404); }
    ad.remove(function(err) {
      if(err) { return handleError(res, err); }
      return res.send(204);
    });
  });
};

function handleError(res, err) {
  return res.send(500, err);
}