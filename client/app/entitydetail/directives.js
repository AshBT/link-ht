// ------------------------ Start Upload to S3 Code ---------------------------------------------- //

'use strict';

var directives = angular.module('directives', []);

directives.directive('file', function() {
  return {
    restrict: 'AE',
    scope: {
      file: '@'
    },
    link: function(scope, el, attrs){
      el.bind('change', function(event){
        var files = event.target.files;
        var file = files[0];
        scope.file = file;
        scope.$parent.file = file;
        // console.log(scope.file)
        scope.$apply();
      });
    }
  };
});

// ------------------------ End Upload to S3 Code ---------------------------------------------- //
