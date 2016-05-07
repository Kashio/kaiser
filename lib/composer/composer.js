/**
 * Created by Roy on 05/02/2016.
 */

'use strict';

// lib modules
var CrawlerReferencer = require('../crawler_referencer');

/**
 * Abstract Composer Class
 *
 * @constructor
 */
function Composer() {
	throw new Error('cannot instantiate Composer because it\'s an abstract class');
}

/**
 * Initialize Composer
 *
 * @param {Crawler} crawler
 */
Composer.init = function(crawler) {
	var self = this;
	CrawlerReferencer.init.call(self, crawler);
};

/**
 *
 * @callback endComposeCallback
 * @param {?*} error
 * @params {Resource[]} resources
 */

/**
 * Compose a resource out of uris array and originator resource
 *
 * @param {String[] }uris
 * @param {?Resource} originator
 * @param {endComposeCallback} callback
 */
Composer.prototype.compose = function(/*eslint-disable no-unused-vars*/uris, originator, callback/*eslint-enable no-unused-vars*/) {
	throw new Error('cannot call abstract method');
};

module.exports = Composer;