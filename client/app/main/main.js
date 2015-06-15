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


angular.module('memexLinkerApp').filter('nFacesFilter', function () {
    return function ( items,hasFacePic ) {
        console.log("inside the filter");
        console.log(items);
        var filteredItems = [];
        angular.forEach(items, function(item) {
            console.log('************************');
            console.log(item);
            console.log(item.face.length);
            console.log('************************');
            console.log(hasFacePic);
            //console.log($scope.hasFacePic);
            if (item.face.length >=1 ){
                filteredItems.push(item);
            }
        });
        return filteredItems;
    }
});


angular.module('memexLinkerApp').filter('lt', function () {
    return function ( items, value ) {
        var filteredItems = [];
        angular.forEach(items, function ( item ) {
            if ( item < value ) {
                filteredItems.push(item);
            }
        });
        return filteredItems;
    };
});
