/**
 * Created by Roy on 05/02/2016.
 */

/**
 * Abstract CralwerReferencer Class
 *
 *
 * @constructor
 */
function CrawlerReferencer() {
	throw new Error('cannot instantiate CrawlerReferencer because it\'s an abstract class');
}

/**
 * Initialize CralwerReferencer
 *
 * @param {Crawler} crawler
 */
CrawlerReferencer.init = function(crawler) {
	var self = this;
	self.crawler = crawler;
};

module.exports = CrawlerReferencer;