'use strict';

angular.module('memexLinkerApp')
.controller('SavedentitiesCtrl', function ($scope, $http, $q, socket, lodash, entityService, linkUtils, Crossfilter) {

    var _ = lodash;
    var uniqueFlatAndDefined = linkUtils.uniqueFlatAndDefined;
    var collectAdProperty = linkUtils.collectAdProperty;
    var collectAdProperty2 = linkUtils.collectAdProperty2;

    console.log("/api/annotations/search")
    $http.get('/api/annotations/search').then(function(response){
    var x=[]
    for (var i = 0; i < response.data.length; i++) {
      x[i] = response.data[i]._source.entityid
    }
    x = (_.uniq(x))
    console.log(x)

    }, function(response) {
      console.log("error...")
      });
  });
