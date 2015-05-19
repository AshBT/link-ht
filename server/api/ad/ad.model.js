'use strict';

var neo4j = require('neo4j');

var NEO_HOST = process.env['NEO_HOST'] || 'http://localhost:7474';
var NEO_PASS = process.env['NEO_PASS'];
var NEO_USER = process.env['NEO_USER'];

var db = new neo4j.GraphDatabase({
    url: 'http://localhost:7474',
    auth: {username: NEO_USER, password: NEO_PASS},     // optional; see below for more details
    headers: {},    // optional defaults, e.g. User-Agent
    proxy: null,    // optional URL
    agent: null,    // optional http.Agent instance, for custom socket pooling
});


var Ad = module.exports = function Ad(_node) {
	this._node = _node;
}

// public instance properties:

Object.defineProperty(Ad.prototype, 'id', {
    get: function () { return this._node.id; }
});

// public instance methods:

Ad.prototype.save = function (callback) {
    this._node.save(function (err) {
        callback(err);
    });
};

Ad.prototype.del = function (callback) {
    // use a Cypher query to delete this entity.
    var query = [
        'MATCH (ad:Ad)',
        'WHERE ID(ad) = {id}',
        'DELETE ad'
    ].join('\n')

    var params = {
        id: Number(this.id)
    };

    db.cypher({query:query, params:params}, function (err) {
        callback(err);
    });
};

// static methods:

Ad.get = function (id, callback) {
    // db.getNodeById(id, function (err, node) {
    //     if (err) return callback(err);
    //     callback(null, new Ad(node));
    // });
    var query = [
        'MATCH (ad:Ad)',
        'WHERE ID(ad) = {id}',
        'RETURN ad'
    ].join('\n')

    var params = {
        id: Number(id)
    };

    db.cypher({query:query, params:params}, function (err, results) {
        if (err) {
            console.log(err);
            return callback(err);
        }
        callback(null, new Ad(results[0]['ad']));
    });
};

Ad.getAll = function (callback) {
    var query = [
        'MATCH (ad:Ad)',
        'RETURN ad'
    ].join('\n');
    db.cypher(query, function (err, results) {
        if (err) return callback(err);
        var ads = results.map(function (result) {
            return new Ad(result['ad']);
        });
        callback(null, ads);
    });
};

// creates the entity and persists (saves) it to the db, incl. indexing it:
Ad.create = function (data, callback) {
    // construct a new instance of our class with the data, so it can
    // validate and extend it, etc., if we choose to do that in the future:
    //var node = db.createNode(data);
    //var ad = new Ad(node);

    // but we do the actual persisting with a Cypher query, so we can also
    // apply a label at the same time. (the save() method doesn't support
    // that, since it uses Neo4j's REST API, which doesn't support that.)
    var query = [
        'CREATE (ad:Ad {data})',
        'RETURN ad',
    ].join('\n');

    var params = {
        data: data
    };

    db.cypher({query:query, params:params}, function (err, results) {
        if (err) return callback(err);
        var ad = new Ad(results[0]['ad']);
        callback(null, ad);
    });
};

