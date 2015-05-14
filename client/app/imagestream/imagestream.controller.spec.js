'use strict';

describe('Controller: ImagestreamCtrl', function () {

  // load the controller's module
  beforeEach(module('memexLinkerApp'));

  var ImagestreamCtrl, scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    ImagestreamCtrl = $controller('ImagestreamCtrl', {
      $scope: scope
    });
  }));

  it('should ...', function () {
    expect(1).toEqual(1);
  });
});
