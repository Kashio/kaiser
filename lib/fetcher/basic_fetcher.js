/**
 * Created by Roy on 05/02/2016.
 */

'use strict';

// core modules
var util                = require('util');

// npm modules
var request             = require('request'),
	iconv               = require('iconv-lite'),
	_                   = require('underscore');

// lib modules
var helpers             = require('../helpers'),
	Fetcher             = require('./fetcher'),
	PolicyChecker       = require('../policy_checker'),
	endOfLine           = require('os').EOL;

var isInteger           = helpers.isInteger;

const recoverableErrors = [
	'ESOCKETTIMEDOUT',
	'ETIMEDOUT',
	'ECONNRESET',
	'ECONNREFUSED'
];

/**
 * Basic Fetcher
 *
 * @param {Crawler} crawler
 * @param {Object} options
 * @param {Object} requestSettings
 * @constructor
 */
function BasicFetcher(crawler, options, requestSettings) {
	var self = this;
	BasicFetcher.init.call(self, crawler, options, requestSettings);
}

util.inherits(BasicFetcher, Fetcher);

/**
 * Initialize BasicFetcher
 *
 * @param {Crawler} crawler
 * @param {Object} options
 * @param {Object} requestSettings
 */
BasicFetcher.init = function(crawler, options, requestSettings) {
	var self = this;
	Fetcher.init.call(self, crawler);
	request = request.defaults(requestSettings);
	if (!self.policyChecker) {
		self.policyChecker = new PolicyChecker(self.crawler);
	}
	if (!self.maxAttempts) {
		self.maxAttempts = isInteger(options.maxAttempts) ?
			options.maxAttempts :
			10;
	}
	if (!self.retryDelay) {
		self.retryDelay = isInteger(options.retryDelay) ?
			options.retryDelay :
			5000;
	}
	if (!self.maxConcurrentRequests) {
		self.maxConcurrentRequests = isInteger(options.maxConcurrentRequests) ?
			options.maxConcurrentRequests :
			100;
	}
	if (!self.fetchedUris) {
		self.fetchedUris = []
	}
	if (!self.pendingRequests) {
		self.pendingRequests = [];
	}
	if (!self.activeRequests) {
		self.activeRequests = 0;
	}
	if (!self.totalBytesFetched) {
		self.totalBytesFetched = 0;
	}
};

/**
 * Fetch a resource using http request
 *
 * @param {Resource} resource
 * @param {endLogicCallback} callback
 */
BasicFetcher.prototype.logic = function(resource, callback) {
	var self = this;
	if (self.crawler.isStopping) {
		callback(new Error('Fetch failed because crawler is stopping'));
	}
	else if (!self.policyChecker.isRobotsTxtAllowsResource(resource.uri.resource())) {
		callback(new Error('Fetch failed because of robots txt disallowance'));
	}
	else if (self.policyChecker.isLinkNumberPassed(self.fetchedUris) ||
		self.policyChecker.isSiteSizeLimitPassed(self.totalBytesFetched) ||
		self.policyChecker.isMaxTimeOverallPassed()) {
		self.crawler.isStopping = true;
		callback(new Error('Fetch failed because a crawler limit was passed'));
	} else {
		if (!_.contains(self.fetchedUris, resource.uri.toString())) {
			self.fetchedUris.push(resource.uri.toString());
			self.pendingRequests.push({
				"arguments": [{
					uri: resource.uri.toString()
				}, self.maxAttempts, resource, callback],
				"function": self.requestLoop
			});
			self.runRequest();
		} else {
			callback(new Error('Fetch failed because resource was already fetched'));
		}
	}
};

/**
 * Run next request when possible
 */
BasicFetcher.prototype.runRequest = function() {
	var self = this;
	process.nextTick(function() {
		var next;
		if (!self.pendingRequests.length || self.activeRequests >= self.maxConcurrentRequests) {
			return;
		}
		self.activeRequests++;
		next = self.pendingRequests.shift();
		next["function"].apply(self, next["arguments"]);
		self.runRequest();
	});
};

/**
 * Fetch a resource and managing request errors
 *
 * @param {Object} options
 * @param {Resource} resource
 * @param {number} attemptsLeft
 * @param {Function} callback
 * @param {Error=} lastError
 */
BasicFetcher.prototype.requestLoop = function(options, attemptsLeft, resource, callback, lastError) {
	var self = this;
	if (attemptsLeft <= 0) {
		self.handleResponse((lastError != null ? lastError : new Error('No attempts to fetch the URL were made')), null, null, resource, callback);
	} else {
		request.get(options, function handleResponseErrors(error, response, body) {
			var e;
			if ((error && _.contains(recoverableErrors, error.code)) || (response && (500 <= response.statusCode && response.statusCode < 600))) {
				e = error ? new Error(util.format('%s error on %s', error.code, options.uri)) : new Error(util.format('HTTP %s error fetching %s', response.statusCode, options.uri));
				e.code = error ? error.code : response.statusCode;
				setTimeout((function () {
					self.requestLoop(options, --attemptsLeft, resource, callback, e);
				}), self.retryDelay);
			} else if (!error && (200 <= response.statusCode && response.statusCode < 300)) {
				self.handleResponse(null, response, body, resource, callback);
			} else if (error) {
				e = new Error(util.format("Error fetching '%s': %s (%s)", options.uri, error.message, error.code));
				e.code = error.code;
				self.handleResponse(e, null, null, resource, callback);
			} else {
				e = new Error(util.format('HTTP %s error fetching %s', response.statusCode, options.uri));
				e.code = response.statusCode;
				self.handleResponse(e, null, null, resource, callback);
			}
		});
	}
};

/**
 * Handle resource request
 * @param {Error} error
 * @param response
 * @param body
 * @param {Resource} resource
 * @param {endLogicCallback} callback
 */
BasicFetcher.prototype.handleResponse = function(error, response, body, resource, callback) {
	var self = this;
	if (!error) {
		if (self.policyChecker.isMimeTypeAllowed((response.headers['content-type'] || '').split(';')[0]) &&
			self.policyChecker.isFileSizeAllowed(body)) {
			self.totalBytesFetched += body.length;
			resource.content = self.decodeBuffer(body, response.headers["content-type"] || '', resource);
			callback(null, resource);
		} else {
			self.fetchedUris.splice(self.fetchedUris.indexOf(resource.uri.toString()), 1);
			callback(new Error('Fetch failed because a mime-type is not allowed or file size is bigger than permited'));
		}
	} else {
		self.fetchedUris.splice(self.fetchedUris.indexOf(resource.uri.toString()), 1);
		callback(error);
	}
	self.activeRequests--;
	self.runRequest();
};

/**
 * Decode fetched resource content
 *
 * @param {Buffer} buffer
 * @param {String} contentTypeHeader
 * @param {Resource} resource
 * @returns {String}
 */
BasicFetcher.prototype.decodeBuffer = function(buffer, contentTypeHeader, resource) {
	var self = this;
	var result = self.getEncoding(buffer, contentTypeHeader);
	resource.encoding = result.encoding;
	var decodedBuffer = iconv.decode(buffer, resource.encoding);
	if (result.addCharsetMetaTag && /<\/head>/.test(decodedBuffer)) {
		var indexOfHeadTag = decodedBuffer.indexOf('</head>');
		return [decodedBuffer.slice(0, indexOfHeadTag), util.format('\t<meta charset="%s">%s', resource.encoding, endOfLine), buffer.slice(indexOfHeadTag)].join('');
	}
	return decodedBuffer;
};

/**
 * Get the encoding out of fetched resource content
 * @param buffer
 * @param contentTypeHeader
 * @returns {{}}
 */
BasicFetcher.prototype.getEncoding = function(buffer, contentTypeHeader) {
	var result = {};
	result.encoding = /<meta.*charset=["']?([^"'>]*)["']?\s*\/?>/i.exec(buffer.toString()) || [];
	if (result.encoding.length === 0) {
		result.addCharsetMetaTag = true;
	}
	result.encoding = contentTypeHeader.split("charset=")[1] || result.encoding[1] || contentTypeHeader;
	result.encoding = iconv.encodingExists(result.encoding) ? result.encoding : 'binary';
	return result;
};

module.exports = BasicFetcher;