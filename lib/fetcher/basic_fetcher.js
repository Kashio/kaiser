/**
 * Created by Roy on 05/02/2016.
 */

'use strict';

// core modules
var util                = require('util');

// npm modules
var request             = require('request'),
    async               = require('async'),
    iconv               = require('iconv-lite'),
    _                   = require('underscore');

// lib modules
var helpers             = require('../helpers'),
    Fetcher             = require('./fetcher'),
    Resource            = require('../resource'),
    PolicyChecker       = require('../policy_checker'),
    endOfLine           = require('os').EOL;

var isInteger           = helpers.isInteger;

const recoverableErrors = [
    'ESOCKETTIMEDOUT',
    'ETIMEDOUT',
    'ECONNRESET',
    'ECONNREFUSED'
];

function BasicFetcher(crawler, options, requestSettings) {
    var self = this;
    BasicFetcher.init.call(self, crawler, options, requestSettings);
}

util.inherits(BasicFetcher, Fetcher);

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
};

BasicFetcher.prototype.fetch = function(resources, callback) {
    var self = this;
    async.filter(_.filter(resources, function(resource) {
        return resource instanceof Resource;
    }), function(resource, callback) {
        if (!_.contains(self.fetchedUris, resource.uri.toString())) {
            self.fetchedUris.push(resource.uri.toString());
            self.crawler.emit('fetchstart', resource);
            self.pendingRequests.push({
                "arguments": [{
                    uri: resource.uri.toString()
                }, self.maxAttempts, function (error, response, body) {
                    var fetched = false;
                    if (!error) {
                        self.crawler.emit('fetchcomplete', resource);
                        if (self.policyChecker.isMimeTypeAllowed((response.headers['content-type'] || '').split(';')[0])) {
                            resource.content = self.decodeBuffer(body, response.headers["content-type"] || '', resource);
                            fetched = true;
                        }
                    } else {
                        self.crawler.emit('fetcherror', resource, error);
                    }
                    self.activeRequests--;
                    self.runRequest();
                    callback(fetched);
                }],
                "function": self.requestLoop
            });
            self.runRequest();
        } else {
            callback(false);
        }
    }, function(result) {
        callback(null, result);
    });
};

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

BasicFetcher.prototype.requestLoop = function(options, attemptsLeft, callback, lastError) {
    var self = this;
    if (attemptsLeft <= 0) {
        callback((lastError != null ? lastError : new Error('No attempts to fetch the URL were made')));
    } else {
        request(options, function (error, response, body) {
            var e;
            if ((error && _.contains(recoverableErrors, error.code)) || (response && (500 <= response.statusCode && response.statusCode < 600))) {
                e = error ? new Error(util.format('%s error on %s', error.code, options.uri)) : new Error(util.format('HTTP %s error fetching %s', response.statusCode, options.uri));
                e.code = error ? error.code : response.statusCode;
                setTimeout((function () {
                    self.requestLoop(options, --attemptsLeft, callback, e);
                }), self.retryDelay);
            } else if (!error && (200 <= response.statusCode && response.statusCode < 300)) {
                callback(null, response, body);
            } else if (error) {
                e = new Error(util.format("Error fetching '%s': %s (%s)", options.uri, error.message, error.code));
                e.code = error.code;
                callback(e);
            } else {
                e = new Error(util.format('HTTP %s error fetching %s', response.statusCode, options.uri));
                e.code = response.statusCode;
                callback(e);
            }
        });
    }
};

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

BasicFetcher.prototype.getEncoding = function(buffer, contentTypeHeader) {
    var self = this;
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