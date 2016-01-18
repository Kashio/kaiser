/**
 * Created by Roy on 31/12/2015.
 */

'use strict';

// core modules
var util               = require('util'),
    EventEmitter       = require('events'),
    http               = require('http'),
    https              = require('https');

// npm modules
var request            = require('request'),
    iconv              = require('iconv-lite'),
    async              = require('async'),
    _                  = require('underscore'),
    URI                = require('urijs'),
    escapeStringRegexp = require('escape-string-regexp');;

// lib modules
var helpers            = require('./helpers'),
    Resource           = require('./resource'),
    metadata           = require('../package.json'),
    Cache              = require('./cache');

var normalizeUri       = helpers.normalizeUri,
    isInteger          = helpers.isInteger,
    isEmpty            = helpers.isEmpty,
    replaceAll         = helpers.replaceAll;

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
        self.uri = new URI(normalizeUri(options.uri));
    }

    request = request.defaults({
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
                5
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

    if (!self.rewriteLinks) {
        self.rewriteLinks = options.rewriteLinks ?
            options.rewriteLinks :
            true;
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
            'bmp'
        ];
    }

    if (!self.allowedMimeTypes) {
        self.allowedMimeTypes = [
            /^text\/.+$/i,
            /^application\/javascript$/i,
            /^application\/(rss|xhtml)(\+xml)?/i,
            /\/xml$/i,
            /^image\/.+$/i
        ];
    }

    if (!self.disallowedHostnames) {
        self.disallowedHostnames = [];
    }

    if (!self.cache) {
        self.cache = options.cache ?
            options.cache :
            new Cache.FsCache({
                rootDir: './cache'
            });
    }
};

Crawler.prototype.start = function() {
    var self = this;
    self.emit('crawlstart');
    self.crawl([self.uri], null);
    self.emit('crawlcomplete');
};

Crawler.prototype.crawl = function(uris, originator) {
    var self = this;
    self.emit('crawlbulkstart', uris);
    if (!Array.isArray(uris)) {
        uris = [uris];
    }
    async.waterfall([
        async.apply(self.composeResources.bind(self), uris, originator),
        self.fetchResources.bind(self)
    ], function (err, result) {
        self.emit('crawlbulkcomplete', result);
    });
};

Crawler.prototype.composeResources = function(uris, originator, callback) {
    var self = this;
    self.emit('composestart', uris, originator);
    var composedUris = _.map(uris, function(uri) {
        return Resource.instance(uri, originator);
    });
    self.emit('composecomplete', composedUris);
    callback(null, composedUris);
};

Crawler.prototype.fetchResources = function(resources, callback) {
    var self = this;
    var crawledResources = [];
    async.each(resources, function(resource, callback) {
        self.emit('fetchstart', resource);
        if (self.isPolicyPass(resource)) {
            request({
                uri: resource.uri.toString()
            }, function (error, response, body) {
                if (!error && response.statusCode === 200) {
                    if (self.isMimeTypeAllowed(response.headers['content-type'].split(';')[0])) {
                        resource.content = self.decodeBuffer(body, response.headers["content-type"] || '');
                        self.emit('fetchcomplete', resource);
                        async.parallel([
                            async.apply(self.discoverResources.bind(self), resource),
                            function() {
                                async.waterfall([
                                    async.apply(self.transformResource.bind(self), resource),
                                    self.storeResource.bind(self)
                                ], function (err, result) {
                                    crawledResources.push(result);
                                    callback(null);
                                });
                            }
                        ]);
                    } else {
                        self.emit('policynotmeet', resource);
                    }
                } else {
                    self.emit('fetcherror', resource, error);
                }
            });
        } else {
            self.emit('policynotmeet', resource);
        }
    }, function(err) {
        callback(null, crawledResources);
    });
};

Crawler.prototype.isPolicyPass = function(resource) {
    var self = this;
    return self.isProtocolAllowed(resource.uri.protocol()) &&
            self.isFileTypeAllowed(resource.uri.suffix()) &&
            self.isHostnameAllowed(resource.uri.hostname) &&
            self.isDepthAllowed(resource);
};

Crawler.prototype.isAllowed = function(array, value) {
    var self = this;
    return _.contains(array, value);
};

Crawler.prototype.isProtocolAllowed = function(protocol) {
    var self = this;
    return self.isAllowed(self.allowedProtocols, protocol);
};

Crawler.prototype.isFileTypeAllowed = function(fileType) {
    var self = this;
    return isEmpty(fileType) || self.isAllowed(self.allowedFileTypes, fileType);
};

Crawler.prototype.isMimeTypeAllowed = function(mimeType) {
    var self = this;
    return _.some(self.allowedMimeTypes, function(regex) {
        return regex.test(mimeType);
    }, self);
};

Crawler.prototype.isHostnameAllowed = function(hostname) {
    var self = this;
    return !self.isAllowed(self.disallowedHostnames, hostname);
};

Crawler.prototype.isDepthAllowed = function(resource) {
    var self = this;
    return resource.depth <= (resource.uri.domain() === self.uri.domain() ?
        self.maxDepth :
        self.maxExternalDepth);
};

Crawler.prototype.decodeBuffer = function(buffer, contentTypeHeader) {
    var encoding = /<meta.*charset=["']?([^"'>]*)["']?\s*\/?>/i.exec(buffer.toString()) || [];
    encoding = contentTypeHeader.split("charset=")[1] || encoding[1] || contentTypeHeader;
    encoding = iconv.encodingExists(encoding) ? encoding : 'utf-8';
    return iconv.decode(buffer, encoding);
};

Crawler.prototype.discoverResources = function(resource) {
    var self = this;
    self.emit('discoverstart', resource);
    async.waterfall([
        async.apply(self.getUris.bind(self), resource),
        self.formatUris.bind(self),
        self.reduceUris.bind(self)
    ], function (err, result) {
        self.emit('discovercomplete', resource);
        self.crawl.bind(self, result, resource);
    });
};

Crawler.prototype.getUris = function(resource, callback) {
    var self = this;
    var discoverRegex = [
        /\s(?:href|src)\s*=\s*["'](.*?)["']/ig,
        /\s(?:href|src)\s*=\s*([^"'\s][^\s>]+)/ig,
        /\s?url\(["'](.*?)["']\)/ig,
        /\s?url\(([^"'].*?)\)/ig,
        /(http(s)?:\/\/[^?\s><'"]+)/ig,
        /^javascript:[a-z0-9\$_\.]+\(['"][^'"\s]+/ig
    ];
    var uris = [];
    _.each(discoverRegex, function(regex) {
        var matches = resource.content.match(regex);
        _.each(matches, function(match) {
            var result = regex.exec(match);
            regex.lastIndex = 0;
            uris.push(result[1]);
        });
    });
    callback(null, uris, resource);
};

Crawler.prototype.formatUris = function(uris, resource, callback) {
    var self = this;
    callback(null, _.map(uris, function(uri) {
        return normalizeUri(URI.parse(new URI(uri).absoluteTo(resource.uri).toString()));
    }));
};

Crawler.prototype.reduceUris = function(uris, callback) {
    var self = this;
    callback(null, _.uniq(uris));
};

Crawler.prototype.transformResource = function(resource, callback) {
    var self = this;
    if (self.canTransform(resource)) {
        self.emit('transformstart', resource);
        async.waterfall([
            async.apply(self.getUris.bind(self), resource),
            self.formatUris.bind(self),
            self.reduceUris.bind(self)
        ], function (err, result) {
            self.transformStrategy(result, resource);
            self.emit('transformcomplete', resource);
            callback(null, resource);
        });
    }
};

Crawler.prototype.transformStrategy = function(uris, resource) {
    var self = this;
    _.each(uris, function(uri) {
        var uriObj = new URI(uri);
        var relatedness = (resource.uri.hostname() === uriObj.hostname() ?
            '.' :
            '..');
        var replacement = new RegExp(escapeStringRegexp(util.format('%s\/%s%s',
            relatedness, uriObj.host(), uriObj.resource())), 'ig');
        resource.content = replaceAll(resource.content, uri, replacement);
    });
};

Crawler.prototype.canTransform = function(resource) {
    var self = this;
    return self.rewriteLinks && resource.depth < (resource.uri.domain() === self.uri.domain() ?
        self.maxDepth :
        self.maxExternalDepth);
};

Crawler.prototype.storeResource = function(resource, callback) {
    var self = this;
    self.emit('storestart', resource);
    self.cache.store(resource);
    self.emit('storecomplete', resource);
    callback(null, resource);
};

module.exports = Crawler;