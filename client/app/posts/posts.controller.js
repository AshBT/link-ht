'use strict';

angular.module('memexLinkerApp')
  .controller('PostsCtrl', function ($scope, $http, lodash) {

    $scope.ads = [];

    $http.get('/api/ads/').success(function(res) {
    	$scope.ads = _.map(res, function(element){ 
    		console.log(element);
              var ad = {
                'id':element._node._id,
                'labels':element._node.labels,
                'properties':element._node.properties
              };
              return ad;
            });
    });

  });
