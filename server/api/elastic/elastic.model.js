'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    db = require('../../databases').neo4j;

var ElasticSchema = new Schema({
  name: String,
  info: String,
  active: Boolean
});

module.exports = mongoose.model('Elastic', ElasticSchema);


var Elastic = module.exports = function Elastic(_node) {
	this._node = _node;
}


// public instance properties:

Object.defineProperty(Elastic.prototype, 'id', {
    get: function () { return this._node.id; }
});

// public instance methods:

Elastic.prototype.save = function (callback) {
    this._node.save(function (err) {
        callback(err);
    });
};

// COMMENT ON LAST IDEA: The issue is writing the Neo4j function and it's the db.cypher line where we're failing
Elastic.getNeo4j = function (searchText, callback) {
  // console.log(searchText)
    var query = [
        'MATCH (entity:Entity)-[r:BY_PHONE]-(n:Ad)',
        'WHERE HAS(n.id) AND n.id IN {searchText}',
        'RETURN DISTINCT entity',
        'LIMIT 50'
    ].join('\n');

    var params = {
        searchText : searchText,
    };
    db.cypher({query:query,params:params}, function(err, results) {
        if (err) {
          console.log("BIG Error");
          return callback(err);
        }
        //console.log(results);
        //{entity: { _id: 28380, labels: [Object], properties: [Object] }}
        var entities = results.map(function(result){
            return new Elastic(result.entity);
        });
        callback(null, entities);
    });
};
