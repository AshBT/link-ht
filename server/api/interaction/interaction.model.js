'use strict';

var neo4j = require('neo4j');

var NEO_HOST = process.env['NEO_HOST'] || 'http://localhost:7474';
var NEO_USER = process.env['NEO_USER'] || 'neo4j';
var NEO_PASS = process.env['NEO_PASS'] || 'password';

var db = new neo4j.GraphDatabase({
    url: NEO_HOST,
    auth: {username: NEO_USER, password: NEO_PASS},     // optional; see below for more details
    headers: {},    // optional defaults, e.g. User-Agent
    proxy: null,    // optional URL
    agent: null,    // optional http.Agent instance, for custom socket pooling
});


var Interaction = module.exports = function Interaction(_node) {
	this._node = _node;
}

// Static methods

Interaction.saved = function (callback) {
	var query = [
	        'MATCH (e:Entity)',
	        'WHERE e.savedByUser = true',
	        'RETURN e'
	    ].join('\n');
    db.cypher(query, function (err, results) {
        if (err) return callback(err);
        var savedEntities = results.map(function (result) {
            return new Interaction(result['e']);
        });
        callback(null, savedEntities);
    });
};

Interaction.linkTypes = function(entityId, adId, callback) {
    var query = [
            'MATCH (e:Entity)',
            'WHERE e.savedByUser = true',
            'RETURN e'
        ].join('\n');

    var query = [
        'MATCH (entity:Entity)-[r]-(ad:Ad)',
        'WHERE ID(entity) = {entityId} AND ID(ad) = {adId}',      
        'RETURN DISTINCT TYPE(r)'
    ].join('\n')

    var params = {
        entityId: Number(entityId),
        adId: Number(adId)
    };

    db.cypher({query:query, params:params}, function (err, results) {
        if (err) return callback(err);
        var linkTypes = results.map(function (result) {
            return result['TYPE(r)'];
        });
        callback(null, linkTypes);
    });
}
