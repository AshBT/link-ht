'use strict';

var _ = require('lodash');
var Interaction = require('./interaction.model');



function handleError(res, err) {
  console.log(err);
  return res.send(500, err);
}

// Get list of relationships
exports.saved = function(req, res) {
  Interaction.saved(function(err, entities) {
    if(err) return handleError(res, err);
    if(!entities) return res.send(404);
    console.log(entities);
    return res.json(entities);
  });
};

exports.linkTypes = function(req, res) {
    var entityId = req.body.entityId;
	var adId = req.body.adId;
  	Interaction.linkTypes(entityId, adId, function(err, linkTypes) {
  		if(err) return handleError(res, err);
  		console.log(linkTypes);
  		return res.json({linkTypes:linkTypes});
  	});
}

