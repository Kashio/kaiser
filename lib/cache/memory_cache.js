/**
 * Created by Roy on 31/01/2016.
 */

'use strict';

// core modules
var util     = require('util');

// npm modules
var _        = require('underscore');

// lib modules
var Cache    = require('./cache');

/**
 *  Memory Cache
 *
 * @param {Crawler} crawler
 * @constructor
 */
function MemoryCache(crawler) {
	var self = this;
	MemoryCache.init.call(self, crawler);
}

util.inherits(MemoryCache, Cache);

/**
 * Initialize MemoryCache
 */
MemoryCache.init = function(crawler) {
	var self = this;
	Cache.init.call(self, crawler);
	if (!self._rtable) {
		self._rtable = [];
	}
};

/**
 *  Save a resource to a table in memory
 * @param {Resource} resource
 * @param {endLogicCallback} callback
 * @param {*[]=} extraParams
 */
MemoryCache.prototype.logic = function(resource, callback, /*eslint-disable no-unused-vars*/extraParams/*eslint-enable no-unused-vars*/) {
	var self = this;
	self._rtable[resource.uri.toString()] = resource;
	callback();
};

/**
 * Retrieve a resource by a uri lookup in the memory table
 *
 * @param {String} uri
 * @returns {Resource}
 */
MemoryCache.prototype.retrieve = function(uri) {
	var self = this;
	if (!_.isString(uri)) {
		throw new TypeError('uri must be of type string');
	}
	return self._rtable[uri];
};

module.exports = MemoryCache;