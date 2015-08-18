'use strict';

angular.module('memexLinkerApp')
.controller('MainCtrl', function ($scope, $http, $q, socket, lodash, entityService, linkUtils, Crossfilter) {

	var _ = lodash;

	$scope.entities = [];

	$scope.paginatedEntites = {
		entities: [],
		total: 0,
		page: 1,
		perPage: 50,
	};
	// ng-crossfilter. collection | primary key | strategy | properties
	$scope.entityCrossfilter = new Crossfilter([], 'id', 'persistent', ['id', 'faceImageUrls', 'socialmedia', 'similarads']);
	$scope.aggregates = initAggregates();
	$scope.logo = 'http://icons.iconarchive.com/icons/icons8/ios7/256/Very-Basic-Paper-Clip-icon.png';
	$scope.blur = false;
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

	// Watch for changes in the face filter checkbox.
	$scope.onFaceChange = function(enableFaceFilter) {
		if(enableFaceFilter) {
			$scope.entityCrossfilter.filterBy('faceImageUrls', function(urlArray) {
				return urlArray.length > 0;
			});
		} else {
			$scope.entityCrossfilter.unfilterBy('faceImageUrls');
		}
	};

	$scope.onSimilarChange = function(enableSimilarFilter) {
		if(enableSimilarFilter) {
			$scope.entityCrossfilter.filterBy('similarads', function(nSimilarAds) {
				return nSimilarAds > 0;
			});
		} else {
			$scope.entityCrossfilter.unfilterBy('similarads');
		}
	};

	$scope.onSocialChange = function(enableSocialFilter) {
		if(enableSocialFilter) {
			$scope.entityCrossfilter.filterBy('socialmedia', function(values) {
				return values.length > 0;
			});
		} else {
			$scope.entityCrossfilter.unfilterBy('socialmedia');
		}
	};

	$scope.addItem = function() {
		var newItemNo = $scope.items.length + 1;
		$scope.items.push('Item ' + newItemNo);
	};

	$scope.status = {
		isFirstOpen: true,
		isFirstDisabled: false
	};
	
	$scope.search = function(){

		$scope.entityCrossfilter = new Crossfilter([], 'id', 'persistent', ['id', 'faceImageUrls', 'socialmedia', 'similarads']);
		$scope.aggregates = initAggregates();

		console.log('You searched for ' + $scope.elasticSearchText);

		var re1 = new RegExp(".{0,50}" + $scope.elasticSearchText + '.{0,50}',"gi");
		var re2 = new RegExp($scope.elasticSearchText,"gi");
		var re3 = new RegExp(".{0,50}" + $scope.elasticSearchText,"gi");
		var re4 = new RegExp($scope.elasticSearchText + '.{0,50}',"gi");

		$http.post('/api/loggings/search', {elasticSearchText : $scope.elasticSearchText});

		entityService.search($scope.elasticSearchText, 50,1).then(function(paginatedResults){
			$scope.paginatedEntites = paginatedResults;
			var entities = paginatedResults.entities;
			console.log('Found ' + paginatedResults.total + ' entites');
			$scope.entities = entities;
			_.forEach($scope.entities, function(entity) {
				var regex=entity.all_text.match(re1,"");
				if (regex!=null) {
					var start_regex = regex[0].match(re3,"")[0].replace(re2,"");
					var mid_regex = regex[0].match(re2,"")[0]
					var end_regex = regex[0].match(re4,"")[0].replace(re2,"");
					console.log(start_regex + mid_regex + end_regex);
					entity.snippet1 = start_regex;
					entity.snippet2 = mid_regex;
					entity.snippet3 = end_regex;
					entity.nResults = regex.length
				}
				else {
					console.log("The regex returned a Null result");
					// entity.snippet1 = start_regex;
					// entity.snippet2 = mid_regex;
					// entity.snippet3 = end_regex;
				}

				updateAggregates(entity, $scope.aggregates);
			});
			//var _models = $scope.entityCrossfilter.collection();
			//console.log(_models)
			//$scope.entityCrossfilter.deleteModels(_models);
			//console.log(entities)
			$scope.entityCrossfilter.addModels(entities);
			console.log($scope.aggregates);
			console.log($scope.entityCrossfilter.collection());

		},function(reason){
			console.log('Failed: ' + reason);
		});
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
	phones.push(uniqueFlatAndDefined(entitySummary.phone));
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
}

});




