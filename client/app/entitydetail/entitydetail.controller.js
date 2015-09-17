'use strict';

angular.module('memexLinkerApp')

.controller('EntitydetailCtrl', function ($scope, $timeout, $http, $stateParams, $q, $modal, lodash, Auth, $sce, Crossfilter, entityService, linkUtils) {
	var _ = lodash;
	var uniqueFlatAndDefined = linkUtils.uniqueFlatAndDefined;

// ------------------------ Start Upload to S3 Code ---------------------------------------------- //
// TODO: this logic should be moved to a service.
	$scope.sizeLimit      = 15878640; // 10MB in Bytes
	$scope.uploadProgress = 0;
	$scope.creds          = {};

	var access='';
	var secret='';
	var s3_URL = [];

	//console.log($scope.file);

	/**
	 * [upload description]
	 * @return {[type]} [description]
	 */
	$scope.upload = function() {
		console.log('uploading...');
		console.log($scope.file);

		var f = document.getElementById('file').files[0],
		r = new FileReader();
		r.onloadend = function(e){
			var data = e.target.result;
		};
		// r.readAsBinaryString(f);
		console.log(f);
		$scope.file = f;
		var access='AKIAJ5LO4XW7YN2NN25A';
		var secret='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';

		AWS.config.update({ accessKeyId: access, secretAccessKey: secret });
		AWS.config.region = 'us-west-1';
		var bucket = new AWS.S3({ params: { Bucket: 'generalmemex' } });

		if($scope.file) {
			// Perform File Size Check First
			var fileSize = Math.round(parseInt($scope.file.size));
			if (fileSize > $scope.sizeLimit) {
				toastr.error('Sorry, your attachment is too big. <br/> Maximum 15mb file attachment allowed','File Too Large');
				return false;
			}
			// Prepend Unique String To Prevent Overwrites
			var uniqueFileName = 'Upload/' + uniqueString() + '-' + $scope.file.name;
			s3_URL.push($sce.trustAsResourceUrl('https://s3-us-west-1.amazonaws.com/generalmemex/' + uniqueFileName));
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

			$timeout(function() {
				$scope.s3_URLs = s3_URL
				console.log('update with timeout fired')
			}, 5000);
		} else {
			// No File Selected
			toastr.error('Please select a file to upload');
		}
	};

$scope.fileSizeLabel = function() {
	// Convert Bytes To MB
	return Math.round($scope.sizeLimit / 1024 / 1024) + 'MB';
};

function uniqueString() {
	var text     = '';
	var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

	for( var i=0; i < 8; i++ ) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}

// ------------------------ End Upload to S3 Code ---------------------------------------------- //

$scope.seeImages = function() {
	similar_images_to_uploaded_image($scope.s3_URLs);
};

function similar_images_to_uploaded_image(s3_URL) {
	$scope.simImageUrl =[];

	$http.get('/api/v1/image/similar?url=' + s3_URL[0]).success(function(res){

		var ad=[];
		var url=[];
		for (var i = 0; i < res.length; i++) {
			ad[i] = res[i].ad;
			url[i] = $sce.trustAsResourceUrl(res[i].cached_image_urls);
		}
		ad = _.uniq(ad);
		ad = _.filter(ad, function(element){
			return ! _.isUndefined(element);
		});
		url = _.uniq(url);
		url = _.filter(url, function(element){
			return ! _.isUndefined(element);
		});

		$scope.simImageUrl = url; // + $scope.simImageUrl
		console.log($scope.simImageUrl);
	});
}

// ------------------------ End Similar to Uploaded Code ---------------------------------------------- //

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

	$scope.blur = true;
	$scope.imageUrls = [];
	$scope.faceImageUrl = [];
	$scope.id = $stateParams.id;
	$scope.sourceMap = entityService.sources;

	// User-supplied annotations.
	$scope.annotations = [];
	// Input field for annotations.
	$scope.text = '';

	// $scope.map = {
	// 	center: {
	// 		latitude: 39.8282,
	// 		longitude: -98.5795
	// 	},
	// 	zoom: 3
	// };

	/*
	Array of marker objects
	 {
		id: 583187,
		latitude: 46.7682,
		longitude: -71.3234,
		title: 'title'
	 }
	 */
	//$scope.markers = [];

	$scope.ads = [];
	$scope.adPagination = {
		page: 1,
		perPage: 5,
		total: 0
	};

	$scope.similarAdsbyImage =[];
	$scope.similarAdsPagination = {
		page: 1,
		perPage: 5,
		total: 0
	};

	// ng-crossfilter. collection | primary key | strategy | properties
	$scope.$ngc = new Crossfilter([], 'id', 'persistent', ['id','latitude', 'longitude', 'timestamp']);

	// This indicates whether the goegraphic selection box is enabled.
	$scope.showSelector = false;

	// Callback for changes in showSelector.
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
		$scope.$ngc.unfilterBy('latitude');
		$scope.$ngc.unfilterBy('longitude');
		if($scope.showSelector) {
			var sw = bounds.sw;
			var ne = bounds.ne;
			console.log('crossfilter collection:');
			console.log($scope.$ngc.collection());
			$scope.$ngc.filterBy('latitude', {minLatitude: sw.latitude, maxLatitude: ne.latitude}, function(range, latitude) {
				return range.minLatitude <= latitude && latitude <= range.maxLatitude;
			});
			$scope.$ngc.filterBy('longitude', {minLon: sw.longitude, maxLon: ne.longitude}, function(range, lon) {
				return range.minLon <= lon && lon <= range.maxLon;
			});
		}
	};

	// Callback for changes in date slider range.
	$scope.onRangeChange = function(range) {
		$scope.$ngc.filterBy('timestamp', {minDate: range.minDate, maxDate: range.maxDate}, function(range, timestamp) {
			return range.minDate <= timestamp && timestamp <= range.maxDate;
		});
	};

	$scope.submitNote = function() {
		var text = this.text;
		this.text = '';
		var username = 'Anonymous';
		if(Auth.isLoggedIn()) {
			username = Auth.getCurrentUser().name;
		}

		$http.post('/api/v1/entity/' + $scope.id + '/note?user=' + username + '&text=' + text).
		then(function(response) {
			// this callback will be called asynchronously
			// when the response is available
			$scope.annotations.push({
				text: text,
				user: username, 
				timestamp: Date.now()
			});
		}, function(response) {
			// called asynchronously if an error occurs
			// or server returns response with an error status.
			console.log('Error while submitting annotation.');
			console.log(response);
		});
	};

	$scope.saveEntity = function() {
		var username = 'Anonymous';
		if(Auth.isLoggedIn()) {
			username = Auth.getCurrentUser().name;
		}
		var entityInfo = {
			entityId: $scope.id,
			username: username
		};
		$http.post('/api/annotations/persist', {entityInfo : entityInfo});
	};

	$scope.getHost = function (url) {
		var parser = document.createElement('a');
		parser.href = url;
		return parser.host;
	};

	// Link Ad to this Entity
	$scope.linkToEntity = function(adId) {
		$http.post('/api/v1/entity/' + $scope.id + '/link/' + adId, {
			user: getUserName()
		}).then(function(response){
			// success
		}, function(response){
			console.log('linkToEntity failed.');
			console.log(response);
		});
	};

	$scope.delinkFromEntity = function(adId) {
		$http.delete('/api/v1/entity/' + $scope.id + '/link/' + adId, {
			user: getUserName()
		}).then(function(response){
			// success
		}, function(response){
			console.log('delinkFromEntity failed.');
			console.log(response);
		});
	};

	/**
	 * Prepares "raw" ads from the API for display.
	 * @param  {[type]} rawAds [description]
	 * @return {[type]} Ads for display.
	 */
	function processRawAds(rawAds) {
		var processedAds = [];
		_.map(rawAds, function(ad) {
			ad.timestamp = Date.parse(ad.posttime);	
			
			if(isNaN(ad.timestamp)) {
				console.log('Unable to parse ad posttime ' + ad.posttime + ' Using an arbitrary date instead.');
				ad.timestamp = (new Date(2015, 0, 1)).getTime();
				ad.posttime = (new Date(2015, 0, 1)).getTime();
			}
			ad.city = ad.city.substring(0,20);

			if(_.has(ad, 'sources_id') && _.has(entityService.icons, ad.sources_id)) {
				ad.options = {
					icon: {
						url: entityService.icons[ad.sources_id],
						scaledSize: new google.maps.Size(34, 44)
					}
				};
			} else {
				console.log('No icon found.');
				ad.icon = '/assets/images/backpage.png';
			}

			if ( 'latitude' in ad && 'longitude' in ad) {
				ad.latitude = Number(ad.latitude);
				ad.longitude = Number(ad.longitude);
			} else {
				ad.latitude = 0;
				ad.longitude = 0;
				// If latitude and longitude are not present, try to geocode the city name.
				
				// if(_.has(ad, 'city')) {
				// 	geocodeCity(ad.city).then(function(point) {
				// 		$scope.ads.push(ad);
				// 		$scope.$ngc.addModel(ad);
				// 		// Note: If an ad does not appear to be added, check if any filters applied to $ngc apply to the ad.
				// 	}, function(reason) {
				// 		console.log('Failed: ' + reason);
				// 	});
				// } else {
				// 	console.log('location?');
				// }
			}
			processedAds.push(ad);
		});
		return processedAds;
	}

	/**
	 * Gets ads linked to this entity, and notes.
	 * @return {[type]} [description]
	 */
	 function updateLinked() {
		entityService.Entity.query({id: $scope.id, size:$scope.adPagination.perPage, page:$scope.adPagination.page, count:'yes'}, function(data) {
			var notes = data.notes;
			_.map(notes, function(note){
				$scope.annotations.push(note);
			});
			var rawAds = data.ads;
			$scope.adPagination.total = data.total;
			var processedAds = processRawAds(rawAds);
			angular.forEach(processedAds, function(ad) {
				$scope.ads.push(ad);
				$scope.$ngc.addModel(ad);
			});
		});	
	 }

	 /**
	  * Fetch and process next page of ads.
	  * @return {[type]} [description]
	  */
	 $scope.loadNextPageOfAds = function() {
	 	if($scope.adPagination.page * $scope.adPagination.perPage < $scope.adPagination.total) {
	 		console.log('yes');
	 		var nextPage = $scope.adPagination.page + 1;
	 		$scope.adPagination.page = nextPage;
			entityService.Entity.query({id: $scope.id, size:$scope.adPagination.perPage, page:nextPage, count:'no'}, function(data) {
				console.log(data);
				var rawAds = data.ads;
				var processedAds = processRawAds(rawAds);
				angular.forEach(processedAds, function(ad) {
					$scope.ads.push(ad);
					$scope.$ngc.addModel(ad);
				});
			});
		}
	};

	$scope.$on('crossfilter/updated', function(event, collection, identifier) {
		updateEntity();
	});


// ------------------------ Start Suggest Ads with Similar Images ---------------------------------------------- //

var suggestTask;


/**
 * Suggests ads that have similar images to the set of provided images.
 * @param  {[type]} imageUrls [description]
 * @return {[type]} Promise of an array of ads.
 */
function suggestSimilarImages(imageUrls) {
	console.log('Starting Reverse Image Search: ' + imageUrls.length + ' image URLs.');
	if(imageUrls.length > 0) {
		toastr.info('Starting Reverse Image Search: ' + imageUrls.length + ' image URLs.');
	}
	
	var defer = $q.defer();
	var promises = [];

	angular.forEach(imageUrls, function(imageUrl){
		promises.push($http.get('/api/v1/image/similar?url=' + imageUrl));
	});

	$q.all(promises).then(function(responses){
		var _suggestedAds = [];
		angular.forEach(responses, function(res) {
			var _ads = _.pluck(res, 'ad');
			_suggestedAds = _suggestedAds.concat(_ads);
		});
		_suggestedAds = _.uniq(_.flatten(_suggestedAds));
		_suggestedAds = _.filter(_suggestedAds, function(element) {
			return ! _.isUndefined(element) && _.has(element,'id');
		});
		defer.resolve(_suggestedAds);
	});

	return defer.promise;
}


// ------------------------ End Suggest Ads with Similar Images ---------------------------------------------- //



	/**
	 * Update the aggregate statistics for this entity, based on the (possibly filtered) set of linked ads, suggested ads, etc.
	 */
	 function updateEntity() {
	 	$scope.entity.adId = uniqueFlatAndDefined(_.pluck($scope.ads, 'id')).sort();
	 	var boom = 'ads_id%3A' + $scope.entity.adId.join('%20OR%20ads_id%3A');
	 	$scope.imagecat = $sce.trustAsResourceUrl('https://darpamemex:darpamemex@imagecat.memexproxy.com/imagespace/#search/' + boom);

	 	$scope.entity.phone = uniqueFlatAndDefined(_.pluck($scope.ads, 'phone')).sort();
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
	 		$scope.entity.youtube[i]=$sce.trustAsResourceUrl($scope.entity.youtube[i]);
	 	}
	 	for (var i = 0; i < $scope.entity.youtube_sameuser.length; i++) {
	 		$scope.entity.youtube_sameuser[i]=$sce.trustAsResourceUrl($scope.entity.youtube_sameuser[i].replace("watch?v=", "embed/"));
	 	}
	 	$scope.entity.youtube_username= uniqueFlatAndDefined(_.pluck($scope.ads, 'youtube')).sort();
	 	$scope.entity.twitter= uniqueFlatAndDefined(_.pluck($scope.ads, 'twitter')).sort();
	 	for (var i = 0; i < $scope.entity.twitter.length; i++) {
	 		$scope.entity.twitter[i]=$scope.entity.twitter[i].replace("https://twitter.com/","@");
	 	}
	 	$scope.entity.tweets= uniqueFlatAndDefined(_.pluck($scope.ads, 'twitter')).sort();
	 	$scope.entity.twitter_followers= uniqueFlatAndDefined(_.pluck($scope.ads, 'twitter_followers')).sort();
	 	$scope.entity.twitter_friends= uniqueFlatAndDefined(_.pluck($scope.ads, 'twitter_friends')).sort();
	 	$scope.entity.twitter_name= uniqueFlatAndDefined(_.pluck($scope.ads, 'twitter_name')).sort();
	 	$scope.entity.twitter_profile_pic= uniqueFlatAndDefined(_.pluck($scope.ads, 'twitter_profile_pic')).sort();
	 	$scope.entity.twitter_profile_background_pic= uniqueFlatAndDefined(_.pluck($scope.ads, 'twitter_profile_background_pic')).sort();
	 	$scope.entity.twitter_description= uniqueFlatAndDefined(_.pluck($scope.ads, 'twitter_description')).sort();
	 	$scope.entity.yelp= uniqueFlatAndDefined(_.pluck($scope.ads, 'yelp')).sort();
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

	 	// if (! _.isEmpty($scope.entity.cities)) {

	 	// 	var promise = geocodeCity($scope.entity.cities[0]);
	 	// 	promise.then(function(point) {
	 	// 		$scope.map = {
	 	// 			center: {
	 	// 				latitude: point.latitude,
	 	// 				longitude: point.longitude
	 	// 			},
	 	// 			zoom: 3
	 	// 		};
	 	// 	}, function(reason) {
	 	// 		console.log('Failed');
	 	// 		console.log(reason);
	 	// 	}, function(update) {
	 	// 		console.log(update);
	 	// 	});

	 	// 	_.forEach($scope.entity.cities, function(city, key) {
	 	// 		geocodeCity(city)
	 	// 		.then(function(point){
			// 	 //   id: 583187,
			// 	 //   latitude: 46.7682,
			// 	 //   longitude: -71.3234,
			// 	 //   title: 'title'
			// 	 var m = {
			// 	 	id:key,
			// 	 	latitude: point.latitude,
			// 	 	longitude: point.longitude,
			// 	 	title: city
			// 	 };
			// 	 $scope.markers.push(m);
			// 	});
	 	// 	});
	 	// }

	 	suggestSimilarImages($scope.imageUrls).then(function(suggestedAds){
	 		console.log('Received ' + suggestedAds.length + ' suggestedAds.');
	 		suggestedAds = _.filter(suggestedAds, function(element){
	 			return !_.contains($scope.entity.adId, element.id);
	 		});
	 		$scope.similarAdsbyImage = _.uniq($scope.similarAdsbyImage.concat(suggestedAds));
	 	});	
	 }

	// The following function requires access to the internet. We need to develop an offline version of this geocoder.
	// var geocoder = new google.maps.Geocoder();
	// function geocodeCity(cityName) {
	// 	var deferred = $q.defer();

	// 	geocoder.geocode( { 'address': cityName }, function(results, status) {
	// 		if (status === google.maps.GeocoderStatus.OK && results.length > 0) {
	// 			var location = results[0].geometry.location;
	// 			deferred.resolve({
	// 				latitude: parseFloat(location.lat()),
	// 				longitude: parseFloat(location.lng())
	// 			});
	// 		} else {
	// 			deferred.resolve({
	// 				latitude: 0,
	// 				longitude: 0
	// 			});
	// 		}
	// 	});
	// 	return deferred.promise;
	// }

	var _suggestionsPromise = entityService.Suggest.query({id: $scope.id}, function() {
		console.log('Suggest:');
		toastr.info('Starting...', 'Text Similarity Search');
		console.log(_suggestionsPromise.suggestions);
		$scope.suggestedAds = [];
		_.forEach(_suggestionsPromise.suggestions, function(e) {
			console.log(e);
			$scope.suggestedAds.push(e.json);
		});
		console.log($scope.suggestedAds);
		toastr.clear;
		if ($scope.suggestedAds.length > 0) {
			toastr.success('Found ' + $scope.suggestedAds.length + ' Ads by Similar Text', 'Reverse Image Search');
		}
		else {
			toastr.error('Did Not Find Similar Ad Text', 'Reverse Image Search');
		}
	});

	updateLinked();
	//$scope.imagecat = $sce.trustAsResourceUrl("https://darpamemex:darpamemex@imagecat.memexproxy.com/imagespace/#search/" + "ads_id%3A" + entity.adsid.join("%20OR%20ads_id%3A"));

	// var _notes = noteService.NoteResource.query({entityId:$scope.id, now:Date.now()}, function(){
	// 	console.log('Notes for entity[' + $scope.id +']:');
	// 	console.log(_notes);
	// 	// TODO: populate $scope.annotations
	// 	_.forEach(_notes, function(_noteResource) {
	// 		$scope.annotations.push({
	// 			_id: _noteResource._id,
	// 			text: _noteResource.comment,
	// 			username: _noteResource.username,
	// 			date: _noteResource.date
	// 		});
	// 	});
	// 	console.log($scope.annotations);
	// });


function getUserName() {
	return Auth.isLoggedIn() ? Auth.getCurrentUser().name : 'Anonymous';
}

});

angular.module('memexLinkerApp').
filter('capitalize', function() {
	return function(input) {
		return (!!input) ? input.replace(/([^\W_]+[^\s-]*) */g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();}) : '';
	};
});

