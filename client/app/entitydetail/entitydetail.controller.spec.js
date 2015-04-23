'use strict';

describe('Controller: EntitydetailCtrl', function () {

  // load the controller's module
  beforeEach(module('memexLinkerApp'));

  var EntitydetailCtrl, scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    EntitydetailCtrl = $controller('EntitydetailCtrl', {
      $scope: scope
    });
  }));

  it('should ...', function () {
    expect(1).toEqual(1);
  });
});
