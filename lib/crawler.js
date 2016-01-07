/**
 * Created by Roy on 31/12/2015.
 */

'use strict';

// core modules
var util         = require('util'),
    EventEmitter = require('events'),
    http         = require('http'),
    https        = require('https');

// npm modules
var request      = require('request'),
    iconv        = require('iconv-lite');

// lib modules
var helpers      = require('./helpers'),
    metadata     = require('../package.json');

var normalizeUri = helpers.normalizeUri,
    isInteger    = helpers.isInteger;

/**
 * Expected options object
 * {
 *
 *     proxy : {
 *         protocol : string,
 *         username : string,
 *         password : string,
 *         hostname : string,
 *         port : number
 *     }
 * }
 */

function Crawler(options) {
    var self = this;

    EventEmitter.call(self);

    self.init(options);
}

util.inherits(Crawler, EventEmitter);

Crawler.prototype.init = function(options) {
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

    if (!self.proxy && options.proxy) {
        self.proxy = normalizeUri(options.proxy);
    }

    if (!self.auth && options.auth) {
        self.auth = options.auth;
    }

    if (!self.acceptCookies) {
        self.acceptCookies = options.hasOwnProperty('acceptCookies') ?
            options.acceptCookies :
            true;
    }

    if (!self.userAgent) {
        self.userAgent = options.userAgent || util.format('Node/%s %s (%s)',
            metadata.name, metadata.version, metadata.repository.url);
    }

    if (!self.agent) {
        var agentOptions = {
            maxSockets: isInteger(options.maxSockets) ?
                options.maxSockets :
                5
        };
        self.agent = new (self.uri.protocol === 'http' ?
            http.Agent(agentOptions) :
            https.Agent(agentOptions));
    }

    if (!self.timeout) {
        self.timeout = isInteger(options.timeout) ?
            options.timeout :
            5000;
    }

    if (!self.strictSSL) {
        self.strictSSL = options.hasOwnProperty('strictSSL') ?
            options.strictSSL :
            true;
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
        self.rewriteLinks = options.hasOwnProperty('rewriteLinks') ?
            options.rewriteLinks :
            true;
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

    if (!self.disallowedHostNames) {
        self.disallowedHostNames = [

        ];
    }
};

Crawler.prototype.crawl = function() {
    var self = this;
    request({
        uri: self.uri,
        headers: {
            'user-agent': self.userAgent
        },
        proxy: self.proxy,
        auth: self.auth,
        encoding: null,
        gzip: true,
        jar: self.acceptCookies,
        agent: self.agent,
        strictSSL: self.strictSSL,
        time: true
    }, function(error, response, body) {
        if (!error && response.statusCode === 200) {
            var content = self.decodeBuffer(body, response.headers["content-type"] || '');
        }
    });
};

Crawler.prototype.decodeBuffer = function(buffer, contentTypeHeader) {
    var encoding = /<meta.*charset=["']?([^"'>]*)["']?\s*\/?>/i.exec(buffer.toString()) || [];
    encoding = contentTypeHeader.split("charset=")[1] || encoding[1] || contentTypeHeader;
    encoding = iconv.encodingExists(encoding) ? encoding : 'utf-8';
    return iconv.decode(buffer, encoding);
};

module.exports = Crawler;