'use strict';

var express = require('express');
var controller = require('./annotation.controller');

var router = express.Router();

router.post('/persist', controller.persist);
router.post('/search', controller.search);

module.exports = router;