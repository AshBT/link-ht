'use strict';

angular.module('memexLinkerApp')
.controller('SavedentitiesCtrl', function ($scope, $http, $q, socket, lodash, entityService, linkUtils, Crossfilter) {
  var _ = lodash;
  // var uniqueFlatAndDefined = linkUtils.uniqueFlatAndDefined;
  // var collectAdProperty = linkUtils.collectAdProperty;
  // var collectAdProperty2 = linkUtils.collectAdProperty2;
  // var _SEARCH_URL = '/api/v1/search';
  $scope.entities = [];
  $scope.adIds = [];

  var sources = {
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
    21 : 'LiveEscortReviews',
    22 : 'MyProviderGuideForum',
    23 : 'USASexGuide',
    24 : 'EroticReview',
    25 : 'AdultSearch',
    26 : 'HappyMassage',
    27: 'UtopiaGuide',
    28 : 'MissingKids'
  };

  function _formatEntity(rawEntity) {
    var ads = rawEntity._source.base;
    var postTimes = _.map(ads, function(ad){
      return new Date(ad.posttime);
    });
    var lastPostTime = _.max(postTimes);
    var firstPostTime = _.min(postTimes);
    var ages = linkUtils.uniqueFlatAndDefined(linkUtils.collectAdProperty(ads, 'age')).sort();
    var rates60 = linkUtils.uniqueFlatAndDefined(linkUtils.collectAdProperty(ads, 'rate60')).sort();
    var websites=[];
    var sourcesid = linkUtils.uniqueFlatAndDefined(linkUtils.collectAdProperty(ads, 'sources_id'));
    for (var i = 0; i < sourcesid.length; i++) {
      websites = websites.concat(sources[sourcesid[i]]);
    }
    websites = _.filter(_.uniq(websites), function(element){
      return ! _.isUndefined(element);
    });
    var phones = linkUtils.uniqueFlatAndDefined(linkUtils.collectAdProperty(ads, 'phone'));
    var titles = linkUtils.collectAdProperty(ads, 'title');
    var texts = linkUtils.collectAdProperty(ads, 'text');
    var snippet1= "";
    var snippet2= "";
    var snippet3= "";
    var all_text = titles + texts;
    var names = linkUtils.uniqueFlatAndDefined(linkUtils.collectAdProperty(ads, 'name'));
    var cities = linkUtils.uniqueFlatAndDefined(linkUtils.collectAdProperty(ads, 'city'));
    for (var i = 0; i < cities.length; i++) {
      cities[i]=cities[i].substring(0,20);
    }
    var youtube = linkUtils.uniqueFlatAndDefined(linkUtils.collectAdProperty(ads, 'youtube'));
    var instagram = linkUtils.uniqueFlatAndDefined(linkUtils.collectAdProperty(ads, 'instagram'));
    var twitter = linkUtils.uniqueFlatAndDefined(linkUtils.collectAdProperty(ads, 'twitter'));
    var socialmedia = twitter + instagram + youtube;
    var ethnicity = linkUtils.uniqueFlatAndDefined(linkUtils.collectAdProperty(ads, 'ethnicity'));
    var imageUrls = _.uniq(lodash.flatten(
      _.map(ads, function(ad) {
        return ad.image_locations;
      }),
      true));
    imageUrls = _.filter(imageUrls, function(element){
      return ! _.isUndefined(element);
    });
    var faceImageUrls = _.uniq(lodash.flatten(
      _.map(ads, function(ad) {
        return ad.face_image_url;
      }),
      true
      ));
    faceImageUrls = _.filter(faceImageUrls, function(element){
      return ! _.isUndefined(element);
    });
    var entity = {
      id: rawEntity._id,
      phones: phones,
      names: names,
      nPosts: ads.length,
      firstPostTime: firstPostTime,
      lastPostTime: lastPostTime,
      websites: websites,
      cities: cities,
      ages: ages,
      rates60: rates60,
      imageUrls: imageUrls,
      nPics: imageUrls.length,
      faceImageUrls: faceImageUrls,
      nSuggestedByImage: 0,
      nSuggestedByPhone: 0,
      nSuggestedByText: 0,
      socialmedia: socialmedia,
      titles: titles,
      texts: texts,
      all_text: all_text
    };
    return entity;
  }

  $http.get('/api/v1/savedEntities?user=Anonymous').
  then(function(response) {
    // this callback will be called asynchronously
    // when the response is available
    var savedEntities = response.data.payload;
    angular.forEach(savedEntities, function(rawEntity){
      console.log(rawEntity);
      $scope.entities.push(_formatEntity(rawEntity));
    });

  }, function(response) {
    // called asynchronously if an error occurs
    // or server returns response with an error status.
    console.log('something went wrong...');
    console.log(response);
  });


  // then(function(response){
  //   console.log(response);

    // var x=[];
    // for (var i = 0; i < response.data.length; i++) {
    //   x[i] = response.data[i]._source.entityid;
    // }
    // x = _.uniq(x);
    // x = _.filter(x, function(element){
    //   return ! _.isUndefined(element);
    // });
    // console.log(x);
    // $scope.entities = [];

    // for (var i = 0; i < x.length; i++) {
    //   $scope.adIds.push(x[i]);
    //   $scope.temp_url.push('http://localhost:9000/entitydetail/' + x[i]);

    //   $http.post(_SEARCH_URL, {query:x[i]}).then(function(response){
    //     var e = _.map(response.data.entities, function(e) {
    //       var entity = _formatEntity(e);
    //       console.log(entity);
    //       return entity;
    //     });
    //     console.log('adding entity...');
    //     console.log(e);
    //     $scope.entities.push(e);
    //     $scope.entities = _.flatten($scope.entities);
    //   });
    // }
    // $scope.entities2 = y
    // console.log($scope.entities2)
//     }), function(response) {

});

