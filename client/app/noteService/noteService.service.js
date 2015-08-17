'use strict';

angular
.module('memexLinkerApp')
.factory('noteService', noteService);

noteService.$inject = ['$http', '$q', '$resource',  'lodash'];


function noteService($http, $q, $resource, linkUtils, lodash) {
	var _ = lodash;

	var NoteResource = $resource('/api/notes');

	var service = {
		NoteResource: NoteResource
	};
	return service;

}