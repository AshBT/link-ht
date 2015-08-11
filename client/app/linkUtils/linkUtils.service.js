
(function(){
	'use strict';

	angular
	.module('memexLinkerApp')
	.factory('linkUtils', linkUtilsFactory);

	linkUtilsFactory.$inject = ['lodash'];

	function linkUtilsFactory(lodash) {
		var _ = lodash;

		// The public interface for this service.
		var service = {
			uniqueFlatAndDefined: uniqueFlatAndDefined,
			collectAdProperty: collectAdProperty,
			collectAdProperty2: collectAdProperty2,
			mode: mode 
		};

		return service;

		function uniqueFlatAndDefined(items) {
			return _.filter(_.uniq(_.flattenDeep(items)), function(item) {
				return ! _.isUndefined(item);
			});
		}

		function collectAdProperty(ads, propertyName) {
			return _.pluck(ads, propertyName);
		}

		function collectAdProperty2(ads, propertyName) {
			return _.trunc(_.pluck(ads, propertyName, 15));
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
	}

})();