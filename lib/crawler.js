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

var normalizeUri             = helpers.normalizeUri,
	isInteger                = helpers.isInteger;

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
		self.uri = normalizeUri(URI.parse(options.uri));
	}
	if (!self.isStopping) {
		self.isStopping = false;
	}
	if (!self.crawlStartTime) {
		self.crawlStartTime = null;
	}
	if (!self.activeCrawls) {
		self.activeCrawls = [];
	}
	if (!self.userAgent) {
		self.userAgent = options.userAgent ?
			options.userAgent :
			util.format('Node/%s %s (%s)',
				metadata.name, metadata.version, metadata.repository.url)
	}
	if (!self.followRobotsTxt) {
		self.followRobotsTxt = options.followRobotsTxt ?
			options.followRobotsTxt :
			false;
	}
	if (!self.maxDepth) {
		self.maxDepth = isInteger(options.maxDepth) ?
			options.maxDepth :
			1;
	}
	if (!self.maxExternalDepth) {
		self.maxExternalDepth = isInteger(options.maxExternalDepth) ?
			options.maxExternalDepth :
			0;
	}
	if (!self.maxFileSize) {
		self.maxFileSize = !isNaN(options.maxFileSize) ?
			options.maxFileSize :
			1024 * 1024 * 16;
	}
	if (!self.maxLinkNumber) {
		self.maxLinkNumber = isInteger(options.maxLinkNumber) ?
			options.maxLinkNumber :
			Number.POSITIVE_INFINITY;
	}
	if (!self.siteSizeLimit) {
		self.siteSizeLimit = !isNaN(options.siteSizeLimit) ?
			options.siteSizeLimit :
			self.maxFileSize * self.maxLinkNumber;
	}
	if (!self.maxTimeOverall) {
		self.maxTimeOverall = isInteger(options.maxTimeOverall) ?
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
			'asp'
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
		self.composer = options.composer && options.composer instanceof Composer ?
			options.composer :
			new BasicComposer(self);
	}
	if (!self.fetcher) {
		self.fetcher = options.fetcher && options.fetcher instanceof Fetcher ?
			options.fetcher :
			new BasicFetcher(self, {
				maxAttempts: isInteger(options.maxAttempts) ?
					options.maxAttempts :
					10,
				retryDelay: isInteger(options.retryDelay) ?
					options.retryDelay :
					5000,
				maxConcurrentRequests: isInteger(options.maxConcurrentRequests) ?
					options.maxConcurrentRequests :
					100
			}, {
				proxy: options.proxy ?
					normalizeUri(options.proxy) :
					undefined
				,
				auth: options.auth,
				encoding: null,
				gzip: true,
				jar: options.acceptCookies ?
					options.acceptCookies :
					true
				,
				// headers: {
				// 	'user-agent': self.userAgent
				// },
				pool: {
					maxSockets: isInteger(options.maxSockets) ?
						options.maxSockets :
						10
				},
				timeout: isInteger(options.timeout) ?
					options.timeout :
					5000
				,
				strictSSL: options.strictSSL ?
					options.strictSSL :
					true
			});
	}
	if (!self.discoverer) {
		self.discoverer = options.discoverer && options.discoverer instanceof Discoverer ?
			options.discoverer :
			new BasicDiscoverer(self);
	}
	if (!self.transformer) {
		self.transformer = options.transformer && options.transformer instanceof Transformer ?
			options.transformer :
			new BasicTransformer(self, {
				rewriteLinksFileTypes: options.rewriteLinksFileTypes ?
					options.rewriteLinksFileTypes :
					[
						'html',
						'htm',
						'css',
						'js',
						'php',
						'asp',
						'txt'
					]
			});
	}
	if (!self.cache) {
		self.cache = options.cache && options.cache instanceof Cache ?
			options.cache :
			new FsCache(self, {
				rootDir: path.join(__dirname, 'websites', self.uri.host().replace(/:(\d+)/ig, '($1)'))
			});
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
 * @param callback
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
 * Crawler pipeline compose, fetche, discover, transform, cache
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
		async.apply(self.composer.compose.bind(self.composer), uris, originator),
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