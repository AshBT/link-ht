'use strict'

// (ECHU): Trying a new style for exporting modules.
module.exports = (function() {
  var db = require('../../databases'),
      mysql = require('mysql'),
      config = require('../../config/environment'),
      _ = require('lodash');

  var _search = function(query, size, page) {
    var starting_from = (page - 1) * size;

    return db.elasticsearch.search({
      index: config.elasticsearch.index,
      type: 'entity',
      size: size,
      from: starting_from,
      body: {
        query: {
          match: {
            "_all": query
          }
        }
      }
    }).then(function (body) {
      var hits = body.hits.hits;
      return {status: 200, payload: hits}
      // res.json({
      //   _num: size,
      //   _page: page,
      //   entities: hits
      // })
    }, function (error) {
      return {status: 400, payload: error};
      //res.status(400).json(error);
    });
  }

  var _count = function(query) {
    return db.elasticsearch.count({
      index: config.elasticsearch.index,
      type: 'entity',
      body: {
        query: {
          match: {
            "_all": query
          }
        }
      }
    }).then(function (body) {
      return {status: 200, payload: body.count}
      // res.json({
      //   total: body.count
      // })
    }, function (error) {
      return {status: 400, payload: error}
      //res.status(400).json(error);
    });
  }

  /** _getEntity
   *
   * _getEntity is a private function to get all the ads associated
   * with a given entity. Since the entity contains username fields for
   * the ads added by each user and a `base` field, those ads are
   * concatenated together, sorted, and then sliced before returning.
   *
   * A different solution might attempt to connect directly to the SQL
   * db for pagination instead of the manual one in this case.
   */
  var _getEntity = function(entity_id, size, page) {
    var starting_from = (page - 1) * size;

    return db.elasticsearch.getSource({
      index: config.elasticsearch.index,
      type: 'entity',
      id: entity_id
    }).then(function (source) {
      var ads = [];
      for (var key in source) {
        // other than the 'entity' key, all other keys are lists of ads
        if (key != 'entity') {
          var record = source[key];
          record.user = key;
          ads = ads.concat(record);
        }
      }
      ads.sort();
      return {status: 200, payload: {
        total: ads.length,
        ads: ads.slice(starting_from, starting_from + size)
      }};
    }, function (error) {
      return {status: 400, payload: error};
    });
  }

  /** _update
   *
   * This updates the elasticsearch instance.
   * Takes an entity_id, a username, a blob object, the operation,
   * and the http response object.
   *
   * The operation is one of 'add' or 'remove'.
   */
  var _update = function(entity_id, user, blob, operation, res) {
    var script;
    switch(operation) {
      case 'add':
        script = "if (ctx._source.containsKey(key)) { ctx._source[key] += blob } else { ctx._source[key] = [blob] }";
        break;
      case 'remove':
        script = "if (ctx._source.containsKey(key)) { ctx._source[key] -= blob }";
        break;
      default:
        throw new Error("Invalid operation '"+operation+"' requested.")
    }

    db.elasticsearch.update({
      index: config.elasticsearch.index,
      type: 'entity',
      id: entity_id,
      retryOnConflict: 5,
      body: {
        script: script,
        params: {
          key: user,
          blob: blob
        }
      }
    }).then(function(response) {
      res.json(response)
    }, function(error) {
      return res.status(400).json({error: error});
    })
  }

  var _construct_link = function(entity_id, linker, column_name, reason) {
      return "(SELECT t2.ad_id as id, json, "+mysql.escape(reason)+" as reason " +
        "FROM entities as e "+
        "JOIN "+mysql.escapeId(linker)+" as t1 ON e.ad_id = t1.ad_id " +
        "JOIN "+mysql.escapeId(linker)+" as t2 ON t2."+mysql.escapeId(column_name)+"=t1."+mysql.escapeId(column_name)+" AND NOT t2.ad_id IN (SELECT ad_id from entities where entity_id="+mysql.escape(entity_id)+") " +
        "JOIN ads ON t2.ad_id=ads.id " +
        "WHERE e.entity_id="+mysql.escape(entity_id)+")"
  }

  var search = function(req, res) {
    var number_per_page = req.query.size || 10,
        page = req.query.page || 1,
        count = req.query.count || "no";
    var query_string = req.body.query;
    if (query_string) {
      var search_deferred = _search(query_string, number_per_page, page),
          count_deferred = {status: 200, payload: undefined};
      if (count === "yes") {
        count_deferred = _count(query_string);
      }
      Promise.all([search_deferred, count_deferred])
        .then(function (results) {
          var search_result = results[0],
              count_result = results[1],
              return_result = {_max_num: number_per_page, _page: page};

          // handle any errors
          if (search_result.status == 400) {
            res.status(400).json({error: search_result.payload})
            return
          }
          if (count_result.status == 400) {
            res.status(400).json({error: count_result.payload})
            return
          }

          // merge the two results into one struct
          return_result.entities = search_result.payload;
          return_result.total = count_result.payload;
          res.json(return_result);
      })
    } else {
      res.status(400).json({error: "Expected 'query' in body."})
    }
  }

  var getEntity = function(req, res) {
    var entity_id = req.params.id,
        number_per_page = req.query.size || 10,
        page = req.query.page || 1,
        count = req.query.count || "no";

    _getEntity(entity_id, number_per_page, page)
      .then(function(result) {
        var return_result = {_max_num: number_per_page, _page: page};
        if (result.status == 400) {
          res.status(400).json({error: result.payload})
          return
        }
        return_result.ads = result.payload.ads;
        if (count === "yes") {
          return_result.total = result.payload.total;
        }
        res.json(return_result);
      });
  }

  var attachAd = function(req, res) {
    var entity_id = req.params.id,
        ad_id = req.params.ad_id,
        user = req.query.user || "auto";

    // first, insert into the table
    var query = "INSERT INTO entities (ad_id, entity_id, user) VALUES (?, ?, ?)";
    db.mysql.query(query, [ad_id, entity_id, user], function(err, rows) {
      if (err) {
        return res.status(400).json({error: err});
      }

      // upon a successful insert, let's find the json for the matching ad
      db.mysql.query("SELECT json FROM ads WHERE id=?", ad_id, function(err, rows) {
        if (err) {
          return res.status(400).json({error: err});
        }

        // once we have successfully written into the entities table, we
        // also have to update elasticsearch
        var blob = JSON.parse(rows[0].json);
        _update(entity_id, user, blob, 'add', res);
      });
    });
  }

  var detachAd = function(req, res) {
    var entity_id = req.params.id,
        ad_id = req.params.ad_id,
        user = req.query.user || "auto";

    // first, insert into the table
    var query = "DELETE FROM entities WHERE ad_id=? AND entity_id=? AND user=?";
    db.mysql.query(query, [ad_id, entity_id, user], function(err, rows) {
      if (err) {
        return res.status(400).json({error: err});
      }

      // upon a successful delete, let's find the json for the matching ad
      db.mysql.query("SELECT json FROM ads WHERE id=?", ad_id, function(err, rows) {
        if (err) {
          return res.status(400).json({error: err});
        }

        // once we have successfully deleted from the entities table, we
        // also have to update elasticsearch
        var blob = JSON.parse(rows[0].json);
        _update(entity_id, user, blob, 'remove', res);
      });
    });
  }

  var suggestAd = function(req, res) {
    var entity_id = req.params.id,
        number_per_page = parseInt(req.query.size) || 10,
        page = parseInt(req.query.page) || 1,
        count = req.query.count || "no";
    var starting_from = (page - 1) * number_per_page;

    var query = "SELECT id, json, group_concat(reason) as reasons FROM ("+
      _construct_link(entity_id, 'phone_link', 'phone_id', 'phone') +
      " UNION ALL " +
      _construct_link(entity_id, 'text_link', 'text_id', 'text') +
      ") as t GROUP BY id ORDER BY id LIMIT ?,?"

    var count_query = "SELECT count(distinct id) as total FROM ("+
      _construct_link(entity_id, 'phone_link', 'phone_id', 'phone') +
      " UNION ALL " +
      _construct_link(entity_id, 'text_link', 'text_id', 'text') +
      ") as t"

    db.mysql.query(query, [starting_from, number_per_page], function(err, rows) {
      if (err) {
        return res.status(400).json({error: err});
      }
      var payload = {suggestions: rows}
      if (count === "yes") {
        db.mysql.query(count_query, function(err, rows) {
          payload.total = rows[0].total;
          res.json(payload)
        })
      } else {
        res.json(payload)
      }
    })
  }

  return {
    search: search,
    suggestAd: suggestAd,
    getEntity: getEntity,
    attachAd: attachAd,
    detachAd: detachAd
  }
})();
