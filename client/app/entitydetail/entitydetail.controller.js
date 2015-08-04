'use strict';

// TODO: inject an entity service, and use it to get the entity object
angular.module('memexLinkerApp')
.controller('EntitydetailCtrl', function ($scope, $http, $stateParams, $q, $modal, lodash, Auth, $sce, Crossfilter) {
	var _ = lodash;

	// --- SCOPE VARIABLES --- //

//From https://github.com/cheynewallace/angular-s3-upload ***waiting to test this code when API is running again
controllers.controller('UploadController',['$scope', function($scope) {
  $scope.sizeLimit      = 10585760; // 10MB in Bytes
  $scope.uploadProgress = 0;
  $scope.creds          = {};

  $scope.upload = function() {
    AWS.config.update({ accessKeyId: $scope.creds.access_key, secretAccessKey: $scope.creds.secret_key });
    AWS.config.region = 'us-east-1';
    var bucket = new AWS.S3({ params: { Bucket: $scope.creds.bucket } });
    
    if($scope.file) {
        // Perform File Size Check First
        var fileSize = Math.round(parseInt($scope.file.size));
        if (fileSize > $scope.sizeLimit) {
          toastr.error('Sorry, your attachment is too big. <br/> Maximum '  + $scope.fileSizeLabel() + ' file attachment allowed','File Too Large');
          return false;
        }
        // Prepend Unique String To Prevent Overwrites
        var uniqueFileName = $scope.uniqueString() + '-' + $scope.file.name;

        var params = { Key: uniqueFileName, ContentType: $scope.file.type, Body: $scope.file, ServerSideEncryption: 'AES256' };

        bucket.putObject(params, function(err, data) {
          if(err) {
            toastr.error(err.message,err.code);
            return false;
          }
          else {
            // Upload Successfully Finished
            toastr.success('File Uploaded Successfully', 'Done');

            // Reset The Progress Bar
            setTimeout(function() {
              $scope.uploadProgress = 0;
              $scope.$digest();
            }, 4000);
          }
        })
        .on('httpUploadProgress',function(progress) {
          $scope.uploadProgress = Math.round(progress.loaded / progress.total * 100);
          $scope.$digest();
        });
      }
      else {
        // No File Selected
        toastr.error('Please select a file to upload');
      }
    }

    $scope.fileSizeLabel = function() {
    // Convert Bytes To MB
    return Math.round($scope.sizeLimit / 1024 / 1024) + 'MB';
  };

  $scope.uniqueString = function() {
    var text     = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for( var i=0; i < 8; i++ ) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }

}]);


	// Aggregate details about this entitiy.
	$scope.entity = {
		phone:'',
		adsid:[],
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


    var boom = "ads_id%3A32711920%20OR%20ads_id%3A32711944"
    $scope.imagecat = $sce.trustAsResourceUrl("https://darpamemex:darpamemex@imagecat.memexproxy.com/imagespace/#search/" + boom);
	// $scope.imagecat = []
	$scope.blur = true;
	$scope.ads = [];
	$scope.imageUrls = [];
	$scope.faceImageUrl = [];
	$scope.suggestedAds = [];
	$scope.id = $stateParams.id;

	$scope.sourceMap = {
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


	// Callback for changes in showSelector.
	$scope.onShowSelector = function(showSelector) {
    	if(showSelector) {
			// 
		} else {
			$scope.$ngc.unfilterBy('latitude');
			$scope.$ngc.unfilterBy('longitude');
		}
    };

    // Callback for changes in geographic bounding box.
    $scope.onBoundsChange = function(bounds) {
    	console.log(bounds);
    	$scope.$ngc.unfilterBy('latitude');
		$scope.$ngc.unfilterBy('longitude');
		var sw = bounds.sw;
		var ne = bounds.ne;
		$scope.$ngc.filterBy('latitude', {minLatitude: sw.latitude, maxLatitude: ne.latitude}, function(range, latitude) {
			return range.minLatitude <= latitude && latitude <= range.maxLatitude;
		});

		$scope.$ngc.filterBy('longitude', {minLon: sw.longitude, maxLon: ne.longitude}, function(range, lon) {
			return range.minLon <= lon && lon <= range.maxLon;
		});
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

	function collectAdProperty(ads, propertyName) {
		return _.map(ads, function(ad) {
			return ad.properties[propertyName];
		});
	}
	
	function collectAdProperty2(ads, propertyName) {
		return _.map(ads, function(ad) {
			return _.trunc(ad.properties[propertyName],15);
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

	function updateLinked() {
		$http.get('api/entities/' + $scope.id + '/linked').success(function(res){
			_.map(res, function(element){ 
				var ad = {
					'id':element.ad._id,
					'labels':element.ad.labels,
					'properties':element.ad.properties,
					'timestamp': Date.parse(element.ad.properties.posttime)
				};

				var promises = [];

				promises.push($http.post('api/interactions/linkTypes', {entityId : $scope.id, adId : ad.id}));

				// geocode ad
				if(element.ad.properties.city !== undefined) {
					promises.push(geocodeCity(element.ad.properties.city));
				}
				$q.all(promises).then(function(data){

					var res = data[0].data;
					if (res.linkTypes.indexOf('BY_PHONE') > -1) { ad.linkedByPhone = true; }
					if (res.linkTypes.indexOf('BY_TXT') > -1) { ad.linkedByText = true; }
					if (res.linkTypes.indexOf('BY_IMG') > -1) { ad.linkedByImage = true; }

					if(data.length == 2) {
						// geocoded
						var point = data[1];

						ad.latitude = point.latitude;
  						ad.longitude = point.longitude;
					}
					$scope.ads.push(ad);
					$scope.$ngc.addModel(ad);
				});
			});
		});
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
		updateEntity();
	});

	function updateEntity() {
		$scope.entity.cities = uniqueFlatAndDefined(collectAdProperty2($scope.ads, 'city')).sort();
		$scope.entity.adsid = uniqueFlatAndDefined(collectAdProperty2($scope.ads, 'id')).sort().slice(0,10);
		$scope.entity.postTime = uniqueFlatAndDefined(collectAdProperty($scope.ads, 'posttime')).sort();
		$scope.entity.age = uniqueFlatAndDefined(collectAdProperty($scope.ads, 'age')).sort();
		$scope.entity.ethnicities = uniqueFlatAndDefined(collectAdProperty($scope.ads, 'ethnicity')).sort();
		$scope.entity.height = uniqueFlatAndDefined(collectAdProperty($scope.ads, 'height')).sort();
		$scope.entity.weight = uniqueFlatAndDefined(collectAdProperty($scope.ads, 'weight')).sort();
		$scope.entity.eyes = uniqueFlatAndDefined(collectAdProperty($scope.ads, 'eyes')).sort();
		$scope.entity.hair = uniqueFlatAndDefined(collectAdProperty($scope.ads, 'hair')).sort();
		$scope.entity.price = uniqueFlatAndDefined(collectAdProperty($scope.ads, 'rate60')).sort();
		$scope.entity.email = uniqueFlatAndDefined(collectAdProperty($scope.ads, 'email')).sort();
		$scope.entity.name = uniqueFlatAndDefined(collectAdProperty($scope.ads, 'name')).sort();
		$scope.entity.instagram = uniqueFlatAndDefined(collectAdProperty($scope.ads, 'instagram')).sort();
		$scope.entity.instagram_followers= uniqueFlatAndDefined(collectAdProperty($scope.ads, 'instagram_followers')).sort();
		$scope.entity.instagram_follows= uniqueFlatAndDefined(collectAdProperty($scope.ads, 'instagram_follows')).sort();
		$scope.entity.instagram_likers= uniqueFlatAndDefined(collectAdProperty($scope.ads, 'instagram_likers')).sort();
		$scope.entity.instagram_profile_picture= uniqueFlatAndDefined(collectAdProperty($scope.ads, 'instagram_profile_picture')).sort();
		$scope.entity.instagram_tags= uniqueFlatAndDefined(collectAdProperty($scope.ads, 'instagram_tags')).sort();

		$scope.entity.youtube= uniqueFlatAndDefined(collectAdProperty($scope.ads, 'youtube')).sort();
		$scope.entity.youtube_sameuser= uniqueFlatAndDefined(collectAdProperty($scope.ads, 'youtube_video_urls')).sort();
		for (var i = 0; i < $scope.entity.youtube.length; i++) {
			$scope.entity.youtube[i]=$sce.trustAsResourceUrl($scope.entity.youtube[i])
		}
		for (var i = 0; i < $scope.entity.youtube_sameuser.length; i++) {
			$scope.entity.youtube_sameuser[i]=$sce.trustAsResourceUrl($scope.entity.youtube_sameuser[i].replace("watch?v=", "embed/"))
		}
		$scope.entity.youtube_username= uniqueFlatAndDefined(collectAdProperty($scope.ads, 'youtube_user')).sort();


		$scope.entity.twitter= uniqueFlatAndDefined(collectAdProperty($scope.ads, 'twitter')).sort();
		for (var i = 0; i < $scope.entity.twitter.length; i++) {
			$scope.entity.twitter[i]=$scope.entity.twitter[i].replace("https://twitter.com/","@")
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
		
		var rawImageUrls = _.flatten(
			_.map($scope.ads, function(ad) {
				return ad.properties.image_locations;
			}),
			true
			);
		$scope.imageUrls = uniqueFlatAndDefined(_.filter(rawImageUrls, function(element){
			return ! _.isUndefined(element);
		}));

		$scope.faceImageUrl = _.flatten(
			_.map($scope.ads, function(ad) {
				return ad.properties.faceImageUrl;
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

	$http.get('/api/entities/' + $scope.id).success(function(res) {
		$scope.entity.phone = res._node.properties.identifier;
		$scope.entity.email = res._node.properties.email;
		$scope.entity.name = res._node.properties.name;
		$scope.entity.city = res._node.properties.city;
		$scope.entity.nFaces = res._node.properties.nFaces;
	});
 
	updateLinked();
	updateSuggestedText();
	updateSuggestedImage();
	// $scope.imagecat = $sce.trustAsResourceUrl("https://darpamemex:darpamemex@imagecat.memexproxy.com/imagespace/#search/" + "ads_id%3A" + entity.adsid.join("%20OR%20ads_id%3A"));


});


// TODO: put this under components
angular.module('memexLinkerApp').
filter('capitalize', function() {
	return function(input) {
		return (!!input) ? input.replace(/([^\W_]+[^\s-]*) */g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();}) : '';
	};
});

