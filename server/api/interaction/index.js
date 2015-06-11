'use strict';

var express = require('express');
var controller = require('./interaction.controller');

var router = express.Router();

//router.get('/', controller.index);
//router.get('/:id', controller.show);
router.post('/saved', controller.saved);
// router.put('/:id', controller.update);
// router.patch('/:id', controller.update);
// router.delete('/:id', controller.destroy);

module.exports = router;