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
var Fetcher       = require('./fetcher'),
    Resource      = require('../resource'),
    PolicyChecker = require('../policychecker');

function BasicFetcher(crawler, requestSettings) {
    var self = this;
    BasicFetcher.init.call(self, crawler, requestSettings);
}

util.inherits(BasicFetcher, Fetcher);

BasicFetcher.init = function(crawler, requestSettings) {
    var self = this;
    Fetcher.init.call(self, crawler);
    request = requestSettings;
    if (!self.policyChecker) {
        self.policyChecker = new PolicyChecker(self.crawler);
    }
};

BasicFetcher.prototype.fetch = function(resources, callback) {
    var self = this;
    async.filter(_.filter(resources, function(resource) {
        return resource instanceof Resource;
    }), function(resource, callback) {
        self.crawler.emit('fetchstart', resource);
        request({
            uri: resource.uri.toString()
        }, function (error, response, body) {
            var fetched = false;
            if (!error && response.statusCode === 200) {
                self.crawler.emit('fetchcomplete', resource);
                if (self.policyChecker.isMimeTypeAllowed((response.headers['content-type'] || '').split(';')[0])) {
                    resource.content = self.decodeBuffer(body, response.headers["content-type"] || '', resource);
                    fetched = true;
                }
            } else {
                self.crawler.emit('fetcherror', resource, error);
            }
            callback(fetched);
        })
    }, function(result) {
        callback(null, result);
    });
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