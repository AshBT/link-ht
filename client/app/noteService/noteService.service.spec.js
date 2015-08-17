'use strict';

describe('Service: noteService', function () {

  // load the service's module
  beforeEach(module('memexLinkerApp'));

  // instantiate service
  var noteService;
  beforeEach(inject(function (_noteService_) {
    noteService = _noteService_;
  }));

  it('should do something', function () {
    expect(!!noteService).toBe(true);
  });

});
