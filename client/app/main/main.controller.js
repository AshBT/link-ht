'use strict';

angular.module('memexLinkerApp')
.controller('MainCtrl', function ($scope, $http, $q, socket, lodash, entityService, linkUtils) {

	var _ = lodash;

	// $scope variables

	$scope.entities = [];
	$scope.aggregates = initAggregates();
	$scope.logo = 'http://icons.iconarchive.com/icons/icons8/ios7/256/Very-Basic-Paper-Clip-icon.png';
	$scope.blur = true;
	$scope.hasFacePic = false;
	$scope.hasSimilarAds = false;
	$scope.hasSocialMedia = false;
	$scope.xx = {};
	$scope.nSuggestedByText = 0;


	//Accordion Code
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

	// $scope functions

	$scope.addItem = function() {
		var newItemNo = $scope.items.length + 1;
		$scope.items.push('Item ' + newItemNo);
	};

	$scope.status = {
		isFirstOpen: true,
		isFirstDisabled: false
	};

	$scope.search = function(){
		entityService.search($scope.elasticSearchText, 10,10).then(function(entities){
			$scope.entities = entities;
			console.log('Found ' + entities.length + ' entites');
			_.forEach($scope.entities, function(entity) {
				console.log(entity);
				updateAggregates(entity, $scope.aggregates);
			});
			console.log($scope.aggregates);
			// TODO: summarize each entity
		},function(reason){
			console.log('Failed: ' + reason);
		});
	};

	$scope.facesFilter = function(e,hasFacePic){
		//return e.face.length >=1 || !$scope.hasFacePic;
		return 0;
	};

	$scope.socialMediaFilter = function(e,hasSocialMedia){
		//return e.socialmedia >=1 || !$scope.hasSocialMedia;
		return 0;
	};

	$scope.similarAdsFilter = function(e,hasFacePic){
		//return e.similarads >=1 || !$scope.hasSimilarAds;
		return 0;
	};

	$scope.getNSuggestedByText = function(entity) {
	// var deferred = $q.defer();
	// $http.get('api/entities/' + entity.id + '/byText').success(function(res){
	//   deferred.resolve(res[0]["count(ad)"] || 0);
	// });
	// return deferred.promise;
	return 0;
};

	// Non-scope functions

	function initAggregates() {
			// Consider using HashMap instead.
			return {
				'entityIds': [],
				'websites': [],
				'names': [],
				'nAds': 0,
				'nPictures': 0,
				'phones': [],
				'ages': [],
				'socialMediaAccounts': [],
				'cities': [],
				'prices': [],
				'ethnicities': [],
				'twitters': [],
				'instagrams': [],
				'price_min' : null,
				'price_max' : null,
				
				set: function(key, value) {
					this[key] = value;
					return this;
				},
				get: function(key) {
					return this[key];
				}
			};
		}

		var uniqueFlatAndDefined = linkUtils.uniqueFlatAndDefined;
		var collectAdProperty = linkUtils.collectAdProperty;
		var collectAdProperty2 = linkUtils.collectAdProperty2;

		// This summarizing is now provided bt entityService.
// 		function summarizeEntity(entity) {
// 			var deferred = $q.defer();

// 			$http.get('api/entities/' + entity.id + '/byphone').success(function(res){
// 				var ads = _.map(res, function(element){
// 					var ad = {
// 						'id':element.ad._id,
// 						'labels':element.ad.labels,
// 						'properties':element.ad.properties
// 					};
// 					return ad;
// 				});

// 				var postTimes = _.map(ads, function(ad){
// 					return new Date(ad.properties.posttime);
// 				});
// 				var lastPostTime = _.max(postTimes);
// 				var firstPostTime = _.min(postTimes);

// 				var age = uniqueFlatAndDefined(collectAdProperty(ads, 'age')).sort();
// 				var minAges = _.min(age);
// 				var maxAges = _.max(age);


// 				var rate60 = uniqueFlatAndDefined(collectAdProperty(ads, 'rate60'));
// 				var minPrice = null;
// 				var maxPrice = null;
// 				if (rate60.length === 1 && rate60[0] != null) {
// 					minPrice = maxPrice= rate60[0] ;
// 				}
// 				else if (rate60.length > 1) {
// 					minPrice = _.min(rate60);
// 					maxPrice = _.max(rate60);
// 				}

// 				var website=[];
// 				var sourcesid = uniqueFlatAndDefined(collectAdProperty(ads, 'sources_id'));
// 				for (var i = 0; i < sourcesid.length; i++) {
// 					website=website.concat(entityService.source[sourcesid[i]]);
// 				}
// 				website = _.filter(_.uniq(website), function(element){
// 					return ! _.isUndefined(element);
// 				});

// 				var title = collectAdProperty(ads, 'title');
// 				var text = collectAdProperty(ads, 'text');
// 				var name = uniqueFlatAndDefined(collectAdProperty(ads, 'name'));
// 				var city = uniqueFlatAndDefined(collectAdProperty2(ads, 'city'));
// 				var youtube = uniqueFlatAndDefined(collectAdProperty(ads, 'youtube'));
// 				var instagram = uniqueFlatAndDefined(collectAdProperty(ads, 'instagram'));
// 				var twitter = uniqueFlatAndDefined(collectAdProperty(ads, 'twitter'));
// 				var ethnicity = uniqueFlatAndDefined(collectAdProperty(ads, 'ethnicity'));
// 				var imageUrls = _.uniq(lodash.flatten(
// 					_.map(ads, function(ad) {
// 						return ad.properties.image_locations;
// 					}),
// 					true
// 					));

// 				imageUrls = _.filter(imageUrls, function(element){
// 					return ! _.isUndefined(element);
// 				});
// 				var face = _.uniq(lodash.flatten(
// 					_.map(ads, function(ad) {
// 						return ad.properties.face_image_url;
// 					}),
// 					true
// 					));
// 				face= _.filter(face, function(element){
// 					return ! _.isUndefined(element);
// 				});

// 				$http.get('api/entities/' + entity.id + '/byimage').success(function(res){
// 					var nSuggestedByImage = res[0]["count(ad)"] || 0;
// 					$scope.getNSuggestedByText(entity).then( function(nSuggestedByText){
// 						var entitySummary = {
// 							id: entity.id,
// 							phone: entity.phone,
// 							nPosts: ads.length,
// 							nPics: imageUrls.length,
// 							nSuggestedByImage: nSuggestedByImage,
// 							nSuggestedByText: nSuggestedByText,
// 							nSuggestedByPhone: 0,
// 							postTimes : postTimes,
// 							lastPostTime: lastPostTime,
// 							firstPostTime: firstPostTime,
// 							age: age,
// 							minAges: minAges,
// 							maxAges: maxAges,
// 							imageUrls: imageUrls,
// 							minPrice: minPrice,
// 							maxPrice: maxPrice,
// 							rate60: rate60,
// 							sourcesid: sourcesid,
// 							title: title,
// 							text:text,
// 							name: name,
// 							city: city,
// 							website: website,
// 							twitter: twitter,
// 							instagram: instagram,
// 							ethnicity: ethnicity,
// 							face: face, 
// 							socialmedia: twitter.length + instagram.length + youtube.length,
// 							similarads: nSuggestedByImage + nSuggestedByText,
// 						};
// 						deferred.resolve(entitySummary);
// 					});
// 				});
// });

// return deferred.promise;
// }


function updateAggregates(entitySummary, aggregates) {
	// Entity IDs
	var entityIds = aggregates.get('entityIds');
	entityIds.push(entitySummary.id);
	aggregates.set('entityIds', uniqueFlatAndDefined(entityIds));
	// Websites
	var websites = aggregates.get('websites');
	websites.push(entitySummary.website);
	aggregates.set('websites', uniqueFlatAndDefined(websites));
	//Names
	var names = aggregates.get('names');
	names.push(entitySummary.name);
	aggregates.set('names', uniqueFlatAndDefined(names));
	//Instagram
	var instagrams = aggregates.get('instagrams');
	instagrams.push(entitySummary.instagram);
	aggregates.set('instagrams', uniqueFlatAndDefined(instagrams));
	//Twitter
	var twitters = aggregates.get('twitters');
	twitters.push(entitySummary.twitter);
	aggregates.set('twitters', uniqueFlatAndDefined(twitters));
	//Ethnicities
	var ethnicities = aggregates.get('ethnicities');
	ethnicities.push(entitySummary.ethnicity);
	aggregates.set('ethnicities', uniqueFlatAndDefined(ethnicities));
	// Ads
	var nAds = aggregates.get('nAds');
	aggregates.set('nAds', nAds + Number(entitySummary.nPosts));
	//Images
	var nPictures = aggregates.get('nPictures');
	aggregates.set('nPictures', nPictures + Number(entitySummary.nPics));
	// Cities
	var cities = aggregates.get('cities');
	cities.push(entitySummary.city);
	aggregates.set('cities', uniqueFlatAndDefined(cities));
	// Phones
	var phones = aggregates.get('phones');
	phones.push(entitySummary.phone);
	aggregates.set('phones', uniqueFlatAndDefined(phones));
	// Ages
	var ages = aggregates.get('ages');
	ages.push(entitySummary.ages);
	aggregates.set('age_min', _.min(_.filter(uniqueFlatAndDefined(ages), function(n) {
		return Number((n % 1 ) === 0);
	})));
	aggregates.set('age_max', _.max(_.filter(uniqueFlatAndDefined(ages), function(n) {
		return Number((n % 1 ) === 0);
	})));

	// Prices
	var prices = aggregates.get('prices');
	prices.push(_.map(entitySummary.rates60, Number));	
	aggregates.set('prices', uniqueFlatAndDefined(prices));
	aggregates.set('price_max', _.max(aggregates.get('prices')));
	aggregates.set('price_min', _.min(aggregates.get('prices')));

	console.log(aggregates);
}

});




