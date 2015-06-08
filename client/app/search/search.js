'use strict';

angular.module('memexLinkerApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('search', {
        url: '/search',
        templateUrl: 'app/search/search.html',
        controller: 'SearchCtrl'
      });
  });

angular.module('memexLinkerApp').filter('gt', function () {
    return function ( items, value ) {
        var filteredItems = []
        angular.forEach(items, function ( item ) {
            if ( item > value ) {
                filteredItems.push(item);
            }
        });
        return filteredItems;
    }
})

angular.module('memexLinkerApp').filter('lt', function () {
    return function ( items, value ) {
        var filteredItems = []
        angular.forEach(items, function ( item ) {
            if ( item < value ) {
                filteredItems.push(item);
            }
        });
        return filteredItems;
    }
})