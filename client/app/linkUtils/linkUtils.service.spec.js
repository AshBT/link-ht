'use strict';

describe('Service: linkUtils', function () {

  // load the service's module
  beforeEach(module('memexLinkerApp'));

  // instantiate service
  var linkUtils;
  beforeEach(inject(function (_linkUtils_) {
    linkUtils = _linkUtils_;
  }));

  it('should do something', function () {
    expect(!!linkUtils).toBe(true);
  });

});
