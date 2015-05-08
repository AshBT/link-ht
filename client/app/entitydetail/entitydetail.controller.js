'use strict';

// TODO: inject an entity service, and use it to get the entity object
angular.module('memexLinkerApp')
  .controller('EntitydetailCtrl', function ($scope, $http, $stateParams, lodash, Auth) {

    // console.log('Logged in? ' + Auth.isLoggedIn());
    // if (Auth.isLoggedIn()) {
    //     console.log(Auth.getCurrentUser().name);    
    // }
    
    $scope.blur = true;
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

    $scope.getHost = function (url) {
        var parser = document.createElement('a');
        parser.href = url;
        return parser.host;
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
              'data' : nodeData
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
    } 

  });
