'use strict';

describe('Directive: mapBox', function () {

  // load the directive's module and view
  beforeEach(module('cyberApp'));
  beforeEach(module('app/mapBox/mapBox.html'));

  var element, scope;

  beforeEach(inject(function ($rootScope) {
    scope = $rootScope.$new();
  }));

  it('should make hidden element visible', inject(function ($compile) {
    element = angular.element('<map-box></map-box>');
    element = $compile(element)(scope);
    scope.$apply();
    expect(element.text()).toBe('this is the mapBox directive');
  }));
});