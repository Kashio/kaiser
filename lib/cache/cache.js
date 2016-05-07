/**
 * Created by Roy on 03/01/2016.
 */

'use strict';

// core modules
var util           = require('util');

// lib modules
var ResourceWorker = require('../resource_worker');

/**
 * Abstract Cache class
 *
 * @constructor
 */
function Cache() {
	throw new Error('cannot instantiate Cache because it\'s an abstract class');
}

util.inherits(Cache, ResourceWorker);

/**
 * Initialize Cache
 *
 * @param {Crawler} crawler
 */
Cache.init = function(crawler) {
	var self = this;
	ResourceWorker.init.call(self, crawler, 'store');
};

/**
 * Retrieve a resource by a uri lookup
 *
 * @param {String} uri
 */
Cache.prototype.retrieve = function(/*eslint-disable no-unused-vars*/uri/*eslint-enable no-unused-vars*/) {
	throw new Error('cannot call abstract method');
};

module.exports = Cache;