'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var NoteSchema = new Schema({
	// ID of the entity this note pertains to.
  entityId: String,
  	// The text of the note.
  comment: String,
  	// The name of the user who created the note.
  username: String,
  date: { type: Date, default: Date.now }

});

module.exports = mongoose.model('Note', NoteSchema);