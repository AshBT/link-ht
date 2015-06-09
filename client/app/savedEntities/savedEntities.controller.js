'use strict';

angular.module('memexLinkerApp')
.controller('SavedentitiesCtrl', function ($scope, $http, $q, lodash) {
    // fetch saved entities
    var _ = lodash;
    var source_map = {
    	1 : 'Backpage',
    	2 : 'Craigslist',
    	3 : 'Classivox',
    	4 : 'MyProviderGuide',
    	5 : 'NaughtyReviews',
    	6 : 'RedBook',
    	7 : 'CityVibe',
    	8 :  'MassageTroll',
    	9 : 'RedBookForum',
    	10 : 'CityXGuide',
    	11 : 'CityXGuideForum',
    	12 : 'RubAds',
    	13 : 'Anunico',
    	14 : 'SipSap',
    	15 : 'EscortsInCollege',
    	16 : 'EscortPhoneList',
    	17 : 'EroticMugshots',
    	18 :  'EscortsAdsXXX',
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

    $scope.logo = 'http://icons.iconarchive.com/icons/icons8/ios7/256/Very-Basic-Paper-Clip-icon.png';
    $scope.blur = true;
    $scope.entities = [];

});
