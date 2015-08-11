'use strict';

var db = require('../../databases').neo4j;


var Relationship = module.exports = function Relationship(_node) {
	this._node = _node;
}

// public instance properties:

Object.defineProperty(Relationship.prototype, 'id', {
    get: function () { return this._node.id; }
});

// public instance methods:

Relationship.prototype.save = function (callback) {
    this._node.save(function (err) {
        callback(err);
    });
};

Relationship.prototype.del = function (callback) {
    // use a Cypher query to delete this relationship.
    var query = [
    	'MATCH ()-[r]-()',
    	'WHERE ID(r)={id}',
    	'DELETE r'
    ].join('\n')

    var params = {
        id: this.id
    };

    db.cypher({query:query, params:params}, function (err) {
        callback(err);
    });
};

// static methods:

Relationship.get = function (id, callback) {
    db.getRelationshipById(id, function (err, relationship) {
        if (err) return callback(err);
        console.log('relationship: ');
        console.log(relationship);
        callback(null, new Relationship(relationship));
    });
};


Relationship.getAll = function (callback) {
    var query = [
        'MATCH ()-[relationship]-()',
        'RETURN relationship',
        'LIMIT 200'
    ].join('\n');
    db.cypher(query, function (err, results) {
        if (err) return callback(err);
        var relationships = results.map(function (result) {
            return new Relationship(result['relationship']);
        });
        callback(null, relationships);
    });
};

// creates the entity and persists (saves) it to the db, incl. indexing it:
Relationship.create = function (data, callback) {

	console.log('Creating relationship...');
    console.log(data);

    var query = [
    	'MATCH (a),(b)',
		'WHERE id(a) = {idA} AND id(b) = {idB}',
		'CREATE (a)-[relationship:BY_USER {properties}]->(b)',
		'RETURN relationship'
    ].join('\n');

    var params = {
    	idA: data.idA,
    	idB: data.idB,
        properties: data.properties
    };

    console.log('params:')
    console.log(params);

    db.cypher({query:query, params:params}, function (err, results) {
        if (err) return callback(err);
        console.log(results);
        var relationship = new Relationship(results[0]['relationship']);
        console.log(relationship);
        callback(null, relationship);
    });
};
