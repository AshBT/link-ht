'use strict';

angular.module('memexLinkerApp')
	.directive('mapBox', mapBox);

function mapBox() {
	var directive = {
		restrict: 'EA',
		templateUrl: 'app/mapBox/mapBox.html',
		scope: {
			data: '=',
			showSelector: '=',
			onShowSelector: '&',
			onBoundsChange: '&',
			onRangeChange: '&'
		},
		link: linkFunc,
		controller: MapBoxController,
		controllerAs: 'mb',
		bindToController: true // because the scope is isolated.
	};

	return directive;

	function linkFunc(scope, el, attr, ctrl) {
		//
	}
}

MapBoxController.$inject = ['$scope'];

function MapBoxController($scope) {
	var mb = this;

	// mb.data = [
 //  		{
 //  			id: 0,
 //  			latitude: 37.7833, 
 //  			longitude: -122.4167,
 //  			timestamp: Date.UTC(2015,5,1),
 //  			city : 'San Francisco',
 //  			state: 'California'
 //  		},
 //  		{
 //  			id: 1,
 //  			latitude: 40.7127, 
 //  			longitude: -74.0059,
 //  			timestamp: Date.UTC(2015,1,1),
 //  			city : 'New York',
 //  			state : 'New York' 
 //  		}
 //  	];

  	// Table settings 
  	mb.sortType = 'city';
  	mb.sortReverse = false;

    // Map
	mb.map = {center: {latitude: 37, longitude: -122}, zoom: 6, bounds: {}};

	// Rectangular selection
	mb.bounds = {
		northeast: {
			latitude: 37.01,
			longitude: -121.9
		},
		southwest: {
			latitude: 36.99,
			longitude: -122.1
		}
	};
	mb.showSelector = false;

	// Temporal Filtering with Angular-Rangeslider
	mb.dateSlider = {
		range : {
			MIN : (new Date(2012, 0, 1)).getTime(),
			MAX : (new Date()).getTime()
		},
		minDate: (new Date(2012, 0, 1)).getTime(),
		maxDate : (new Date()).getTime()
	};


	/**
	 * Center the selector rectangle and scale it to a fraction of the current map bounds.
	 * @return {[type]} [description]
	 */
	function initRectangleSelector (map) {
		//console.log('initRectangleSelector');
		var center = map.center;
		var bounds = map.bounds;
		//console.log(map.center.latitude);
		//console.log(map.center.longitude);
		//console.log(bounds);

		var _width = Math.abs(bounds.northeast.longitude - bounds.southwest.longitude);
		var _height = Math.abs(bounds.northeast.latitude - bounds.southwest.latitude);

		var rectangleWidth = _width / 4.91;
		var rectangleHeight = _height / 4.91;

		mb.bounds =  {
			sw: {
				latitude: center.latitude - (0.5 * rectangleHeight) ,
				longitude: center.longitude - (0.5 * rectangleWidth)
			},
			ne: {
				latitude: center.latitude + (0.5 * rectangleHeight),
				longitude: center.longitude + (0.5 * rectangleWidth)
			}
		};		
	}

	$scope.$watch('mb.dateSlider', function(){
		var minDate = mb.dateSlider.minDate;
		var maxDate = mb.dateSlider.maxDate;
		if(mb.onRangeChange() !== undefined) {
				mb.onRangeChange()(
					{
						minDate: minDate,
						maxDate: maxDate
					}
				);
			}
		// $scope.$ngc.filterBy('timestamp', {minDate: minDate, maxDate: maxDate}, function(range, timestamp) {
		// 	console.log('timestamp: ' + timestamp);
		// 	console.log(range);
		// 	return range.minDate <= timestamp && timestamp <= range.maxDate;
		// });
	}, true);

	$scope.$watch('mb.showSelector', function () {
		if(mb.onShowSelector() !== undefined) {
			if(mb.showSelector) {
				initRectangleSelector(mb.map);
			}
			// onShowSelector is a function reference. Evaluate it to get the callback function.
			mb.onShowSelector()(mb.showSelector);
		}
	});

	$scope.$watch('mb.bounds', function() {
		if(mb.bounds !== null) {
			// onBoundsChange is a function reference. Evaluate it to get the callback function.
			if(mb.onBoundsChange() !== undefined) {
				mb.onBoundsChange()(mb.bounds);
			}
		}
	}, true);

}