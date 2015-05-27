'use strict';

// TODO: inject an entity service, and use it to get the entity object
angular.module('memexLinkerApp')
.controller('EntitydetailCtrl', function ($scope, $http, $stateParams, $q, $modal, lodash, Auth) {
    var _ = lodash;
    $scope.logo = "http://icons.iconarchive.com/icons/icons8/ios7/256/Very-Basic-Paper-Clip-icon.png";

    $scope.map = {};
    $scope.blur = true;
    $scope.ads = [];
    $scope.imageUrls = [];
    $scope.face_image_url = [];
    $scope.suggestedAds = [];
    $scope.id = $stateParams.id;
    $scope.user = null;

    $scope.heatmapConfig = {
        entityId: $scope.id,
        start: new Date(2013, 0),
        domain : 'year',
        cellSize: 14,
        subDomain : 'day',
        legend: [2, 4, 6, 10],
        range : 1
        // mapping from Unix timestamp, in seconds, to number of ads at that timestamp.
        // data : {
        //         946719001: 0,
        //         946721450: 5,
        //         946721875: 10,
        //         946727172: 4,
        //         946728141: 4,
        //         946733771: 2
        //     }
    };


    if (Auth.isLoggedIn()) {
        $scope.user = Auth.getCurrentUser();
        console.log($scope.user);     
    }

    $scope.entity = {
        phone:'',
        email:[],
        name:[],
        city:[],
        age:[],
        ethnicities:[],
        height:[],
        weight:[],
        eyes:[],
        hair:[],
        price:'',

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

    // Link Ad to Entity by user-confirmed image similarity.
    $scope.linkToEntity = function(ad) {
        console.log('link Ad ' + ad.id +' to Entity ' + $scope.id);
        var data = {
            idA: _.parseInt($scope.id),
            idB: ad.id,
            relType: 'BY_IMG',
            properties: {
                userName: 'test_user'
            }
        };
        $http.post('/api/relationships', data).
          success(function(data, status, headers, config) {
            updateLinked();
            updateSuggested();
          }).
          error(function(data, status, headers, config) {
            console.log(data);
          });
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
        $scope.entity.phone = res._node.properties.identifier;
        $scope.entity.email = res._node.properties.email;
        $scope.entity.name = res._node.properties.name;
        $scope.entity.city = res._node.properties.city;
        $scope.entity.n_faces = res._node.properties.n_faces;

    });


    function updateLinked() {
        $http.get('api/entities/' + $scope.id + '/linked').success(function(res){
            $scope.ads = _.map(res, function(element){ 
              var ad = {
                'id':element.ad._id,
                'labels':element.ad.labels,
                'properties':element.ad.properties
              };
              return ad;
            });
            updateEntity();
        });
    }

    function updateSuggested() {
        $http.get('api/entities/' + $scope.id + '/byimage').success(function(res){
            $scope.suggestedAds = _.map(res, function(element){ 
              var ad = {
                'id':element.ad._id,
                'labels':element.ad.labels,
                'properties':element.ad.properties,
                'suggestedByImage':true
              };
              return ad;
            });
            updateEntity();
        });
    }

    function updateEntity() {
        $scope.entity.cities = _.uniq(
            _.map($scope.ads, function(ad) {
                var city = ad.properties.city;
                return city;
            })
            );
        $scope.entity.cities = lodash.filter($scope.entity.cities, function(element){
            return ! _.isEmpty(element);
        });

        $scope.entity.ethnicities = _.uniq(
            _.map($scope.ads, function(ad) {
                return ad.properties.ethnicity;
            })
            );
        $scope.entity.ethnicities = lodash.filter($scope.entity.ethnicities, function(element){
            return ! _.isEmpty(element);
        });

        $scope.entity.age = _.uniq(
            _.map($scope.ads, function(ad) {
                return ad.properties.age;
            })
            );
        $scope.entity.age = _.filter($scope.entity.age, function(element){
            return ! _.isEmpty(element);
        });

        $scope.entity.price = _.uniq(
            _.map($scope.rate60, function(ad) {
                return ad.properties.rate60;
            })
            );
        $scope.entity.price = _.filter($scope.entity.rate60, function(element){
            return ! _.isEmpty(element);
        });

        $scope.entity.name = _.uniq(
            _.map($scope.ads, function(ad) {
                return ad.properties.name;
            })
            );
        $scope.entity.name = _.filter($scope.entity.name, function(element){
            return ! _.isEmpty(element);
        });

        $scope.entity.email = _.uniq(
            _.map($scope.ads, function(ad) {
                return ad.properties.email;
            })
            );
        $scope.entity.email = _.filter($scope.entity.email, function(element){
            return ! _.isEmpty(element);
        });

        $scope.entity.height = _.uniq(
            _.map($scope.ads, function(ad) {
                return ad.properties.height;
            })
            );
        $scope.entity.height = _.filter($scope.entity.height, function(element){
            return ! _.isEmpty(element);
        });

        $scope.entity.weight = _.uniq(
            _.map($scope.ads, function(ad) {
                return ad.properties.weight;
            })
            );
        $scope.entity.weight= _.filter($scope.entity.weight, function(element){
            return ! _.isEmpty(element);
        });

        $scope.entity.eyes = _.uniq(
            _.map($scope.ads, function(ad) {
                return ad.properties.eyes;
            })
            );
        $scope.entity.eyes = _.filter($scope.entity.eyes, function(element){
            return ! _.isEmpty(element);
        });

        $scope.entity.hair= _.uniq(
            _.map($scope.ads, function(ad) {
                return ad.properties.hair;
            })
            );
        $scope.entity.hair = _.filter($scope.entity.hair, function(element){
            return ! _.isEmpty(element);
        });

        $scope.imageUrls = _.flatten(
          _.map($scope.ads, function(ad) {
            return ad.properties.image_locations;
        }),
          true
          );
        $scope.imageUrls = _.filter($scope.imageUrls, function(element){
          return ! _.isUndefined(element);
      });


        $scope.face_image_url = _.flatten(
          _.map($scope.ads, function(ad) {
            return ad.properties.face_image_url;
        }),
        true
          );
        $scope.face_image_url = _.filter($scope.face_image_url, function(element){
          return ! _.isUndefined(element);
      });



        //TODO: Add markers
        if (! _.isEmpty($scope.entity.cities)) {

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

    updateLinked();
    updateSuggested(); 
});

// TODO: put this under components
angular.module('memexLinkerApp').
filter('capitalize', function() {
    return function(input, all) {
      return (!!input) ? input.replace(/([^\W_]+[^\s-]*) */g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();}) : '';
  };
});

