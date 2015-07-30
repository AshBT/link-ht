'use strict'

var express = require('express');
var router = express.Router();

var api = require('./api');

console.log(api)

router.post('/search', api.search);
router.post('/search/count', api.count);
router.get('/entity/:id/suggest', api.suggestAd);
router.get('/entity/:id', api.getEntity);
router.post('/entity/:id/link', api.attachAd);
router.delete('/entity/:id/link', api.detachAd);

module.exports = router;
