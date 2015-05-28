'use strict';

angular.module('memexLinkerApp')
.controller('MainCtrl', function ($scope, $http, $q, socket, lodash) {

  var _ = lodash;
  var source_map = new Array();

  source_map[1] = 'Backpage';
  source_map[2] = 'Craigslist';
  source_map[3] = 'Classivox';
  source_map[4] = 'MyProviderGuide';
  source_map[5] = 'NaughtyReviews';
  source_map[6] = 'RedBook';
  source_map[7] = 'CityVibe';
  source_map[8] = 'MassageTroll';
  source_map[9] = 'RedBookForum';
  source_map[10] = 'CityXGuide';
  source_map[11] = 'CityXGuideForum';
  source_map[12] = 'RubAds';
  source_map[13] = 'Anunico';
  source_map[14] = 'SipSap';
  source_map[15] = 'EscortsInCollege';
  source_map[16] = 'EscortPhoneList';
  source_map[17] = 'EroticMugshots';
  source_map[18] = 'EscortsAdsXXX';
  source_map[19] = 'EscortsinCA';
  source_map[20] = 'EscortsintheUS';
  source_map[21] = 'LiveEscortReviws';
  source_map[22] = 'MyProviderGuideForum';
  source_map[23] = 'USASexGuide';
  source_map[24] = 'EroticReview';
  source_map[25] = 'AdultSearch';
  source_map[26] = 'HappyMassage';
  source_map[27] = 'UtopiaGuide';
  source_map[28] = 'MissingKids';






  $scope.logo = 'http://icons.iconarchive.com/icons/icons8/ios7/256/Very-Basic-Paper-Clip-icon.png';
  $scope.blur = true;
  //var input = [{key:'1', value:'Backpage'},{key:'key2', value:'value2'}];
  $scope.entities = [];

    /* 
    * Returns the set of unique, flattened items, and removes undefined values.
    */
    
    function uniqueFlatAndDefined(items) {
      return _.filter(_.uniq(_.flatten(items)), function(item) {
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

        var age = uniqueFlatAndDefined(collectAdProperty(ads, 'age')).sort();
        var minAges = _.min(age);
        var maxAges = _.max(age);
        var rate60 = uniqueFlatAndDefined(collectAdProperty(ads, 'rate60'));
        var priceRange = 'Missing' ;
        if (rate60.length === 1 & rate60[0] != null) {
          var priceRange = rate60[0] ;
        }
        else if (rate60.length > 1) {
        var priceRange = _.min(rate60) + ' to ' +  _.max(rate60);
        }
        var website=[]
        var sourcesid = uniqueFlatAndDefined(collectAdProperty(ads, 'sources_id'));
        for (var i = 0; i < sourcesid.length; i++) { 
          website=website.concat(source_map[sourcesid[i]]);
          console.log(website);
        }
        website = _.filter(_.uniq(website), function(element){
          return ! _.isUndefined(element);
        });


        var title = collectAdProperty(ads, 'title');
        var text = collectAdProperty(ads, 'text');
        var name = uniqueFlatAndDefined(collectAdProperty(ads, 'name'));
        var city = uniqueFlatAndDefined(collectAdProperty(ads, 'city'));

        var imageUrls = _.uniq(lodash.flatten(
          _.map(ads, function(ad) {
            return ad.properties.image_locations;
          }),
          true
          ));

        imageUrls = _.filter(imageUrls, function(element){
          return ! _.isUndefined(element);
        });

        var face = uniqueFlatAndDefined(lodash.flatten(
          _.map(ads, function(ad) {
            return ad.properties.face_image_url;
          }),
          true
          ));

        var nFaces = face.length;

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
            nFaces: nFaces,
            website: website
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