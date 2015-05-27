'use strict';

angular.module('memexLinkerApp')
  .controller('MainCtrl', function ($scope, $http, $q, socket, lodash) {

    var _ = lodash;

    $scope.logo = "http://icons.iconarchive.com/icons/icons8/ios7/256/Very-Basic-Paper-Clip-icon.png";
    $scope.blur = true;

    $scope.entities = [];

    /* 
    * Returns the set of unique items, and removes undefined values.
    */
    function uniqueAndDefined(items) {
      return _.filter(_.uniq(items), function(item) {
        return ! _.isUndefined(item);
      });
    }

    function collectAdProperty(ads, propertyName) {
      return _.map(ads, function(ad) {
        return ad.properties[propertyName];
      });
    }

    /*
    * entity: 
    */ 
    function summarizeEntity(entity) {
      var deferred = $q.defer();
      
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

            var age = uniqueAndDefined(collectAdProperty(ads, 'age')).sort();
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

            var sourcesid = _.uniq(collectAdProperty(ads, 'sources_id'));
            var title = collectAdProperty(ads, 'title');
            var text = collectAdProperty(ads, 'text');
            var name = uniqueAndDefined(collectAdProperty(ads, 'name'));
            var city = uniqueAndDefined(collectAdProperty(ads, 'city'));
         
            var imageUrls = _.uniq(lodash.flatten(
              _.map(ads, function(ad) {
                return ad.properties.image_locations;
              }),
              true
            ));
            
            imageUrls = _.filter(imageUrls, function(element){
              return ! _.isUndefined(element);
            });

            var face = lodash.flatten(
              _.map(ads, function(ad) {
                return ad.properties.face_image_url;
              }),
              true
            );
            
            var face = _.uniq(face)
            face = _.filter(face, function(element){
              return ! _.isUndefined(element);
            });
            var n_faces= face.length

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
              deferred.resolve(entitySummary);
            });            
          });
      
      return deferred.promise;
    }

    $http.get('/api/entities').success(function(res) {
      var entities = _.map(res, function(e){
        return {
          'id': e._node._id,
          'phone' : e._node.properties.identifier
        };
      });

    //Aggregate details from ads belonging to each entity.
    _.forEach(entities, function(entity) {
      summarizeEntity(entity).then(function(entitySummary) {
        // success
        $scope.entities.push(entitySummary);
      }, function(reason) {
        console.log('Failed for ' + reason);
      });
    });

  });
});