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


//------------------------ Start Accordion Code
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
//------------------------ End Accordion Code
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
		console.log("You searched for " + $scope.elasticSearchText)
		$http.post('/api/loggings/search', {elasticSearchText : $scope.elasticSearchText})
		entityService.search($scope.elasticSearchText, 10,10).then(function(entities){
			$scope.entities = entities;
			console.log('Found ' + entities.length + ' entites');
			_.forEach($scope.entities, function(entity) {
				console.log(entity);
				updateAggregates(entity, $scope.aggregates);
			});
			// console.log($scope.aggregates);
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

	// console.log(entity);
	console.log("prices")
}

});




