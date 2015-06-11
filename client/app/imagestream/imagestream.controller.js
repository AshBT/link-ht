'use strict';

angular.module('memexLinkerApp')
  .controller('ImagestreamCtrl', function ($scope, $http, lodash) {

  	var _ = lodash;

  	// Scope Variables
    $scope.logo = "http://icons.iconarchive.com/icons/icons8/ios7/256/Very-Basic-Paper-Clip-icon.png";
    $scope.imageUrls = [];
    
    // Scope Functions

    // Non-scope functions
    function uniqueFlatAndDefined(items) {
      return _.filter(_.uniq(_.flatten(items)), function(item) {
        return ! _.isUndefined(item);
      });
    }


    // And the rest
    $http.get('api/ads/').success(function(res) {
    	$scope.imageUrls = uniqueFlatAndDefined(_.map(res, function(ad){
    		return ad._node.properties.image_locations;
    	}));
    });

  });
