'use strict';

angular.module('memexLinkerApp')
  .controller('MainCtrl', function ($scope, $http, socket, lodash) {

    var _ = lodash;

    $scope.logo = "http://icons.iconarchive.com/icons/icons8/ios7/256/Very-Basic-Paper-Clip-icon.png";
    $scope.blur = true;

    $scope.entities = [];

    $http.get('/api/entities').success(function(res) {
      var entities = _.map(res, function(e){
        // var _id = e._node._id;
        // var labels = e._node.labels;
        // var properties = e._node.properties;
        return {
          'id': e._node._id,
          'phone' : e._node.properties.identifier
        };
      });

    //Aggregate details from ads belonging to each entity.
    lodash.map(entities, function(entity) {

          $http.get('api/entities/' + entity.id + '/byphone').success(function(res){
            var ads = _.map(res, function(element){ 
              //console.log(element);
              var ad = {
                'id':element.ad._id,
                'labels':element.ad.labels,
                'properties':element.ad.properties
              };
              return ad;
            });
            var postTimes = _.map(ads, function(ad){
                return new Date(ad.properties.posttime);
              });
            var lastPostTime = _.max(postTimes);
            var imageUrls = lodash.flatten(
              _.map(ads, function(ad) {
                return ad.properties.image_locations;
              }),
              true
            );
            imageUrls = _.filter(imageUrls, function(element){
              return ! _.isUndefined(element);
            });

          // TODO: this should be done asynchronously.
          $http.get('api/entities/' + entity.id + '/byimage').success(function(res){
              var nSuggested = res.length;

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