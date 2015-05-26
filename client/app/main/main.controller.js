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
            var firstPostTime = _.min(postTimes);
            var age = _.map(ads, function(ad){
                return ad.properties.age;
              });
            var age = _.uniq(age);
            age.sort();
            var minAges = _.min(age);
            var maxAges = _.max(age);
            var rate60 = _.map(ads, function(ad){
                return ad.properties.rate60;
              });
            var rate60 = _.uniq(rate60);
            var priceRange = _.min(rate60) + "--" +  _.max(rate60);
            if (rate60[0]==null) {
              var priceRange = "Missing" ;
            }
            else if (rate60.length==1 & rate60[0]!=null) {
              var priceRange = rate60[0][0] ;
            }  

            var sourcesid = _.map(ads, function(ad){
                return ad.properties.sources_id;
              });
            var sourcesid = _.uniq(sourcesid);
            
            var title = _.map(ads, function(ad){
                return ad.properties.title;
              });
            var text = _.map(ads, function(ad){
                return ad.properties.text;
              });
            var name = _.map(ads, function(ad){
                return ad.properties.name;
              });
            var name = _.uniq(name);

            var city = _.map(ads, function(ad){
                return ad.properties.city;
              });
            var n_faces = _.map(ads, function(ad){
                return ad.properties.n_faces;
              });
            var n_faces = n_faces.filter(function(n){ return n != undefined });

            var n_faces = n_faces.reduce(function(a, b) {
              return a + b;
            });


            var imageUrls = lodash.flatten(
              _.map(ads, function(ad) {
                return ad.properties.image_locations;
              }),
              true
            );
            
            var imageUrls = _.uniq(imageUrls)
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
                firstPostTime: firstPostTime,
                age: age,
                minAges: minAges,
                maxAges: maxAges,
                imageUrls: imageUrls,
                priceRange: priceRange,
                rate60: rate60,
                sourcesid: sourcesid,
                title: title,
                text:text,
                name: name,
                city: city,
                n_faces: n_faces
              };
              $scope.entities.push(entitySummary);
            });            
          });
    });

  });
});