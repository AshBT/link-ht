'use strict';

var db = require('../../databases').neo4j;

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

    db.cypher({query:query, params:params}, function (err) {
        callback(err);
    });
};

// static methods:

Entity.get = function (id, callback) {
    var query = [
        'MATCH (entity:Entity)',
        'WHERE ID(entity) = {id}',
        'RETURN entity'
    ].join('\n')

    var params = {
        id: Number(id)
    };

    db.cypher({query:query, params:params}, function (err, results) {
        if (err) {
            console.log(err);
            return callback(err);
        }
        callback(null, new Entity(results[0]['entity']));
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

    db.cypher({query:query, params:params}, function(err, results){
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

    db.cypher({query:query, params:params}, function(err, results){
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
        'Return count(ad)'
    ].join('\n');

    var params = {
        id: Number(id)
    }

    db.cypher({query:query, params:params}, function(err, results){
        if (err) return callback(err);
        var ads = results;
        callback(null, ads)
    });
}

// Suggested ads, based on text similarity
Entity.byText = function(id, callback) {
    var query = [
        'MATCH (e:Entity)-[:BY_TXT]-(ad:Ad)',
        'WHERE ID(e) = {id} and not (e)-[:BY_PHONE]-(ad) and not (e)-[:BY_USER]-(ad) ',
        'Return count(ad)'
    ].join('\n');

    var params = {
        id: Number(id)
    }

    db.cypher({query:query, params:params}, function(err, results){
        if (err) return callback(err);
        var ads = results;
        callback(null, ads)
    });
}

Entity.getAll = function (callback) {
    var query = [
        'MATCH (entity:Entity)',
        'RETURN entity',
        'LIMIT 200'
    ].join('\n');
    // db.query(query, null, function (err, results) {
    //     if (err) return callback(err);
    //     var entities = results.map(function (result) {
    //         return new Entity(result['entity']);
    //     });
    //     callback(null, entities);
    // });
    db.cypher(query, function(err, results) {
        if (err) return callback(err);
        //console.log(results);
        //{entity: { _id: 28380, labels: [Object], properties: [Object] }}
        var entities = results.map(function(result){
            return new Entity(result.entity);
        });
        callback(null, entities);
    });
};

Entity.getSearch = function (searchText, callback) {
    var query = [
        'MATCH (entity:Entity)-[r:BY_PHONE]-(n:Ad)',
        'WHERE n.title =~ {searchText} OR n.text =~ {searchText} OR ANY(name IN n.phone WHERE name =~ {searchText})',
        'RETURN DISTINCT entity',
        'LIMIT 50'
    ].join('\n');

    var params = {
        searchText : searchText,
    };
    db.cypher({query:query,params:params}, function(err, results) {
        if (err) return callback(err);
        //console.log(results);
        //{entity: { _id: 28380, labels: [Object], properties: [Object] }}
        var entities = results.map(function(result){
            return new Entity(result.entity);
        });
        callback(null, entities);
    });
};

// Entity.getSearch = function (searchText, callback) {
//     console.log("A1")
//     var query = [
//         'MATCH (entity:Entity)-[r:BY_PHONE]-(n:Ad)',
//         'WHERE HAS(n.id) AND ANY (m IN {searchText} WHERE m IN n.id)',
//         'RETURN DISTINCT entity',
//         'LIMIT 50'
//     ].join('\n');

//     var params = {
//         searchText : searchText,
//     };
//     console.log("A2")
//     console.log(params)
//     db.cypher({query:query,params:params}, function(err, results) {
//         if (err) return callback(err);
//         //console.log(results);
//         //{entity: { _id: 28380, labels: [Object], properties: [Object] }}
//         var entities = results.map(function(result){
//             return new Entity(result.entity);
//         });
//         console.log(entities)
//         callback(null, entities);
//     });
// };


Entity.savedByUser = function(data, callback) {
    console.log(data);
    var query = [
        'MATCH (e:Entity)',
        'WHERE ID(e) = {id}',
        'SET e += {savedByUser : true}',
        'RETURN e'
    ].join('\n');

    var params = {
        id: Number(data.entityId)
    }

    db.cypher({query:query, params:params}, function(err, results){
        if (err) return callback(err);
        console.log(results);
        callback(null);
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

    db.cypher({query:query, params:params}, function (err, results) {
        if (err) return callback(err);
        var entity = new Entity(results[0]['entity']);
        callback(null, entity);
    });
};
