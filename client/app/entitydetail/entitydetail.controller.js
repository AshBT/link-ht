'use strict';

// TODO: inject an entity service, and use it to get the entity object
angular.module('memexLinkerApp')
  .controller('EntitydetailCtrl', function ($scope, $http, $stateParams, lodash, Auth) {

    console.log('Logged in? ' + Auth.isLoggedIn());
    if (Auth.isLoggedIn()) {
        console.log(Auth.getCurrentUser().name);    
    }
    
    $scope.ads = [];
    $scope.photos = [];
    $scope.suggestedAds = [];
    $scope.id = $stateParams.id;

     $scope.entity = {
        phone:'',
        cities:[],
        ages:[],
        ethnicities:[],
        heights:[]
    };

    $http.get('/api/entities/' + $scope.id).success(function(res) {
        $scope.entity.phone = res._node._data.data.identifier;
    });

    $http.get('api/entities/' + $scope.id + '/byphone').success(function(res){
        $scope.ads = lodash.map(res, function(element){
            console.log(element);
            var nodeData = element.ad._data.data;
            var nodeMetaData = element.ad._data.metadata;
            return {
              'id': nodeMetaData.id,
              'data' : nodeData
            };            
        });
        //console.log($scope.ads);
        updateEntity();

    });

    $http.get('api/entities/' + $scope.id + '/byimage').success(function(res){
        $scope.suggestedAds = lodash.map(res, function(element){
            console.log(element);
            var nodeData = element.ad._data.data;
            var nodeMetaData = element.ad._data.metadata;
            return {
              'id': nodeMetaData.id,
              'data' : nodeData
            };            
        });
        console.log('Suggested Ads (similar image):');
        console.log($scope.suggestedAds);
        updateEntity();
    });


    function updateEntity() {
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
    } 

  });
