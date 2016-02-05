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
var request            = require('request'),
    iconv              = require('iconv-lite'),
    async              = require('async'),
    _                  = require('underscore'),
    URI                = require('urijs');

// lib modules
var helpers            = require('./helpers'),
    Resource           = require('./resource'),
    metadata           = require('../package.json'),
    Composer           = require('./composer/composer'),
    BasicComposer      = require('./composer/basiccomposer'),
    Cache              = require('./cache/cache'),
    FsCache            = require('./cache/fscache');

var normalizeUri       = helpers.normalizeUri,
    isInteger          = helpers.isInteger,
    isEmpty            = helpers.isEmpty,
    replaceAll         = helpers.replaceAll,
    isNullOrUndefined  = helpers.isNullOrUndefined;

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
            'bmp',
            'eot',
            'svg',
            'ttf',
            'woff',
            'txt',
            'htc'
        ];
    }

    if (!self.allowedMimeTypes) {
        self.allowedMimeTypes = [
            /^text\/.+$/i,
            /^application\/(?:x-)?javascript$/i,
            /^application\/(rss|xhtml)(\+xml)?/i,
            /\/xml$/i,
            /^image\/.+$/i
        ];
    }

    if (!self.disallowedHostnames) {
        self.disallowedHostnames = [];
    }

    if (!self.composer) {
        self.composer = options.composer && options.composer instanceof Composer ?
            options.composer :
            new BasicComposer();
    }

    if (!self.cache) {
        self.cache = options.cache && options.cache instanceof Cache ?
            options.cache :
            new FsCache({
                rootDir: path.join(__dirname, 'cache-site')
            });
    }
};
var t1;
var t2;
Crawler.prototype.start = function() {
    var self = this;
    self.emit('crawlstart');
    self.crawl([self.uri], null);
};

Crawler.prototype.crawl = function(uris, originator) {
    var self = this;
    t1 = Date.now();
    self.emit('crawlbulkstart', uris, originator);
    async.waterfall([
        async.apply(self.composeResources.bind(self), uris, originator),
        self.fetchResources.bind(self)
    ], function (err, result) {
        t2 = Date.now();
        console.log('crawl took: ', (t2 - t1) / 1000);
        self.emit('crawlbulkcomplete', result, originator);
    });
};

Crawler.prototype.composeResources = function(uris, originator, callback) {
    var self = this;
    self.emit('composestart', uris, originator);
    self.composer.compose(uris, originator, function(resources) {
        self.emit('composecomplete', resources);
        callback(null, resources);
    });
};

Crawler.prototype.fetchResources = function(resources, callback) {
    var self = this;
    var crawledResources = [];
    async.each(resources, function(resource, callback) {
        self.emit('fetchstart', resource);
        request({
            uri: resource.uri.toString()
        }, function (error, response, body) {
            if (!error && response.statusCode === 200) {
                self.emit('fetchcomplete', resource);
                if (self.isMimeTypeAllowed((response.headers['content-type'] || '').split(';')[0])) {
                    resource.content = self.decodeBuffer(body, response.headers["content-type"] || '', resource);
                    async.waterfall([
                        async.apply(self.transformResource.bind(self), resource),
                        self.storeResource.bind(self),
                        self.discoverResources.bind(self)
                    ], function(err, result) {
                        delete result.originalContent;
                        if (!err) {
                            crawledResources.push(result);
                        }
                        callback();
                    });
                    //async.parallel([
                    //    async.apply(self.discoverResources.bind(self), resource),
                    //    function() {
                    //        async.waterfall([
                    //            async.apply(self.transformResource.bind(self), resource),
                    //            self.storeResource.bind(self)
                    //        ], function (err, result) {
                    //            if (!err) {
                    //                crawledResources.push(result);
                    //            }
                    //            var mapped = _.map(crawledResources, function(c) {
                    //                return c.uri.toString();
                    //            });
                    //            console.log('CALLING FOREACH CALLBACK\n', mapped.length, ' uris:\n', mapped, '\n');
                    //            callback();
                    //        });
                    //    }
                    //]);
                }
            } else {
                self.emit('fetcherror', resource, error);
                callback();
            }
        });
    }, function(err) {
        //console.log('INSIDE FOREACH CALLBACK: ', _.map(crawledResources, function(r) {
        //    return r.uri.toString();
        //}));
        callback(null, crawledResources);
    });
};

Crawler.prototype.policyCheck = function(uri) {
    var self = this;
    return self.isProtocolAllowed(uri.protocol()) &&
        self.isFileTypeAllowed(uri.suffix()) &&
        self.isHostnameAllowed(uri.hostname);
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
    return resource.depth < (resource.uri.domain() === self.uri.domain() ?
        self.maxDepth :
        self.maxExternalDepth);
};

Crawler.prototype.decodeBuffer = function(buffer, contentTypeHeader, resource) {
    var self = this;
    resource.encoding = self.getEncoding(buffer, contentTypeHeader);
    return iconv.decode(buffer, resource.encoding);
};

Crawler.prototype.getEncoding = function(buffer, contentTypeHeader) {
    var self = this;
    var encoding = /<meta.*charset=["']?([^"'>]*)["']?\s*\/?>/i.exec(buffer.toString()) || [];
    encoding = contentTypeHeader.split("charset=")[1] || encoding[1] || contentTypeHeader;
    encoding = iconv.encodingExists(encoding) ? encoding : 'binary';
    return encoding;
};

Crawler.prototype.discoverResources = function(resource, callback) {
    var self = this;
    if (self.isDepthAllowed(resource)) {
        self.emit('discoverstart', resource);
        async.waterfall([
            async.apply(self.getUris.bind(self), resource),
            self.formatUris.bind(self),
            self.reduceUris.bind(self),
            self.reduceUris2.bind(self)
        ], function (err, result) {
            self.emit('discovercomplete', result, resource);
            callback(err, resource);
            if (_.some(result)) {
                self.crawl.call(self, result, resource);
            }
        });
    } else {
        callback(null, resource);
    }
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
        var matches = resource.originalContent.match(regex);
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
    uris = _.map(uris, function(uri) {
        return new URI(URI.decode(uri));
    });
    uris = _.filter(uris, function(uri) {
        return uri._parts.urn !== true;
    });
    uris = _.map(uris, function(uri) {
        return normalizeUri(URI.parse(uri.absoluteTo(resource.uri).toString()));
    });
    callback(null, uris);
};

Crawler.prototype.reduceUris = function(uris, callback) {
    var self = this;
    uris = _.filter(uris, function(uri) {
        return self.policyCheck(uri);
    });
    uris = _.map(uris, function(uri) {
        return uri.toString();
    });
    uris = _.uniq(uris);
    callback(null, uris);
};



Crawler.prototype.reduceUris2 = function(uris, callback) {
    var self = this;
    uris = _.filter(uris, function(uri) {
        return isNullOrUndefined(self.cache.retrieve(uri));
    });
    callback(null, uris);
};

Crawler.prototype.transformResource = function(resource, callback) {
    var self = this;
    resource.originalContent = resource.content;
    if (self.canTransform(resource)) {
        self.emit('transformstart', resource);
        async.waterfall([
            async.apply(self.getUris.bind(self), resource),
            function (uris, resource, callback) {
                var urisObj = _.map(uris, function(uri) {
                    return new URI(uri);
                });
                urisObj = _.filter(urisObj, function(uri) {
                    return uri._parts.urn !== true;
                });
                var map = [];
                _.each(urisObj, function(uri) {
                    map[uri.toString()] = uri;
                });
                uris = [];
                _.each(_.keys(map), function(key) {
                    map[key] = normalizeUri(URI.parse(map[key].absoluteTo(resource.uri).toString()));
                    if (!self.policyCheck(map[key])) {
                        delete map[key];
                    } else {
                        uris.push(key);
                    }
                });
                uris = _.uniq(uris);
                callback(null, uris);
            }
        ], function (err, result) {
            self.transformStrategy(result, resource);
            self.emit('transformcomplete', resource);
            callback(null, resource);
        });
    } else {
        callback(null, resource);
    }
};

Crawler.prototype.transformStrategy = function(uris, resource) {
    var self = this;
    _.each(uris, function(uri) {
        var uriObj = new URI(uri);
        var replace = path.join(self.cache.rootDir, uriObj.host(), uriObj.resource());
        resource.content = replaceAll(resource.content, util.format('"%s"', uri), util.format('"%s"', replace));
    });
};

Crawler.prototype.canTransform = function(resource) {
    var self = this;
    return self.rewriteLinks && self.isDepthAllowed(resource) && isEmpty(resource.uri.filename());
};

Crawler.prototype.storeResource = function(resource, callback) {
    var self = this;
    self.emit('storestart', resource);
    self.cache.save(resource, function(err) {
        if (!err) {
            self.emit('storecomplete', resource);
            callback(null, resource);
        } else {
            self.emit('storeerror', resource, err);
            callback(err, resource);
        }
    });
};

module.exports = Crawler;