/**
 * Created by Roy on 31/12/2015.
 */

'use strict';

// core modules
var util                     = require('util'),
	EventEmitter             = require('events'),
	path                     = require('path');

// npm modules
var async                    = require('async'),
	URI                      = require('urijs'),
	robots                   = require('robots'),
	callsite                 = require('callsite'),
	_                        = require('underscore');

// lib modules
var helpers                  = require('./helpers'),
	metadata                 = require('../package.json'),
	Composer                 = require('./composer/composer'),
	BasicComposer            = require('./composer/basic_composer'),
	Fetcher                  = require('./fetcher/fetcher'),
	BasicFetcher             = require('./fetcher/basic_fetcher'),
	Discoverer               = require('./discoverer/discoverer'),
	BasicDiscoverer          = require('./discoverer/basic_discoverer'),
	Transformer              = require('./transformer/transformer'),
	BasicTransformer         = require('./transformer/basic_transformer'),
	Cache                    = require('./cache/cache'),
	FsCache                  = require('./cache/fs_cache');

/**
 * Crawler Class
 *
 * @param {Object} options
 * @constructor
 */
function Crawler(options) {
	var self = this;
	EventEmitter.call(self);
	Crawler.init.call(self, options);
}

util.inherits(Crawler, EventEmitter);

/**
 * Initialize Crawler
 *
 * @param {Object} options
 **/
Crawler.init = function(options) {
	var self = this;
	if (!options) {
		throw new Error('options must be given to construct a crawler');
	}
	if (!options.uri) {
		throw new Error('options must provide uri');
	}
	if (!self.uri) {
		self.uri = helpers.normalizeUri(URI.parse(options.uri));
	}
	if (helpers.isNullOrUndefined(self.isStopping)) {
		self.isStopping = false;
	}
	if (!self.activeCrawls) {
		self.activeCrawls = [];
	}
	if (helpers.isNullOrUndefined(self.followRobotsTxt)) {
		self.followRobotsTxt = !helpers.isNullOrUndefined(options.followRobotsTxt) ?
			options.followRobotsTxt :
			false;
	}
	if (helpers.isNullOrUndefined(self.maxDepth)) {
		self.maxDepth = helpers.isInteger(options.maxDepth) ?
			options.maxDepth :
			1;
	}
	if (helpers.isNullOrUndefined(self.maxExternalDepth)) {
		self.maxExternalDepth = helpers.isInteger(options.maxExternalDepth) ?
			options.maxExternalDepth :
			0;
	}
	if (helpers.isNullOrUndefined(self.maxFileSize)) {
		self.maxFileSize = !isNaN(options.maxFileSize) ?
			options.maxFileSize :
			1024 * 1024 * 16;
	}
	if (helpers.isNullOrUndefined(self.maxLinkNumber)) {
		self.maxLinkNumber = helpers.isInteger(options.maxLinkNumber) ?
			options.maxLinkNumber :
			Number.POSITIVE_INFINITY;
	}
	if (helpers.isNullOrUndefined(self.siteSizeLimit)) {
		self.siteSizeLimit = !isNaN(options.siteSizeLimit) ?
			options.siteSizeLimit :
			self.maxFileSize * self.maxLinkNumber;
	}
	if (helpers.isNullOrUndefined(self.maxTimeOverall)) {
		self.maxTimeOverall = helpers.isInteger(options.maxTimeOverall) ?
			options.maxTimeOverall :
			Number.POSITIVE_INFINITY;
	}
	if (!self.allowedProtocols) {
		self.allowedProtocols = [
			'http',
			'https'
		];
	}
	if (!self.allowedFileTypes) {
		self.allowedFileTypes = [
			'html',
			'htm',
			'css',
			'js',
			'xml',
			'gif',
			'jpg',
			'jpeg',
			'png',
			'tif',
			'bmp',
			'eot',
			'svg',
			'ttf',
			'woff',
			'txt',
			'htc',
			'php',
			'asp',
			''
		];
	}
	if (!self.allowedMimeTypes) {
		self.allowedMimeTypes = [
			/^text\/.+$/i,
			/^application\/(?:x-)?javascript$/i,
			/^application\/(?:rss|xhtml)(?:\+xml)?/i,
			/\/xml$/i,
			/^image\/.+$/i,
			/application\/octet-stream/i
		];
	}
	if (!self.disallowedHostnames) {
		self.disallowedHostnames = [];
	}
	if (!self.allowedLinks) {
		self.allowedLinks = [
			/.*/i
		];
	}
	if (!self.composer) {
		if (options.composer && options.composer instanceof Composer) {
			Composer.init.call(options.composer, self);
			self.composer = options.composer;
		} else {
			self.composer = new BasicComposer(self);
		}
	}
	if (!self.fetcher) {
		if (options.fetcher && options.fetcher instanceof Fetcher) {
			Fetcher.init.call(options.fetcher, self);
			self.fetcher = options.fetcher;
		} else {
			self.fetcher = new BasicFetcher(self, {
				maxAttempts: helpers.isInteger(options.maxAttempts) ?
					options.maxAttempts :
					10,
				retryDelay: helpers.isInteger(options.retryDelay) ?
					options.retryDelay :
					5000,
				maxConcurrentRequests: helpers.isInteger(options.maxConcurrentRequests) ?
					options.maxConcurrentRequests :
					100
			}, {
				proxy: options.proxy ?
					helpers.normalizeUri(options.proxy) :
					undefined
				,
				auth: options.auth,
				encoding: null,
				gzip: true,
				jar: !helpers.isNullOrUndefined(options.acceptCookies) ?
					options.acceptCookies :
					true
				,
				headers: {
					'user-agent': options.userAgent ?
						options.userAgent :
						util.format('Node/%s %s (%s)', metadata.name, metadata.version, metadata.repository.url)
				},
				pool: {
					maxSockets: helpers.isInteger(options.maxSockets) ?
						options.maxSockets :
						10
				},
				timeout: helpers.isInteger(options.timeout) ?
					options.timeout :
					5000
				,
				strictSSL: !helpers.isNullOrUndefined(options.strictSSL) ?
					options.strictSSL :
					true
			});
		}
	}
	if (!self.discoverer) {
		if (options.discoverer && options.discoverer instanceof Discoverer) {
			Discoverer.init.call(options.discoverer, self);
			self.discoverer = options.discoverer;
		} else {
			self.discoverer = new BasicDiscoverer(self);
		}
	}
	if (!self.transformer) {
		if (options.transformer && options.transformer instanceof Transformer) {
			Transformer.init.call(options.transformer, self);
			self.transformer = options.transformer;
		} else {
			self.transformer = new BasicTransformer(self, {
				rewriteLinksFileTypes: options.rewriteLinksFileTypes ?
					options.rewriteLinksFileTypes : [
					'html',
					'htm',
					'css',
					'js',
					'php',
					'asp',
					'txt',
					''
				]
			});
		}
	}
	if (!self.cache) {
		if (options.cache && options.cache instanceof Cache) {
			Cache.init.call(options.cache, self);
			self.cache = options.cache;
		} else {
			self.cache = new FsCache(self, {
				rootDir: path.join(path.dirname(callsite()[2].getFileName()), 'websites', self.uri.host().replace(/:(\d+)/ig, '($1)'))
			});
		}
	}
};

/**
 * Start crawling
 *
 * @returns {Crawler}
 */
Crawler.prototype.start = function() {
	var self = this;
	setImmediate(function() {
		self.emit('crawlstart');
		async.waterfall([
			self.init.bind(self)
		], function(/*eslint-disable no-unused-vars*/err, result/*eslint-enable no-unused-vars*/) {
			self.crawl([self.uri.toString()], null);
		});
	});
	return self;
};

/**
 * Initialize crawling process
 *
 * @param {Function} callback
 */
Crawler.prototype.init = function(callback) {
	var self = this;
	self.crawlStartTime = Date.now();
	if (self.followRobotsTxt && !self.robotsParser) {
		self.robotsParser = new robots.RobotsParser();
		self.robotsParser.setUrl(path.join(self.uri.hostname(), 'robots.txt'), function(/*eslint-disable no-unused-vars*/parser/*eslint-enable no-unused-vars*/, success) {
			if (!success) {
				self.robotsParser = null;
			}
			callback();
		});
	} else {
		callback();
	}
};

/**
 * Crawler pipeline compose, fetch, discover, transform, cache
 *
 * @param {String[]} uris
 * @param {?Resource} originator
 */
Crawler.prototype.crawl = function(uris, originator) {
	var self = this;
	_.each(uris, function(uri) {
		self.activeCrawls.push(uri);
	});
	self.emit('crawlbulkstart', uris, originator);
	async.waterfall([
		async.apply(self.composer.work.bind(self.composer), originator, uris),
		function(resources, callback) {
			async.each(resources, function(resource, callback) {
				async.waterfall([
					async.apply(self.fetcher.work.bind(self.fetcher), resource),
					self.discoverer.work.bind(self.discoverer),
					self.transformer.work.bind(self.transformer),
					self.cache.work.bind(self.cache)
				], function(err, /*eslint-disable no-unused-vars*/result/*eslint-enable no-unused-vars*/) {
					if (err) {
						resources = _.without(resources, resource);
					}
					callback();
				});
			}, function(err) {
				callback(err, resources);
			});
		}
	], function (/*eslint-disable no-unused-vars*/err/*eslint-enable no-unused-vars*/, result) {
		_.each(uris, function(uri) {
			self.activeCrawls.splice(self.activeCrawls.indexOf(uri), 1);
		});
		self.emit('crawlbulkcomplete', result, originator);
		if (!_.some(self.activeCrawls)) {
			self.stop();
		}
	});
};

/**
 * Stop crawling
 *
 * @returns {Crawler}
 */
Crawler.prototype.stop = function() {
	var self = this;
	self.cleanup();
	self.emit('crawlcomplete');
	return self;
};

/**
 * Clean crawling process
 */
Crawler.prototype.cleanup = function() {
	var self = this;
	self.isStopping = false;
	self.activeCrawls = [];
	self.fetcher.pendingRequests = [];
	self.fetcher.activeRequests = 0;
};

module.exports = Crawler;