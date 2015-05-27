'use strict';

var express = require('express');
var controller = require('./entity.controller');

var router = express.Router();

router.get('/', controller.index);
router.get('/:id', controller.show);
router.get('/:id/byPhone', controller.byPhone);
router.get('/:id/byImage', controller.byImage);
router.get('/:id/byText', controller.byText);
router.get('/:id/linked', controller.linked);
router.post('/', controller.create);
//router.put('/:id', controller.update);
//router.patch('/:id', controller.update);
//router.delete('/:id', controller.destroy);

module.exports = router;