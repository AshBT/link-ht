'use strict';

angular.module('memexLinkerApp')
  .controller('EntitydetailCtrl', function ($scope, $stateParams) {
    $scope.message = 'Hello';
    $scope.id = $stateParams.id;
  });
