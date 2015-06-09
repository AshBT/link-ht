'use strict';

// TODO: inject an entity service, and use it to get the entity object
angular.module('memexLinkerApp')
.controller('EntitydetailCtrl', function ($scope, $http, $stateParams, $q, $modal, lodash, Auth) {
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

    function collectAdProperty(ads, propertyName) {
      return _.map(ads, function(ad) {
        return ad.properties[propertyName];
      });
    }

    function uniqueFlatAndDefined(items) {
      return _.filter(_.uniq(_.flatten(items)), function(item) {
        return ! _.isUndefined(item);
      });
    }
    function uniqueAndDefined(items) {
      return _.filter(_.uniq(items), function(item) {
        return ! _.isUndefined(item);
      });
    }

    function mode(arr) {
    return arr.reduce(function(current, item) {
        var val = current.numMapping[item] = (current.numMapping[item] || 0) + 1;
        if (val > current.greatestFreq) {
            current.greatestFreq = val;
            current.mode = item;
        }
        return current;
    }, {mode: null, greatestFreq: -Infinity, numMapping: {}}, arr).mode;
    }

    $scope.logo = 'http://icons.iconarchive.com/icons/icons8/ios7/256/Very-Basic-Paper-Clip-icon.png';

    $scope.map = {
        center: {
            latitude: 33.5206608,
            longitude: -86.80248999999998
        },
        zoom: 4
    };
    $scope.markers = [
                 // {
                 //   id: 583187,
                 //   latitude: 46.7682,
                 //   longitude: -71.3234,
                 //   title: 'title'
                 // }
               ];


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
    };

    // if (Auth.isLoggedIn()) {
    //     $scope.user = Auth.getCurrentUser();
    //     console.log($scope.user);     
    // }

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
        price:[],
        postTimes:[],
        firstPostTime:'',
        instagram:[], 
        twitter:[],
        youtube:[],
        yelp:[]
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
            updateSuggestedText();
            updateSuggestedImage();
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

    function updateSuggestedText() {
        $http.get('api/entities/' + $scope.id + '/byText').success(function(res){
            $scope.suggestedAds = _.map(res, function(element){ 
              var ad = {
                'id':element.ad._id,
                'labels':element.ad.labels,
                'properties':element.ad.properties,
                'suggestedByText':true
              };
              return ad;
            });

            updateEntity();
        });

    }

    function updateSuggestedImage() {
        $http.get('api/entities/' + $scope.id + '/byImage').success(function(res){
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
        $scope.entity.cities= uniqueFlatAndDefined(collectAdProperty($scope.ads, 'city')).sort();
        $scope.entity.postTime= uniqueFlatAndDefined(collectAdProperty($scope.ads, 'posttime')).sort();
        $scope.entity.age = uniqueFlatAndDefined(collectAdProperty($scope.ads, 'age')).sort();
        $scope.entity.ethnicities = uniqueFlatAndDefined(collectAdProperty($scope.ads, 'ethnicity')).sort();
        $scope.entity.height = uniqueFlatAndDefined(collectAdProperty($scope.ads, 'height')).sort();
        $scope.entity.weight = uniqueFlatAndDefined(collectAdProperty($scope.ads, 'weight')).sort();
        $scope.entity.eyes = uniqueFlatAndDefined(collectAdProperty($scope.ads, 'eyes')).sort();
        $scope.entity.hair = uniqueFlatAndDefined(collectAdProperty($scope.ads, 'hair')).sort();
        $scope.entity.price = uniqueFlatAndDefined(collectAdProperty($scope.ads, 'rate60')).sort();
        $scope.entity.email = uniqueFlatAndDefined(collectAdProperty($scope.ads, 'email')).sort();
        $scope.entity.name = uniqueFlatAndDefined(collectAdProperty($scope.ads, 'name')).sort();
        $scope.entity.instagram= uniqueFlatAndDefined(collectAdProperty($scope.ads, 'instagram')).sort();
        $scope.entity.instagram_followers= uniqueFlatAndDefined(collectAdProperty($scope.ads, 'instagram_followers')).sort();
        $scope.entity.instagram_follows= uniqueFlatAndDefined(collectAdProperty($scope.ads, 'instagram_follows')).sort();
        $scope.entity.instagram_likers= uniqueFlatAndDefined(collectAdProperty($scope.ads, 'instagram_likers')).sort();
        $scope.entity.instagram_profile_picture= uniqueFlatAndDefined(collectAdProperty($scope.ads, 'instagram_profile_picture')).sort();
        $scope.entity.instagram_tags= uniqueFlatAndDefined(collectAdProperty($scope.ads, 'instagram_tags')).sort();

        $scope.entity.youtube= uniqueFlatAndDefined(collectAdProperty($scope.ads, 'youtube')).sort();
        $scope.entity.twitter= uniqueFlatAndDefined(collectAdProperty($scope.ads, 'twitter')).sort();
        for (var i = 0; i < $scope.entity.twitter.length; i++) {
        $scope.entity.twitter[0]=$scope.entity.twitter[0].replace("https://twitter.com/","@")
        }
        $scope.entity.tweets= uniqueFlatAndDefined(collectAdProperty($scope.ads, 'twitter')).sort();
        $scope.entity.twitter_followers= uniqueFlatAndDefined(collectAdProperty($scope.ads, 'twitter_followers')).sort();
        $scope.entity.twitter_friends= uniqueFlatAndDefined(collectAdProperty($scope.ads, 'twitter_friends')).sort();
        $scope.entity.twitter_name= uniqueFlatAndDefined(collectAdProperty($scope.ads, 'twitter_name')).sort();
        $scope.entity.twitter_profile_pic= uniqueFlatAndDefined(collectAdProperty($scope.ads, 'twitter_profile_pic')).sort();
        $scope.entity.twitter_profile_background_pic= uniqueFlatAndDefined(collectAdProperty($scope.ads, 'twitter_profile_background_pic')).sort();
        $scope.entity.twitter_description= uniqueFlatAndDefined(collectAdProperty($scope.ads, 'twitter_description')).sort();


        $scope.entity.yelp= uniqueFlatAndDefined(collectAdProperty($scope.ads, 'yelp')).sort();





        //var priceRange = 'Missing' ;
        if ($scope.entity.price[0] !== null) {
            $scope.entity.minPrice = _.min($scope.entity.price);
            $scope.entity.maxPrice = _.max($scope.entity.price);
        }
        else { 
            $scope.entity.minPrice = 'Missing';
            $scope.entity.maxPrice = 'Missing';
        }
        $scope.entity.modePrice = mode($scope.entity.price);
        

        
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

        if (! _.isEmpty($scope.entity.cities)) {

            var promise = geocodeCity($scope.entity.cities[0]);
            promise.then(function(point) {
                $scope.map = {
                    center: {
                        latitude: point.latitude,
                        longitude: point.longitude
                    },
                    zoom: 3
                };
                console.log($scope.map);
            }, function(reason) {
                console.log('Failed');
            }, function(update) {
                console.log('Alert');
            });

            _.forEach($scope.entity.cities, function(city, key) {
                console.log(city, key);
                geocodeCity(city)
                    .then(function(point){
                        console.log(point);
                                         //   id: 583187,
                 //   latitude: 46.7682,
                 //   longitude: -71.3234,
                 //   title: 'title'
                        var m = {
                            id:key,
                            latitude: point.latitude,
                            longitude: point.longitude,
                            title: city
                        };
                        console.log('Marker:');
                        console.log(m);
                        $scope.markers.push(m);
                    });
            });
        }
    } 
    // The following function requires access to the internet. We need to develop an offline version of this geocoder.
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
    updateSuggestedText();
    updateSuggestedImage(); 
});

// TODO: put this under components
angular.module('memexLinkerApp').
filter('capitalize', function() {
    return function(input, all) {
      return (!!input) ? input.replace(/([^\W_]+[^\s-]*) */g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();}) : '';
  };
});

