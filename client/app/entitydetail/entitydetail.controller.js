'use strict';

// TODO: inject an entity service, and use it to get the entity object
angular.module('memexLinkerApp')
  .controller('EntitydetailCtrl', function ($scope, $http, $stateParams, lodash) {

    $scope.ads = [];
    $scope.photos = [];
    $scope.reviews = [];
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
            console.log(element)
            var nodeData = element.ad._data.data;
            var nodeMetaData = element.ad._data.metadata;
            return {
              'id': nodeMetaData.id,
              'data' : nodeData
            };            
        });
        console.log($scope.ads);
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


    //  $http.get('/api/entities').success(function(res) {
    //     console.log(res);
    //     $scope.entities = lodash.map(res, function(e){
    //         var nodeData = e._node._data.data;
    //         var nodeMetaData = e._node._data.metadata;
    //         return {
    //           'id': nodeMetaData.id,
    //           'phone' : nodeData.identifier
    //         };
    //     });
    //     console.log($scope.entities);
    // });

   

    // $scope.ads = [
    // 	{
    // 		title:'An ad title',
    // 		id:'adId',
    // 		phone:'123.456.7890',
    // 		text:'The time has come the walrus said...',
    //         imgs: ['https://placekitten.com/g/600/300',
    //                 'https://placekitten.com/g/601/300',
    //                 'https://placekitten.com/g/602/300',
    //                 ]
    // 	}
    // ];

    // $scope.photos = [
    // 	{
    // 		title:'photo title',
    // 		src:'https://placekitten.com/g/602/300'
    // 	}
    // ];


  });
