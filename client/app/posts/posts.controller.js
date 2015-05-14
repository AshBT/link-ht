'use strict';

angular.module('memexLinkerApp')
  .controller('PostsCtrl', function ($scope, $http, lodash) {

    $scope.ads = [];

    $http.get('/api/ads/').success(function(res) {
        $scope.ads = lodash.map(res, function(element){ 
              return element._node._data.data;
            });
        console.log($scope.ads);
    });

  });
