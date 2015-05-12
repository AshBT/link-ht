'use strict';

angular.module('memexLinkerApp')
  .controller('MainCtrl', function ($scope, $http, socket, lodash) {
    $scope.entities = [];

  $http.get('/api/entities').success(function(res) {
    var entities = lodash.map(res, function(e){
      var nodeData = e._node._data.data;
      var nodeMetaData = e._node._data.metadata;
      return {
        'id': nodeMetaData.id,
        'phone' : nodeData.identifier
      };
    });

    // Aggregate details from ads belonging to this entity.
    lodash.map(entities, function(entity) {

          $http.get('api/entities/' + entity.id + '/byphone').success(function(res){
            var ads = lodash.map(res, function(element){ 
              return element.ad._data.data;
            });
            var postTimes = lodash.map(ads, function(ad){
                // TODO: 
                return new Date(ad.posttime);
              });
            var lastPostTime = lodash.max(postTimes);
            var imageUrls = lodash.flatten(
              lodash.map(ads, function(ad) {
                return ad.image_locations;
              }),
              true
            );
            imageUrls = lodash.filter(imageUrls, function(element){
              return ! lodash.isUndefined(element);
            });

          // TODO: this should be done asynchronously.
          $http.get('api/entities/' + entity.id + '/byimage').success(function(res){
              var nSuggested = res.length;
              // var suggestedAds = lodash.map(res, function(element){
              //   var nodeData = element.ad._data.data;
              //   var nodeMetaData = element.ad._data.metadata;
              //   return {
              //     'id': nodeMetaData.id,
              //     'data' : nodeData
              //   };            
              // });

              var entitySummary = {
                id: entity.id,
                phone: entity.phone,
                nPosts: ads.length,
                nSuggested: nSuggested,
                postTimes : postTimes,
                lastPostTime: lastPostTime,
                imageUrls: imageUrls
              };
              //console.log(entitySummary);
              $scope.entities.push(entitySummary);
            });            
          });
        });

    });
   
   });