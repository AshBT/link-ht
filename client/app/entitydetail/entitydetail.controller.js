'use strict';

// TODO: inject an entity service, and use it to get the entity object
angular.module('memexLinkerApp')
.controller('EntitydetailCtrl', function ($scope, $http, $stateParams, $q, $modal, lodash, Auth, $sce, Crossfilter, entityService, linkUtils) {
	var _ = lodash;

	// --- SCOPE VARIABLES --- //

	// Aggregate details about this entitiy.
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
		youtubeSameuser:[],
		youtubeUsername:[],
		yelp:[]
	};

    var boom = 'ads_id%3A32711920%20OR%20ads_id%3A32711944';
    $scope.imagecat = $sce.trustAsResourceUrl('https://darpamemex:darpamemex@imagecat.memexproxy.com/imagespace/#search/' + boom);

	$scope.blur = true;
	$scope.ads = [];
	$scope.imageUrls = [];
	$scope.faceImageUrl = [];
	$scope.suggestedAds = [];
	$scope.id = $stateParams.id;
	$scope.sourceMap = entityService.sources;

	// User-supplied annotations.
	$scope.annotations = [];
	$scope.text = '';

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

	// ng-crossfilter. collection | primary key | strategy | properties
	$scope.$ngc = new Crossfilter($scope.ads, 'id', 'persistent', ['id','latitude', 'longitude', 'timestamp']);

	$scope.showSelector = false;

	// Callback for changes in showSelector, which indicates whether the goegraphic selection box is enabled.
	$scope.onShowSelector = function(showSelector) {
		$scope.showSelector = showSelector;
    	if(showSelector) {
			// 
		} else {
			$scope.$ngc.unfilterBy('latitude');
			$scope.$ngc.unfilterBy('longitude');
		}
    };

    // Callback for changes in geographic bounding box.
    $scope.onBoundsChange = function(bounds) {
    	console.log('onBoundsChange');
    	console.log(bounds);
    	$scope.$ngc.unfilterBy('latitude');
		$scope.$ngc.unfilterBy('longitude');
		if($scope.showSelector) {
			var sw = bounds.sw;
			var ne = bounds.ne;
			$scope.$ngc.filterBy('latitude', {minLatitude: sw.latitude, maxLatitude: ne.latitude}, function(range, latitude) {
				return range.minLatitude <= latitude && latitude <= range.maxLatitude;
			});

			$scope.$ngc.filterBy('longitude', {minLon: sw.longitude, maxLon: ne.longitude}, function(range, lon) {
				return range.minLon <= lon && lon <= range.maxLon;
			});	
		} else {
			//
		}
		
    };

    // Callback for changes in date slider range.
    $scope.onRangeChange = function(range) {
		$scope.$ngc.filterBy('timestamp', {minDate: range.minDate, maxDate: range.maxDate}, function(range, timestamp) {
			return range.minDate <= timestamp && timestamp <= range.maxDate;
		});
    };

	// --- SCOPE FUNCTIONS --- //

	$scope.submit = function() {
		console.log('submit ' + this.text);
		var username = 'Anonymous';
		if(Auth.isLoggedIn()) {
			username = Auth.getCurrentUser().name;
		}
		if (this.text) {
			$scope.annotations.push({
				text: this.text,
				username: username,
				date: Date.now()
			});
			$scope.text = '';
		}
	};

	$scope.getHost = function (url) {
		var parser = document.createElement('a');
		parser.href = url;
		return parser.host;
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

	$scope.saveEntity = function() {
		// TODO: Get user name if logged in
		var userName = 'test_user';
		var data = {
			userName: userName
		};
		$http.post('api/entities/' + $scope.id + '/save', data).success(function(res){
			console.log(res);
		});
	};

	// --- NON-SCOPE FUNCTIONS --- //

	var uniqueFlatAndDefined = linkUtils.uniqueFlatAndDefined;

	function updateLinked() {

		entityService.Entity.query({id: $scope.id}, function(data) {
			var _ads = data.ads;

			_.map(_ads, function(ad) {
				console.log('Pushing ad');
				console.log(ad);
				ad.timestamp = Date.parse(ad.posttime);
				$scope.ads.push(ad);
				$scope.$ngc.addModel(ad);
				// If ad has latitude and longitude values, convert them to numbers
				if (_.has(ad, 'latitude') && _.has(ad, 'longitude')) {
					console.log('converting lat lon values to numbers');
					ad.latitude = Number(ad.latitude);
					ad.longitude = Number(ad.longitude);
				} else {
					// TODO: geocode the city name.
				}
			});
		});

		// $http.get('api/entities/' + $scope.id + '/linked').success(function(res){
		// 	_.map(res, function(element){ 
		// 		var ad = {
		// 			'id':element.ad._id,
		// 			'labels':element.ad.labels,
		// 			'properties':element.ad.properties,
		// 			'timestamp': Date.parse(element.ad.properties.posttime)
		// 		};

		// 		var promises = [];

		// 		promises.push($http.post('api/interactions/linkTypes', {entityId : $scope.id, adId : ad.id}));

		// 		// geocode ad
		// 		if(element.ad.properties.city !== undefined) {
		// 			promises.push(geocodeCity(element.ad.properties.city));
		// 		}
		// 		$q.all(promises).then(function(data){

		// 			var res = data[0].data;
		// 			if (res.linkTypes.indexOf('BY_PHONE') > -1) { ad.linkedByPhone = true; }
		// 			if (res.linkTypes.indexOf('BY_TXT') > -1) { ad.linkedByText = true; }
		// 			if (res.linkTypes.indexOf('BY_IMG') > -1) { ad.linkedByImage = true; }

		// 			if(data.length === 2) {
		// 				// geocoded
		// 				var point = data[1];

		// 				ad.latitude = point.latitude;
  // 						ad.longitude = point.longitude;
		// 			}
		// 			$scope.ads.push(ad);
		// 			$scope.$ngc.addModel(ad);
		// 		});
		// 	});
		// });
	}

	function updateSuggestedText() {
		$http.get('api/entities/' + $scope.id + '/byText').success(function(res){
			$scope.suggestedAds = _.map(res, function(element){ 
				if(element.ad !== undefined && element.ad._id !== undefined) {
					var ad = {
					'id':element.ad._id,
					'labels':element.ad.labels,
					'properties':element.ad.properties,
					'suggestedByText':true
				};
				return ad;	
				}
			});
		});
	}

	function updateSuggestedImage() {
		$http.get('api/entities/' + $scope.id + '/byImage').success(function(res){
			$scope.suggestedAds = _.map(res, function(element){ 
				if(element.ad !== undefined && element.ad._id !== undefined) {
					var ad = {
						'id':element.ad._id,
						'labels':element.ad.labels,
						'properties':element.ad.properties,
						'suggestedByImage':true
					};
					return ad;
				}
			});
		});
	}

	// $scope.$watch('$scope.$ngc', function(){
	// 	console.log('ads changed');
	// 	updateEntity();
	// }, true);

	$scope.$on('crossfilter/updated', function(event, collection, identifier) {
		console.log('crossfilter/updated event.');
		updateEntity();
	});

	/**
	 * Update the aggregate statistics for this entity, based on the (possibly filtered) set of linked ads, suggested ads, etc.
	 * @return {[type]} [description]
	 */
	function updateEntity() {
		console.log('updateEntity');
		$scope.entity.cities = uniqueFlatAndDefined(_.pluck($scope.ads, 'city')).sort();
		$scope.entity.postTime = uniqueFlatAndDefined(_.pluck($scope.ads, 'posttime')).sort();
		$scope.entity.age = uniqueFlatAndDefined(_.pluck($scope.ads, 'age')).sort();
		$scope.entity.ethnicities = uniqueFlatAndDefined(_.pluck($scope.ads, 'ethnicity')).sort();
		$scope.entity.height = uniqueFlatAndDefined(_.pluck($scope.ads, 'height')).sort();
		$scope.entity.weight = uniqueFlatAndDefined(_.pluck($scope.ads, 'weight')).sort();
		$scope.entity.eyes = uniqueFlatAndDefined(_.pluck($scope.ads, 'eyes')).sort();
		$scope.entity.hair = uniqueFlatAndDefined(_.pluck($scope.ads, 'hair')).sort();
		$scope.entity.price = uniqueFlatAndDefined(_.pluck($scope.ads, 'rate60')).sort();
		$scope.entity.email = uniqueFlatAndDefined(_.pluck($scope.ads, 'email')).sort();
		$scope.entity.name = uniqueFlatAndDefined(_.pluck($scope.ads, 'name')).sort();
		$scope.entity.instagram = uniqueFlatAndDefined(_.pluck($scope.ads, 'instagram')).sort();
		$scope.entity.instagram_followers= uniqueFlatAndDefined(_.pluck($scope.ads, 'instagram_followers')).sort();
		$scope.entity.instagram_follows= uniqueFlatAndDefined(_.pluck($scope.ads, 'instagram_follows')).sort();
		$scope.entity.instagram_likers= uniqueFlatAndDefined(_.pluck($scope.ads, 'instagram_likers')).sort();
		$scope.entity.instagram_profile_picture= uniqueFlatAndDefined(_.pluck($scope.ads, 'instagram_profile_picture')).sort();
		$scope.entity.instagram_tags= uniqueFlatAndDefined(_.pluck($scope.ads, 'instagram_tags')).sort();

		$scope.entity.youtube= uniqueFlatAndDefined(_.pluck($scope.ads, 'youtube')).sort();
		$scope.entity.youtube_sameuser= uniqueFlatAndDefined(_.pluck($scope.ads, 'youtube_video_urls')).sort();
		for (var i = 0; i < $scope.entity.youtube.length; i++) {
			$scope.entity.youtube[i]=$sce.trustAsResourceUrl($scope.entity.youtube[i])
		}
		for (var i = 0; i < $scope.entity.youtube_sameuser.length; i++) {
			$scope.entity.youtube_sameuser[i]=$sce.trustAsResourceUrl($scope.entity.youtube_sameuser[i].replace("watch?v=", "embed/"))
		}
		$scope.entity.youtube_username= uniqueFlatAndDefined(_.pluck($scope.ads, 'youtube_user')).sort();


		$scope.entity.twitter= uniqueFlatAndDefined(_.pluck($scope.ads, 'twitter')).sort();
		for (var i = 0; i < $scope.entity.twitter.length; i++) {
			$scope.entity.twitter[i]=$scope.entity.twitter[i].replace("https://twitter.com/","@")
		}
		$scope.entity.tweets= uniqueFlatAndDefined(_.pluck($scope.ads, 'twitter')).sort();
		$scope.entity.twitter_followers= uniqueFlatAndDefined(_.pluck($scope.ads, 'twitter_followers')).sort();
		$scope.entity.twitter_friends= uniqueFlatAndDefined(_.pluck($scope.ads, 'twitter_friends')).sort();
		$scope.entity.twitter_name= uniqueFlatAndDefined(_.pluck($scope.ads, 'twitter_name')).sort();
		$scope.entity.twitter_profile_pic= uniqueFlatAndDefined(_.pluck($scope.ads, 'twitter_profile_pic')).sort();
		$scope.entity.twitter_profile_background_pic= uniqueFlatAndDefined(_.pluck($scope.ads, 'twitter_profile_background_pic')).sort();
		$scope.entity.twitter_description= uniqueFlatAndDefined(_.pluck($scope.ads, 'twitter_description')).sort();

		$scope.entity.yelp= uniqueFlatAndDefined(_.pluck($scope.ads, 'yelp')).sort();

		//var priceRange = 'Missing' ;
		if ($scope.entity.price[0] !== null) {
			$scope.entity.minPrice = _.min($scope.entity.price);
			$scope.entity.maxPrice = _.max($scope.entity.price);
		}
		else { 
			$scope.entity.minPrice = 'Missing';
			$scope.entity.maxPrice = 'Missing';
		}
		$scope.entity.modePrice = linkUtils.mode($scope.entity.price);
		
		var rawImageUrls = _.flatten(
			_.map($scope.ads, function(ad) {
				return ad.image_locations;
			}),
			true
			);
		$scope.imageUrls = linkUtils.uniqueFlatAndDefined(_.filter(rawImageUrls, function(element){
			return ! _.isUndefined(element);
		}));

		$scope.faceImageUrl = _.flatten(
			_.map($scope.ads, function(ad) {
				return ad.faceImageUrl;
			}),
			true
			);
		$scope.faceImageUrl = _.filter($scope.faceImageUrl, function(element){
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
			}, function(reason) {
				console.log('Failed');
				console.log(reason);
			}, function(update) {
				console.log(update);
			});

			_.forEach($scope.entity.cities, function(city, key) {
				geocodeCity(city)
				.then(function(point){
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

	entityService.Suggest.query({id: $scope.id}, function(data) {
		console.log('Suggest:');
		console.log(data.suggestions);
	});

	// $http.get('/api/entities/' + $scope.id).success(function(res) {
	// 	$scope.entity.phone = res._node.properties.identifier;
	// 	$scope.entity.email = res._node.properties.email;
	// 	$scope.entity.name = res._node.properties.name;
	// 	$scope.entity.nFaces = res._node.properties.nFaces;
	// });
 
	updateLinked();
	//updateSuggestedText();
	//updateSuggestedImage();
});

// TODO: put this under components
angular.module('memexLinkerApp').
filter('capitalize', function() {
	return function(input) {
		return (!!input) ? input.replace(/([^\W_]+[^\s-]*) */g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();}) : '';
	};
});

