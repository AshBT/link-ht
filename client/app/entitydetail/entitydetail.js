'use strict';

angular.module('memexLinkerApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('entitydetail', {
        url: '/entitydetail',
        templateUrl: 'app/entitydetail/entitydetail.html',
        controller: 'EntitydetailCtrl'
      });
  });