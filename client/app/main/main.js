'use strict';

angular.module('memexLinkerApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('main', {
        url: '/',
        templateUrl: 'app/main/main.html',
        controller: 'MainCtrl'
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