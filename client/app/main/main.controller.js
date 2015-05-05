'use strict';

angular.module('memexLinkerApp')
  .controller('MainCtrl', function ($scope, $http, socket, lodash) {
    $scope.entities = [];

    // $http.get('/api/entities').success(function(res) {
    //     console.log(res);
    //     $scope.entities = lodash.map(res, function(e){
    //         var nodeData = e._node._data.data;
    //         var nodeMetaData = e._node._data.metadata;
    //         return {
    //           'id': nodeMetaData.id,
    //           'phone' : nodeData.identifier
    //         };
    //     });
    //     console.log($scope.entities);
    //     // get other data (e.g. ads) for each entity
    // });


  $http.get('/api/entities').success(function(res) {
    console.log(res);
    var entities = lodash.map(res, function(e){
      var nodeData = e._node._data.data;
      var nodeMetaData = e._node._data.metadata;
      return {
        'id': nodeMetaData.id,
        'phone' : nodeData.identifier
      };

    });

    lodash.map(entities, function(entity) {
          //entity.id
          // get ads for this id
          $http.get('api/entities/' + entity.id + '/byphone').success(function(res){
            var ads = lodash.map(res, function(element){ 
              return element.ad._data.data;
            });
            var postTimes = lodash.map(ads, function(ad){
                return ad.posttime;
              });
            $scope.entities.push({
              id: entity.id,
              phone: entity.phone,
              nPosts: ads.length,
              postTimes : postTimes
            });

          });

        });
    });
   
   });