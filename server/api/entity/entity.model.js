'use strict';

var neo4j = require('neo4j');
var db = new neo4j.GraphDatabase(
    process.env['NEO4J_URL'] ||
    process.env['GRAPHENEDB_URL'] ||
    'http://localhost:7474'
);

var Entity = module.exports = function Entity(_node) {
	this._node = _node;
}   

// public instance properties:

Object.defineProperty(Entity.prototype, 'id', {
    get: function () { return this._node.id; }
});

// public instance methods:

Entity.prototype.save = function (callback) {
    this._node.save(function (err) {
        callback(err);
    });
};

Entity.prototype.del = function (callback) {
    // use a Cypher query to delete this entity.
    var query = [
        'MATCH (entity:Entity)',
        'WHERE ID(entity) = {id}',
        'DELETE entity'
    ].join('\n')

    var params = {
        id: this.id
    };

    db.query(query, params, function (err) {
        callback(err);
    });
};

// static methods:

Entity.get = function (id, callback) {
    db.getNodeById(id, function (err, node) {
        if (err) return callback(err);
        callback(null, new Entity(node));
    });
};

Entity.linked = function(id, callback) {
    var query = [
        'MATCH (e:Entity)-[r:BY_PHONE|BY_USER]-(ad:Ad)',
        'WHERE ID(e) = {id}',
        'RETURN ad'
    ].join('\n');

    var params = {
        id: Number(id)
    }

    db.query(query, params, function(err, results){
        if (err) return callback(err);
        var ads = results;
        callback(null, ads)
    });
}

Entity.byPhone = function(id, callback) {
    var query = [
        'MATCH (e:Entity)-[:BY_PHONE]-(ad:Ad)',
        'WHERE ID(e) = {id}',
        'RETURN ad'
    ].join('\n');

    var params = {
        id: Number(id)
    }

    db.query(query, params, function(err, results){
        if (err) return callback(err);
        var ads = results;
        callback(null, ads)
    });
}


// Suggested ads, based on image similarity
Entity.byImage = function(id, callback) {
    var query = [
        'MATCH (e:Entity)-[:BY_IMG]-(ad:Ad)',
        'WHERE ID(e) = {id} and not (e)-[:BY_PHONE]-(ad) and not (e)-[:BY_USER]-(ad) ',
        'Return ad'
    ].join('\n');

    var params = {
        id: Number(id)
    }

    db.query(query, params, function(err, results){
        if (err) return callback(err);
        var ads = results;
        callback(null, ads)
    });
}

Entity.getAll = function (callback) {
    var query = [
        'MATCH (entity:Entity)',
        'RETURN entity',
        'LIMIT 100'
    ].join('\n');
    db.query(query, null, function (err, results) {
        if (err) return callback(err);
        var entities = results.map(function (result) {
            return new Entity(result['entity']);
        });
        callback(null, entities);
    });
};

// creates the entity and persists (saves) it to the db, incl. indexing it:
Entity.create = function (data, callback) {
    // construct a new instance of our class with the data, so it can
    // validate and extend it, etc., if we choose to do that in the future:
    var node = db.createNode(data);
    var entity = new Entity(node);

    // but we do the actual persisting with a Cypher query, so we can also
    // apply a label at the same time. (the save() method doesn't support
    // that, since it uses Neo4j's REST API, which doesn't support that.)
    var query = [
        'CREATE (entity:Entity {data})',
        'RETURN entity',
    ].join('\n');

    var params = {
        data: data
    };

    db.query(query, params, function (err, results) {
        if (err) return callback(err);
        var entity = new Entity(results[0]['entity']);
        callback(null, entity);
    });
};

