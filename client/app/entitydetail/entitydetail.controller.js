'use strict';

// TODO: inject an entity service, and use it to get the entity object
angular.module('memexLinkerApp')
.controller('EntitydetailCtrl', function ($scope, $http, $stateParams, lodash, Auth) {

    console.log('Logged in? ' + Auth.isLoggedIn());
    if (Auth.isLoggedIn()) {
        console.log(Auth.getCurrentUser().name);    
    }
    
    $scope.blur = true;
    $scope.ads = [];
    //$scope.photos = [];

    $scope.imageUrls = [];

    $scope.suggestedAds = [];
    $scope.id = $stateParams.id;

    $scope.entity = {
        phone:'',
        cities:[],
        ages:[],
        ethnicities:[],
        heights:[]
    };

    $scope.map = { 
        center: { 
            latitude: 37.7,
            longitude: -122.4167
             },
        zoom: 8 
    };

    $scope.getHost = function (url) {
        var parser = document.createElement('a');
        parser.href = url;
        return parser.host;
    };

    $scope.expandMap = function() {
        console.log('Expand the map!');
    };

    $http.get('/api/entities/' + $scope.id).success(function(res) {
        $scope.entity.phone = res._node._data.data.identifier;
    });

    $http.get('api/entities/' + $scope.id + '/byphone').success(function(res){
        $scope.ads = lodash.map(res, function(element){
            //console.log(element);
            var nodeData = element.ad._data.data;
            var nodeMetaData = element.ad._data.metadata;
            return {
              'id': nodeMetaData.id,
              'data' : nodeData,
              'metaData' : nodeMetaData
          };            
      });
        updateEntity();

    });

    $http.get('api/entities/' + $scope.id + '/byimage').success(function(res){
        $scope.suggestedAds = lodash.map(res, function(element){
            var nodeData = element.ad._data.data;
            var nodeMetaData = element.ad._data.metadata;
            return {
              'id': nodeMetaData.id,
              'data' : nodeData
          };            
      });
        updateEntity();
    });

    function updateEntity() {
        console.log($scope.ads);
        $scope.entity.ages = lodash.uniq(
            lodash.map($scope.ads, function(ad) {
                return ad.data.age;
            })
            );
        $scope.entity.cities = lodash.uniq(
            lodash.map($scope.ads, function(ad) {
                return ad.data.city;
            })
            );
        $scope.entity.ethnicities = lodash.uniq(
            lodash.map($scope.ads, function(ad) {
                return ad.data.ethnicity;
            })
            );

        $scope.imageUrls = lodash.flatten(
          lodash.map($scope.ads, function(ad) {
            return ad.data.image_locations;
        }),
          true
          );
        $scope.imageUrls = lodash.filter($scope.imageUrls, function(element){
          return ! lodash.isUndefined(element);
      });

        // TODO: center the map and add markers
    } 

});

angular.module('memexLinkerApp').
  filter('capitalize', function() {
    return function(input, all) {
      return (!!input) ? input.replace(/([^\W_]+[^\s-]*) */g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();}) : '';
    };
  });
