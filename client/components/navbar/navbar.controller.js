'use strict';

angular.module('memexLinkerApp')
  .controller('NavbarCtrl', function ($scope, $location, Auth) {
    $scope.menu = [{
      'title': 'Entity Search',
      'link': '/'
    },
    {
      'title': 'Ad Stream',
      'link': '/posts'
    },
    {
      'title': 'Image Stream',
      'link': '/imagestream'
    }];

    $scope.isCollapsed = true;
    $scope.isLoggedIn = Auth.isLoggedIn;
    $scope.isAdmin = Auth.isAdmin;
    $scope.getCurrentUser = Auth.getCurrentUser;

    $scope.logout = function() {
      Auth.logout();
      $location.path('/login');
    };

    $scope.isActive = function(route) {
      return route === $location.path();
    };
  });