'use strict';

describe('Controller: SavedentitiesCtrl', function () {

  // load the controller's module
  beforeEach(module('memexLinkerApp'));

  var SavedentitiesCtrl, scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    SavedentitiesCtrl = $controller('SavedentitiesCtrl', {
      $scope: scope
    });
  }));

  it('should ...', function () {
    expect(1).toEqual(1);
  });
});
