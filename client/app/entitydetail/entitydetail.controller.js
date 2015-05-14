'use strict';

// TODO: inject an entity service, and use it to get the entity object
angular.module('memexLinkerApp')
.controller('EntitydetailCtrl', function ($scope, $http, $stateParams, $q, $modal, lodash, Auth) {

    
    $scope.map = {};
    $scope.blur = true;
    $scope.ads = [];
    $scope.imageUrls = [];
    $scope.suggestedAds = [];
    $scope.id = $stateParams.id;
    $scope.user = null;

    //console.log('Logged in? ' + Auth.isLoggedIn());
    if (Auth.isLoggedIn()) {
        $scope.user = Auth.getCurrentUser();
        console.log($scope.user);     
    }

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


    // ---- Map Modal ------- //

    $scope.lat = 34.834442;
    $scope.lng = -82.3686479;

    $scope.expandMap = function () {
        var modalInstance = $modal.open({
            templateUrl:'/app/entitydetail/partials/mapdetail.html',
            controller: ModalInstanceCtrl,
            resolve: {
                lat: function () {
                    return $scope.lat;
                },
                lng: function () {
                    return $scope.lng;
                }
            }
        });
    };

    $scope.linkToEntity = function(ad) {
        console.log('User ' + $scope.user.name + ' links Ad ' + ad.id +' to Entity ' + $scope.id);
        console.log(ad);
    };

    var ModalInstanceCtrl = function ($scope, $modalInstance, lat, lng) {
        $scope.lat = lat;
        $scope.lng = lng;

        $scope.ok = function() {
            $modalInstance.close();
        };

        $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
        };
    };

    // ---- Map Modal ------- //

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
              'data' : nodeData,
              'suggestedByImage' : true
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
                var city = ad.data.city;
                return city;
            })
            );

        $scope.entity.ethnicities = lodash.uniq(
            lodash.map($scope.ads, function(ad) {
                return ad.data.ethnicity;
            })
            );
        $scope.entity.ethnicities = lodash.filter($scope.entity.ethnicities, function(element){
            return ! lodash.isEmpty(element);
        });

        $scope.imageUrls = lodash.flatten(
          lodash.map($scope.ads, function(ad) {
            return ad.data.image_locations;
        }),
          true
          );
        $scope.imageUrls = lodash.filter($scope.imageUrls, function(element){
          return ! lodash.isUndefined(element);
      });

        //TODO: Add markers
        if (! lodash.isEmpty($scope.entity.cities)) {

            var promise = geocodeCity($scope.entity.cities[0]);
            promise.then(function(point) {
              console.log(point);
              $scope.map = {
                center: {
                    latitude: point.latitude,
                    longitude: point.longitude
                },
                zoom: 8
            };
        }, function(reason) {
          console.log('Failed');
      }, function(update) {
          console.log('Alert');
      });
        }
    } 

    var geocoder = new google.maps.Geocoder();
    function geocodeCity(cityName) {
        var deferred = $q.defer();
        
        geocoder.geocode( { 'address': cityName }, function(results, status) {

            if (status === google.maps.GeocoderStatus.OK && results.length > 0) {
                var location = results[0].geometry.location;
                deferred.resolve({
                    latitude: parseFloat(location.lat()),
                    longitude: parseFloat(location.lng())
                });

            } else {
                deferred.resolve({
                    latitude: 0,
                    longitude: 0
                });
            }
        });
        return deferred.promise;
    }  


});

// TODO: put this under components
angular.module('memexLinkerApp').
filter('capitalize', function() {
    return function(input, all) {
      return (!!input) ? input.replace(/([^\W_]+[^\s-]*) */g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();}) : '';
  };
});

  // Please note that $modalInstance represents a modal window (instance) dependency.
// It is not the same as the $modal service used above.

angular.module('memexLinkerApp').controller('ModalInstanceCtrl', function ($scope, $modalInstance) {

  $scope.ok = function () {
    $modalInstance.close();
};

$scope.cancel = function () {
    $modalInstance.dismiss('cancel');
};
});
