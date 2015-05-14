'use strict';

angular.module('memexLinkerApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('imagestream', {
        url: '/imagestream',
        templateUrl: 'app/imagestream/imagestream.html',
        controller: 'ImagestreamCtrl'
      });
  });