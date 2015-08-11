'use strict'

var express = require('express');
var router = express.Router();

var api = require('./api');

/** search
 *
 * The search endpoint can be used with
 *
 *     curl HOSTNAME/api/v1/search?size=10&page=1&count=yes -d query=fun -XPOST
 *
 * This will return a list of entities that match the full-text search
 * in the query.
 *
 * The query parameters are
 *    size  -- number of entities to return per page
 *    page  -- the page to return
 *    count -- "yes" or "no", whether to return the total count
 *
 * Asking for the total count of hits will incur a small performance
 * penalty. By default, no count is returned. We suggest calling it once
 * and caching the result.
 */
router.post('/search', api.search);

/** suggest
 *
 * The suggest endpoint can be used with
 *
 *     curl HOSTNAME/api/v1/entity/18004441234/suggest?size=10&page=1&count=yes
 *
 * This will return a list of ads suggested to be a part of the entity.
 *
 * The query parameters are
 *    size  -- number of suggested ads to return per page
 *    page  -- the page to return
 *    count -- "yes" or "no", whether to return the total count
 */
router.get('/entity/:id/suggest', api.suggestAd);

/** getEntity
 *
 * The getEntity endpoint can be used with
 *
 *    curl HOSTNAME/api/v1/entity/18004441234?size=10&page=1&count=yes
 *
 * This will get a list of ads in the entity.
 *
 * The query parameters are
 *    size  -- number of ads in the entity to return per page
 *    page  -- the page to return
 *    count -- "yes" or "no", whether to return the total count
 */
router.get('/entity/:id', api.getEntity);

/** attachAd
 *
 * The attachAd endpoint can be used with
 *
 *    curl -XPOST HOSTNAME/api/v1/entity/18004441234/link/12345?user=foobar
 *
 * This will add an ad with the given id (in the example, it's 12345) to
 * the entity (in the example, 18004441234).

 * The query parameters are
 *    user  -- the username adding the link
 */
router.post('/entity/:id/link/:ad_id', api.attachAd);

/** deleteAd
 *
 * The deleteAd endpoint can be used with
 *
 *    curl -XDELETE HOSTNAME/api/v1/entity/18004441234/link/12345?user=foobar
 *
 * This will delete an ad with the given id (in the example, it's 12345)
 * from the entity (in the example, 18004441234).

 * The query parameters are
 *    user  -- the username that originally added the link
 */
router.delete('/entity/:id/link/:ad_id', api.detachAd);

/** findSimilarImage
 *
 * The findSimilarImage endpoint forwards the request to
 *
 * https://isi.memexproxy.com/ColumbiaUimgSearch.php
 *
 * This will return a list of ads that contain the similar images. It
 * is not paginated.
 *
 * The query parameters are (copied from ISI):
 *    nodup        -- 1, 0 [remove or display exact duplicate, default: 0]
 *    num          -- maximum number of returned images [default: 30, 1000 if neardup activated]
 *    neardup      -- 1, 0 [activate near duplicate search, default: 0]
 *    neardup_type -- strict, loose, balanced [default: balanced]
 */
router.get('/image/similar', api.findSimilarImage);

module.exports = router;
