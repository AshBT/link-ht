'use strict'

var express = require('express');
var router = express.Router();

var api = require('./api');

router.post('/search', api.search);
router.get('/entity/:id/suggest', api.suggestAd);
router.get('/entity/:id', api.getEntity);
router.post('/entity/:id/link/:ad_id', api.attachAd);
router.delete('/entity/:id/link/:ad_id', api.detachAd);

module.exports = router;
