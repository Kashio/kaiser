/**
 * Created by Roy on 05/02/2016.
 */

'use strict';

// core modules
var util          = require('util');

// npm modules
var request       = require('request'),
    async         = require('async'),
    iconv         = require('iconv-lite'),
    _             = require('underscore');

// lib modules
var helpers       = require('../helpers'),
    Fetcher       = require('./fetcher'),
    Resource      = require('../resource'),
    PolicyChecker = require('../policy_checker');

var isInteger     = helpers.isInteger;

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
        return resource instanceof Resource && !_.contains(self.fetchedUris, resource.uri.toString());
    }), function(resource, callback) {
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
                self.fetchedUris.push(resource.uri.toString());
                self.runRequest();
                callback(fetched);
            }],
            "function": self.requestLoop
        });
        self.runRequest();
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
            var recoverableErrors = ['ESOCKETTIMEDOUT', 'ETIMEDOUT', 'ECONNRESET', 'ECONNREFUSED'];
            var e;
            if ((error && _.contains(recoverableErrors, error.code)) || (response && (500 <= response.statusCode && response.statusCode < 600))) {
                e = error ? new Error("" + error.code + " error on " + options.url) : new Error("HTTP " + response.statusCode + " error fetching " + options.url);
                e.code = error ? error.code : response.statusCode;
                setTimeout((function () {
                    self.requestLoop(options, --attemptsLeft, callback, e);
                }), self.retryDelay);
            } else if (!error && (200 <= response.statusCode && response.statusCode < 300)) {
                callback(null, response, body);
            } else if (error) {
                e = new Error("Error fetching '" + options.uri + "': " + error.message + " (" + error.code + ")");
                e.code = error.code;
                callback(e);
            } else {
                e = new Error("HTTP " + response.statusCode + " error fetching " + options.uri);
                e.code = response.statusCode;
                callback(e);
            }
        });
    }
};

BasicFetcher.prototype.decodeBuffer = function(buffer, contentTypeHeader, resource) {
    var self = this;
    resource.encoding = self.getEncoding(buffer, contentTypeHeader);
    return iconv.decode(buffer, resource.encoding);
};

BasicFetcher.prototype.getEncoding = function(buffer, contentTypeHeader) {
    var self = this;
    var encoding = /<meta.*charset=["']?([^"'>]*)["']?\s*\/?>/i.exec(buffer.toString()) || [];
    encoding = contentTypeHeader.split("charset=")[1] || encoding[1] || contentTypeHeader;
    encoding = iconv.encodingExists(encoding) ? encoding : 'binary';
    return encoding;
};

module.exports = BasicFetcher;