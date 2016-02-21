/**
 * Created by Roy on 31/12/2015.
 */

'use strict';

// core modules
var util               = require('util'),
    EventEmitter       = require('events'),
    http               = require('http'),
    https              = require('https'),
    path               = require('path');

// npm modules
var async              = require('async'),
    _                  = require('underscore');

// lib modules
var helpers            = require('./helpers'),
    metadata           = require('../package.json'),
    Composer           = require('./composer/composer'),
    BasicComposer      = require('./composer/basic_composer'),
    Fetcher            = require('./fetcher/fetcher'),
    BasicFetcher       = require('./fetcher/basic_fetcher'),
    Discoverer         = require('./discoverer/discoverer'),
    BasicDiscoverer    = require('./discoverer/basic_discoverer'),
    Transformer        = require('./transformer/transformer'),
    BasicTransformer   = require('./transformer/basic_transformer'),
    Cache              = require('./cache/cache'),
    FsCache            = require('./cache/fs_cache');

var normalizeUri       = helpers.normalizeUri,
    isInteger          = helpers.isInteger;

function Crawler(options) {
    var self = this;
    EventEmitter.call(self);
    Crawler.init.call(self, options);
}

util.inherits(Crawler, EventEmitter);

Crawler.init = function(options) {
    var self = this;
    if (!options) {
        throw new Error('options must be given to construct a crawler');
    }
    if (!options.uri) {
        throw new Error('options must provide uri');
    }
    if (!self.uri) {
        self.uri = normalizeUri(options.uri);
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
    if (!self.maxHtmlFileSize) {
        self.maxHtmlFileSize = !isNaN(options.maxHtmlFileSize) ?
            options.maxHtmlFileSize :
            1024 * 1024 * 16;
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
            Math.max(self.maxHtmlFileSize, self.maxFileSize) * self.maxLinkNumber;
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
                headers: {
                    'user-agent': options.userAgent ?
                        options.userAgent :
                        util.format('Node/%s %s (%s)',
                            metadata.name, metadata.version, metadata.repository.url)
                },
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
                ,
                time: true
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
            new BasicTransformer(self);
    }
    if (!self.cache) {
        self.cache = options.cache && options.cache instanceof Cache ?
            options.cache :
            new FsCache(self, {
                rootDir: path.join(__dirname, util.format('cached-website (%s)', self.uri.host()))
            });
    }
};
var t1;
var t2;
Crawler.prototype.start = function() {
    var self = this;
    self.emit('crawlstart');
    self.crawl([self.uri.toString()], null);
};

Crawler.prototype.crawl = function(uris, originator) {
    var self = this;
    t1 = Date.now();
    self.emit('crawlbulkstart', uris, originator);
    async.waterfall([
        async.apply(self.composer.compose.bind(self.composer), uris, originator),
        self.fetcher.fetch.bind(self.fetcher),
        function(resources, callback) {
            async.each(resources, function(resource, callback) {
                async.waterfall([
                    async.apply(self.discoverer.discover.bind(self.discoverer), resource),
                    self.transformer.transform.bind(self.transformer),
                    self.cache.save.bind(self.cache)
                ], callback);
            }, function(err) {
                callback(err, resources);
            });
        }
    ], function (err, result) {
        t2 = Date.now();
        //console.log('crawl took: ', (t2 - t1) / 1000);
        self.emit('crawlbulkcomplete', result, originator);
    });
};

module.exports = Crawler;