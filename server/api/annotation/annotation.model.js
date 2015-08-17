'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var AnnotationSchema = new Schema({
  name: String,
  info: String,
  active: Boolean
});

module.exports = mongoose.model('Annotation', AnnotationSchema);