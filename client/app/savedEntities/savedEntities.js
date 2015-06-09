'use strict';

angular.module('memexLinkerApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('savedEntities', {
        url: '/savedEntities',
        templateUrl: 'app/savedEntities/savedEntities.html',
        controller: 'SavedentitiesCtrl'
      });
  });