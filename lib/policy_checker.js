/**
 * Created by Roy on 05/02/2016.
 */

'use strict';

// core modules
var util              = require('util');

// npm modules
var _                 = require('underscore');

// lib modules
var CrawlerReferencer = require('./crawler_referencer'),
	Resource      = require('./resource');

/**
 * PolicyChecker Class
 *
 * @param {Crawler} crawler
 * @constructor
 */
function PolicyChecker(crawler) {
	var self = this;
	PolicyChecker.init.call(self, crawler);
}

util.inherits(PolicyChecker, CrawlerReferencer);

/**
 * Initialize PolicyChecker
 *
 * @param {Crawler} crawler
 */
PolicyChecker.init = function(crawler) {
	var self = this;
	CrawlerReferencer.init.call(self, crawler);
};

/**
 * Private generic is allowd method used internally
 *
 * @param {*[]} array
 * @param {*} value
 */
PolicyChecker.prototype.isAllowed = function(array, value) {
	return _.contains(array, value);
};

/**
 * Check if a protocol is allowed by a crawler
 *
 * @param {String} protocol
 * @returns {Boolean}
 */
PolicyChecker.prototype.isProtocolAllowed = function(protocol) {
	var self = this;
	return self.isAllowed(self.crawler.allowedProtocols, protocol);
};

/**
 * Check if file type is allowed to be crawled by a crawler
 *
 * @param {String} fileType
 * @returns {Boolean}
 */
PolicyChecker.prototype.isFileTypeAllowed = function(fileType) {
	var self = this;
	return self.isAllowed(self.crawler.allowedFileTypes, fileType);
};

/**
 * Check if a resource is allowed to be fetched by checking its mime-type
 *
 * @param {String} mimeType
 * @returns {Boolean}
 */
PolicyChecker.prototype.isMimeTypeAllowed = function(mimeType) {
	var self = this;
	return _.some(self.crawler.allowedMimeTypes, function(regex) {
		return regex.test(mimeType);
	}, self);
};

/**
 * Check if a link from a hostname is allowed to be crawled
 *
 * @param {String} hostname
 * @returns {Boolean}
 */
PolicyChecker.prototype.isHostnameAllowed = function(hostname) {
	var self = this;
	return !self.isAllowed(self.crawler.disallowedHostnames, hostname);
};

/**
 * Check if a link is allowed to be crawled by a crawler
 *
 * @param {String} uri
 * @returns {Boolean}
 */
PolicyChecker.prototype.isLinkAllowed = function(uri) {
	var self = this;
	return _.some(self.crawler.allowedLinks, function(allowedLink) {
		return allowedLink.test(uri);
	});
};

/**
 * Check if a resource is allowed to be crawled by checking its depth
 *
 * @param {Resource} resource
 * @returns {Boolean}
 */
PolicyChecker.prototype.isDepthAllowed = function(resource) {
	var self = this;
	if (!(resource instanceof Resource)) {
		throw new TypeError('resource must be of type Resource');
	}
	return resource.depth <= (resource.uri.domain() === self.crawler.uri.domain() ?
			self.crawler.maxDepth :
			self.crawler.maxExternalDepth);
};

/**
 * Check if a resource is allowed to be crawled by checking its link againts the robots.txt configuration of a crawler
 *
 * @param {Resource} resource
 * @returns {Boolean}
 */
PolicyChecker.prototype.isRobotsTxtAllowsResource = function(resource) {
	var self = this;
	if (self.crawler.robotsParser) {
		return self.crawler.robotsParser.canFetchSync(self.crawler.userAgent, resource);
	}
	return true;
};

/**
 * Check if a resource should be further processed by checking its content size
 *
 * @param {String} body
 * @returns {Boolean}
 */
PolicyChecker.prototype.isFileSizeAllowed = function(body) {
	var self = this;
	return body.length <= self.crawler.maxFileSize;
};

/**
 * Check if the total site size limit set by a crawler is passed
 *
 * @param {number} totalBytesFetched
 * @returns {Boolean}
 */
PolicyChecker.prototype.isSiteSizeLimitPassed = function(totalBytesFetched) {
	var self = this;
	return totalBytesFetched >= self.crawler.siteSizeLimit;
};

/**
 * Check if the total link number limit set by a crawler is passed
 *
 * @param fetchedUris
 * @returns {boolean}
 */
PolicyChecker.prototype.isLinkNumberPassed = function(fetchedUris) {
	var self = this;
	return fetchedUris.length >= self.crawler.maxLinkNumber;
};

/**
 * check if the total time limit set by a crawler is passed
 *
 * @returns {boolean}
 */
PolicyChecker.prototype.isMaxTimeOverallPassed = function() {
	var self = this;
	return ((Date.now() - self.crawler.crawlStartTime) / 1000) >= self.crawler.maxTimeOverall;
};

module.exports = PolicyChecker;