'use strict';

angular.module('memexLinkerApp')
.controller('MainCtrl', function ($scope, $http, $q, socket, lodash) {

  var _ = lodash;

  var source_map = {
    1 : 'Backpage',
    2 : 'Craigslist',
    3 : 'Classivox',
    4 : 'MyProviderGuide',
    5 : 'NaughtyReviews',
    6 : 'RedBook',
    7 : 'CityVibe',
    8 :  'MassageTroll',
    9 : 'RedBookForum',
    10 : 'CityXGuide',
    11 : 'CityXGuideForum',
    12 : 'RubAds',
    13 : 'Anunico',
    14 : 'SipSap',
    15 : 'EscortsInCollege',
    16 : 'EscortPhoneList',
    17 : 'EroticMugshots',
    18 :  'EscortsAdsXXX',
    19 : 'EscortsinCA',
    20 : 'EscortsintheUS',
    21 : 'LiveEscortReviws',
    22 : 'MyProviderGuideForum',
    23 : 'USASexGuide',
    24 : 'EroticReview',
    25 : 'AdultSearch',
    26 : 'HappyMassage',
    27: 'UtopiaGuide',
    28 : 'MissingKids'
  };

  $scope.logo = 'http://icons.iconarchive.com/icons/icons8/ios7/256/Very-Basic-Paper-Clip-icon.png';
  $scope.blur = true;
  $scope.searchedEntities = [];
  // $scope.searchAggregates = {
  //   nEntites: 0,
  //   nAds: 0,
  //   nPictures: 0,
  //   phones: [],
  //   websites: [],
  //   ages: [],
  //   socialMediaAccounts: [],
  //   prices: [],
  //   cities: [],
  //   ethnicities: []
  // };

  function initAggregates() {
    var aggregates = new HashMap();
    aggregates.set('entityIds', []);
    aggregates.set('websites', []);
    aggregates.set('nAds', 0);
    aggregates.set('nPictures', 0);
    aggregates.set('phones', []);
    aggregates.set('ages', []);
    aggregates.set('socialMediaAccounts', []);
    aggregates.set('cities', []);
    aggregates.set('prices', []);
    aggregates.set('ethnicities', []);
    return aggregates;
  }

  // Temporary hashmap for computing search result aggregate statistics.
  $scope.aggregates = initAggregates();

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
        if (rate60.length === 1 && rate60[0] != null) {
          priceRange = rate60[0] ;
        }
        else if (rate60.length > 1) {
          priceRange = _.min(rate60) + ' to ' +  _.max(rate60);
        }
        var website=[];
        var sourcesid = uniqueFlatAndDefined(collectAdProperty(ads, 'sources_id'));
        for (var i = 0; i < sourcesid.length; i++) { 
          website=website.concat(source_map[sourcesid[i]]);
          //  console.log(website);
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

        // TODO: refactor server to provide all suggested ads, with reason(s) why each was suggested.
        $http.get('api/entities/' + entity.id + '/byimage').success(function(res){
          var nSuggestedByImage = res.length;

          var entitySummary = {
            id: entity.id,
            phone: entity.phone,
            nPosts: ads.length,
            nSuggestedByImage: nSuggestedByImage,
            nSuggestedByText: 0,
            nSuggestedByPhone: 0,
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

function updateAggregates(entitySummary, aggregates) {
  // Entity IDs
  var entityIds = aggregates.get('entityIds');
  entityIds.push(entitySummary.id);
  aggregates.set('entityIds', uniqueFlatAndDefined(entityIds));
  // Websites
  var websites = aggregates.get('websites');
  websites.push(entitySummary.website);
  aggregates.set('websites', uniqueFlatAndDefined(websites));
  // Ads
  var nAds = aggregates.get('nAds');
  aggregates.set('nAds', nAds + entitySummary.nPosts);
  // Cities
  var cities = aggregates.get('cities');
  cities.push(entitySummary.city);
  aggregates.set('cities', uniqueFlatAndDefined(cities));
  // Phones
  var phones = aggregates.get('phones');
  phones.push(entitySummary.phone);
  aggregates.set('phones', uniqueFlatAndDefined(phones));
  // Ages
  var ages = aggregates.get('ages');
  phones.push(entitySummary.age);
  aggregates.set('ages', uniqueFlatAndDefined(ages));

}

// $http.get('/api/entities').success(function(res) {
//   var entities = _.map(res, function(e){
//     return {
//       'id': e._node._id,
//       'phone' : e._node.properties.identifier
//     };
//   });

//     //Aggregate details from ads belonging to each entity.
//     _.forEach(entities, function(entity) {
//       summarizeEntity(entity).then(function(entitySummary) {
//         // success
//         $scope.entities.push(entitySummary);
//         //console.log(entitySummary);
//       }, function(reason) {
//         console.log('Failed for ' + reason);
//       });
//     });
//   });

$scope.submitSearch = function(){
    console.log('submitSearch...');
    if ($scope.searchText) {
          console.log($scope.searchText);
       
    $http.post('/api/entities/search', {searchText : $scope.searchText}).success(function(res) {
      $scope.searchedEntities = [];
      var returnedEntities = _.map(res, function(e){
          return {
            'id': e._node._id,
            'phone' : e._node.properties.identifier
          };
        });

        //Aggregate details from ads belonging to each entity.
        _.forEach(returnedEntities, function(entity) {
          summarizeEntity(entity).then(function(entitySummary) {
            $scope.searchedEntities.push(entitySummary);
            updateAggregates(entitySummary, $scope.aggregates);
            console.log($scope.aggregates);
          }, function(reason) {
            console.log('Failed for ' + reason);
          });
        });
      });
}
};




});
