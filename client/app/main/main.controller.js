'use strict';

angular.module('memexLinkerApp')
.controller('MainCtrl', function ($scope, $http, $q, socket, lodash) {

  var _ = lodash;
//Start -- Trying to add in accordion
    $scope.oneAtATime = true;

    $scope.groups = [
    {
      title: 'Dynamic Group Header - 1',
      content: 'Dynamic Group Body - 1'
    },
    {
      title: 'Dynamic Group Header - 2',
      content: 'Dynamic Group Body - 2'
    }
    ];

    $scope.items = ['Item 1', 'Item 2', 'Item 3'];

    $scope.addItem = function() {
    var newItemNo = $scope.items.length + 1;
    $scope.items.push('Item ' + newItemNo);
    };

    $scope.status = {
    isFirstOpen: true,
    isFirstDisabled: false
    };

//End -- Trying to add in accordion
  var source_map = {
    1 : 'Backpage',
    2 : 'Craigslist',
    3 : 'Classivox',
    4 : 'MyProviderGuide',
    5 : 'NaughtyReviews',
    6 : 'RedBook',
    7 : 'CityVibe',
    8 : 'MassageTroll',
    9 : 'RedBookForum',
    10 : 'CityXGuide',
    11 : 'CityXGuideForum',
    12 : 'RubAds',
    13 : 'Anunico',
    14 : 'SipSap',
    15 : 'EscortsInCollege',
    16 : 'EscortPhoneList',
    17 : 'EroticMugshots',
    18 : 'EscortsAdsXXX',
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
  $scope.blur = false;
  $scope.hasFacePic = false;
  $scope.entities1 = [];
  $scope.nSuggestedByText = 0;
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
    // var aggregates = new HashMap();
    // aggregates.set('entityIds', []);
    // aggregates.set('websites', []);
    // aggregates.set('names', []);
    // aggregates.set('nAds', 0);
    // aggregates.set('nPictures', 0);
    // aggregates.set('phones', []);
    // aggregates.set('ages', []);
    // aggregates.set('socialMediaAccounts', []);
    // aggregates.set('cities', []);
    // aggregates.set('prices', []);
    // aggregates.set('ethnicities', []);
    // aggregates.set('twitters', []);
    // aggregates.set('instagrams', []);
    // return aggregates;
    return {
      'entityIds': [],
      'websites': [],
      'names': [],
      'nAds': 0,
      'nPictures': 0,
      'phones': [],
      'ages': [],
      'socialMediaAccounts': [],
      'cities': [],
      'prices': [],
      'ethnicities': [],
      'twitters': [],
      'instagrams': [],
      
      set: function(key, value) {
        this[key] = value
        return this
      },
      get: function(key) {
        return this[key]
      }
    };
  }

  // Temporary hashmap for computing search result aggregate statistics.
  $scope.aggregates = initAggregates();

    /*
    * Returns the set of unique, flattened items, and removes undefined values.
    */

    function uniqueFlatAndDefined(items) {
      return _.filter(_.uniq(_.flattenDeep(items)), function(item) {
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


        var instagram = uniqueFlatAndDefined(collectAdProperty(ads, 'instagram'));
        var twitter = uniqueFlatAndDefined(collectAdProperty(ads, 'twitter'));
        var ethnicity = uniqueFlatAndDefined(collectAdProperty(ads, 'ethnicity'));
        var imageUrls = _.uniq(lodash.flatten(
          _.map(ads, function(ad) {
            return ad.properties.image_locations;
          }),
          true
          ));

        imageUrls = _.filter(imageUrls, function(element){
          return ! _.isUndefined(element);
        });
        var face = _.uniq(lodash.flatten(
          _.map(ads, function(ad) {
            return ad.properties.face_image_url;
          }),
          true
          ));
        face= _.filter(face, function(element){
          return ! _.isUndefined(element);
        });


        $http.get('api/entities/' + entity.id + '/bytext').success(function(res){
          $scope.nSuggestedByText = res.length;
          console.log($scope.nSuggestedByText);
        });
        // TODO: refactor server to provide all suggested ads, with reason(s) why each was suggested.


        $http.get('api/entities/' + entity.id + '/byimage').success(function(res){
          var nSuggestedByImage = res.length;

          var entitySummary = {
            id: entity.id,
            phone: entity.phone,
            nPosts: ads.length,
            nPics: imageUrls.length,
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
            website: website,
            twitter: twitter,
            instagram: instagram,
            ethnicity: ethnicity,
            face: face
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
  //Names
  var names = aggregates.get('names');
  names.push(entitySummary.name);
  aggregates.set('names', uniqueFlatAndDefined(names));
  //Instagram
  var instagrams = aggregates.get('instagrams');
  instagrams.push(entitySummary.instagram);
  aggregates.set('instagrams', uniqueFlatAndDefined(instagrams));
  //Names
  var twitters = aggregates.get('twitters');
  twitters.push(entitySummary.twitter);
  aggregates.set('twitters', uniqueFlatAndDefined(twitters));
  //Ethnicities
  var ethnicities = aggregates.get('ethnicities');
  ethnicities.push(entitySummary.ethnicity);
  aggregates.set('ethnicities', uniqueFlatAndDefined(ethnicities));
  // Ads
  var nAds = aggregates.get('nAds');
  aggregates.set('nAds', nAds + Number(entitySummary.nPosts));
  //Images
  var nPictures = aggregates.get('nPictures');
  aggregates.set('nPictures', nPictures + Number(entitySummary.nPics));
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
  ages.push(entitySummary.age);
  var listages = uniqueFlatAndDefined(ages);
  aggregates.set('age_min', _.min(_.filter(uniqueFlatAndDefined(ages), function(n) {
    return Number((n % 1 ) == 0);
  })));
    aggregates.set('age_max', _.max(_.filter(uniqueFlatAndDefined(ages), function(n) {
    return Number((n % 1 ) == 0);
  })));
// Prices
  var prices = aggregates.get('prices');
  prices.push(entitySummary.rate60);
  var listprices = uniqueFlatAndDefined(prices);
  aggregates.set('price_min', _.min(_.filter(uniqueFlatAndDefined(listprices), function(n) {
    return (n % 1) == 0;
  })));
  aggregates.set('price_max', _.max(_.filter(uniqueFlatAndDefined(listprices), function(n) {
    return (n % 1) == 0;
  })));
}

$scope.submitSearch = function(){
    console.log('submitSearch...');
    if ($scope.searchText) {
          console.log($scope.searchText);

    $scope.searchText2= ".*" + $scope.searchText + ".*" 

    $http.post('/api/entities/', {searchText : $scope.searchText2}).success(function(res) {
      $scope.entities1 = [];
      var returnedEntities = _.map(res, function(e){
          return {
            'id': e._node._id,
            'phone' : e._node.properties.identifier
          };
        });

        $scope.aggregates = initAggregates();
        //Aggregate details from ads belonging to each entity.
        _.forEach(returnedEntities, function(entity) {
          summarizeEntity(entity).then(function(entitySummary) {
            // success
            $scope.entities1.push(entitySummary);
            // console.log('------------');
            // console.log($scope.entities1);
            // console.log('------------');
            updateAggregates(entitySummary,$scope.aggregates);
          }, function(reason) {
            console.log('Failed for ' + reason);
          });

        });

      });
}

};

$scope.facesFilter = function(e,hasFacePic){
  return e.face.length >=1 || !$scope.hasFacePic;
  }



});




