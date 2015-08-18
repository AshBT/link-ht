'use strict';

// TODO: inject an entity service, and use it to get the entity object
angular.module('memexLinkerApp')
//Deleted NotesService in line below
.controller('EntitydetailCtrl', function ($scope, $http, $stateParams, $q, $modal, lodash, Auth, $sce, Crossfilter, entityService, noteService, linkUtils) {
	var _ = lodash;

	// --- SCOPE VARIABLES --- //


// ------------------------ Start Upload to S3 Code ---------------------------------------------- //
// TODO: this logic should be moved to a service.
	$scope.sizeLimit      = 15878640; // 10MB in Bytes
	$scope.uploadProgress = 0;
	$scope.creds          = {};
	// $scope.file=[]

	var access='';
	var secret='';
	var s3_URL = [];

    console.log($scope.file);

	// console.log($scope.note)

  $scope.upload = function() {
  	console.log('uploading...');
    console.log($scope.file);

  	var f = document.getElementById('file').files[0],
      r = new FileReader();
  		r.onloadend = function(e){
    	var data = e.target.result;
    //send you binary data via $http or $resource or do anything else with it
  		}
  		r.readAsBinaryString(f);
		console.log(f)


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
        var uniqueFileName = 'Upload/' + $scope.uniqueString() + '-' + $scope.file.name;

        s3_URL.push('https://s3-us-west-1.amazonaws.com/generalmemex/' + uniqueFileName);

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
    };

    $scope.fileSizeLabel = function() {
    // Convert Bytes To MB
    return Math.round($scope.sizeLimit / 1024 / 1024) + 'MB';
  };

  $scope.uniqueString = function() {
    var text     = '';
    var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for( var i=0; i < 8; i++ ) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  };

// ------------------------ End Upload to S3 Code ---------------------------------------------- //

	function similar_images_to_uploaded_image(s3_URL) {
		$http.get('/api/v1/image/similar?url=' + s3_URL[0]).success(function(res){
		var ad=[]
		var url=[]
		for (var i = 0; i < res.length; i++) {
		        ad[i] = res[i].ad
		        url[i] = res[i].cached_image_urls
		      }
		ad = _.uniq(ad)
      	ad = _.filter(ad, function(element){
	      	return ! _.isUndefined(element);
	    	});
      	url = _.uniq(url)
      	url = _.filter(url, function(element){
	      	return ! _.isUndefined(element);
	    	});
      	// console.log(ad)
      	// console.log(url)
      	$scope.simImageId= ad // + $scope.simImageId
      	$scope.suggestedAds= ad
      	$scope.simImageUrl= url

			});
  		}


// ------------------------ End Similar to Uploaded Code ---------------------------------------------- //

	similar_images_to_uploaded_image(["http://static7.depositphotos.com/1001925/696/i/950/depositphotos_6961696-Funny-elderly-man-with-tongue-outdoor.jpg"])

	// similar_images_to_uploaded_image(s3_URL);


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


	// $scope.imagecat = []
	$scope.blur = true;
	$scope.ads = [];
	$scope.imageUrls = [];
	$scope.faceImageUrl = [];
	// $simImageId = []


	// $scope.suggestedAds =[];
	$scope.id = $stateParams.id;
	$scope.sourceMap = entityService.sources;

	// User-supplied annotations.
	$scope.annotations = [];
	$scope.text = '';

	$scope.map = {
		center: {
			latitude: 39.8282,
			longitude: -98.5795
		},
		zoom: 3
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
	$scope.$ngc = new Crossfilter([], 'id', 'persistent', ['id','latitude', 'longitude', 'timestamp']);

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
			console.log('crossfilter collection:');
			console.log($scope.$ngc.collection());
			$scope.$ngc.filterBy('latitude', {minLatitude: sw.latitude, maxLatitude: ne.latitude}, function(range, latitude) {
				console.log('range:');
				console.log(range);
				console.log('latitude:');
				console.log(latitude);
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
		var username = 'Anonymous';
		if(Auth.isLoggedIn()) {
			username = Auth.getCurrentUser().name;
		}

		var _note = {
			entityId: $scope.id,
			comment: this.text,
			username: username
		};


		var _noteResource = noteService.NoteResource.save(_note, function(){
			$scope.annotations.push({
				_id: _noteResource._id,
				note: _noteResource.comment,
				username: _noteResource.username, 
				date: _noteResource.date
			});
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

	// Link Ad to Entity by user-confirmed image similarity.
	$scope.linkToEntity = function(ad) {
		var username = 'Anonymous';
		if(Auth.isLoggedIn()) {
			username = Auth.getCurrentUser().name;
		}
		var data = {
			idA: _.parseInt($scope.id),
			idB: ad.id,
			relType: 'BY_IMG',
			properties: {
				userName: username
			}
		};
		$http.post('/api/relationships', data).
		success(function(data, status, headers, config) {
			updateLinked();
			updateSuggestedText();
			updateSuggestedImage();
		}).
		error(function(data, status, headers, config) {
			// console.log(data);
		});
	};

	// --- NON-SCOPE FUNCTIONS --- //

	var uniqueFlatAndDefined = linkUtils.uniqueFlatAndDefined;



	function updateLinked() {

		entityService.Entity.query({id: $scope.id}, function(data) {
			var _ads = data.ads;

			_.map(_ads, function(ad) {
				if(_.has(ad, 'sources_id') && _.has(entityService.icons, ad.sources_id)) {
					//ad.icon = entityService.icons[ad.sources_id];

					ad.options = {
						icon: {
							url: entityService.icons[ad.sources_id],
							scaledSize: new google.maps.Size(34, 44)
						}
    				};

				} else {
					console.log('No icon found.');
					console.log(ad);
					ad.icon = '/assets/images/yeoman.png';
				}

				// If ad has latitude and longitude values, convert them to numbers
				if (_.has(ad, 'latitude') && _.has(ad, 'longitude')) {
					// console.log('converting lat lon values to numbers');
					ad.latitude = Number(ad.latitude);
					ad.longitude = Number(ad.longitude);
				} else {
					// If latitude and longitude are not present, try to geocode the city name.
					if(_.has(ad, 'city')) {
						geocodeCity(ad.city).then(function(point) {
	  							ad.latitude = point.latitude;
	  							ad.longitude = point.longitude;
							}, function(reason) {
	  							alert('Failed: ' + reason);
							});
						}
				}
				ad.timestamp = Date.parse(ad.posttime);
				ad.city = ad.city.substring(0,20);


				// console.log('Bonjour');
				// console.log(ad);

				$scope.ads.push(ad);
				$scope.$ngc.addModel(ad);
			});
		});
	}

	$scope.$on('crossfilter/updated', function(event, collection, identifier) {
		// console.log('crossfilter/updated event.');
		updateEntity();
	});



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

	var _suggestionsPromise = entityService.Suggest.query({id: $scope.id}, function() {
		console.log('Suggest:');
		console.log(_suggestionsPromise.suggestions);
		$scope.suggestedAds = [];
		_.forEach(_suggestionsPromise.suggestions, function(e) {
			console.log(e);
			$scope.suggestedAds.push(e.json);
		});
		console.log($scope.suggestedAds);
	});

 	updateLinked();
	//$scope.imagecat = $sce.trustAsResourceUrl("https://darpamemex:darpamemex@imagecat.memexproxy.com/imagespace/#search/" + "ads_id%3A" + entity.adsid.join("%20OR%20ads_id%3A"));

	var _notes = noteService.NoteResource.query({entityId:$scope.id, now:Date.now()}, function(){
		console.log('Notes for entity[' + $scope.id +']:');
		console.log(_notes);
		// TODO: populate $scope.annotations
		_.forEach(_notes, function(_noteResource) {
			$scope.annotations.push({
				_id: _noteResource._id,
				text: _noteResource.comment,
				username: _noteResource.username,
				date: _noteResource.date
			});
		});
		console.log($scope.annotations);
	});

});


// TODO: put this under components
angular.module('memexLinkerApp').
filter('capitalize', function() {
	return function(input) {
		return (!!input) ? input.replace(/([^\W_]+[^\s-]*) */g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();}) : '';
	};
});

