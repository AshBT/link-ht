'use strict';

angular.module('memexLinkerApp')
  .controller('MainCtrl', function ($scope, $http, socket, lodash) {

    var _ = lodash;

    $scope.entities = [];

  $http.get('/api/entities').success(function(res) {
    var entities = _.map(res, function(e){
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
            var ads = _.map(res, function(element){ 
              return element.ad._data.data;
            });
            var postTimes = _.map(ads, function(ad){
                return new Date(ad.posttime);
              });
            var lastPostTime = _.max(postTimes);
            var imageUrls = lodash.flatten(
              _.map(ads, function(ad) {
                return ad.image_locations;
              }),
              true
            );
            imageUrls = _.filter(imageUrls, function(element){
              return ! _.isUndefined(element);
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
              $scope.entities.push(entitySummary);
            });            
          });
        });

    });
   
   });