/**
 * Created by Roy on 05/02/2016.
 */

'use strict';

// core modules
var util          = require('util');

// npm modules
var _             = require('underscore');

// lib modules
var CrawlerReferencer = require('./crawler_referencer'),
    Resource      = require('./resource'),
    helpers       = require('./helpers');

var isEmpty       = helpers.isEmpty;

function PolicyChecker(crawler) {
    var self = this;
    PolicyChecker.init.call(self, crawler);
}

util.inherits(PolicyChecker, CrawlerReferencer);

PolicyChecker.init = function(crawler) {
    var self = this;
    CrawlerReferencer.init.call(self, crawler);
};

PolicyChecker.prototype.isAllowed = function(array, value) {
    var self = this;
    return _.contains(array, value);
};

PolicyChecker.prototype.isProtocolAllowed = function(protocol) {
    var self = this;
    return self.isAllowed(self.crawler.allowedProtocols, protocol);
};

PolicyChecker.prototype.isFileTypeAllowed = function(fileType) {
    var self = this;
    return isEmpty(fileType) || self.isAllowed(self.crawler.allowedFileTypes, fileType);
};

PolicyChecker.prototype.isMimeTypeAllowed = function(mimeType) {
    var self = this;
    return _.some(self.crawler.allowedMimeTypes, function(regex) {
        return regex.test(mimeType);
    }, self);
};

PolicyChecker.prototype.isHostnameAllowed = function(hostname) {
    var self = this;
    return !self.isAllowed(self.crawler.disallowedHostnames, hostname);
};

PolicyChecker.prototype.isLinkAllowed = function(uri) {
    var self = this;
    return _.some(self.crawler.allowedLinks, function(allowedLink) {
        return allowedLink.test(uri);
    });
};

PolicyChecker.prototype.isDepthAllowed = function(resource) {
    var self = this;
    if (!(resource instanceof Resource)) {
        throw new TypeError('resource must be of type Resource');
    }
    return resource.depth <= (resource.uri.domain() === self.crawler.uri.domain() ?
            self.crawler.maxDepth :
            self.crawler.maxExternalDepth);
};

PolicyChecker.prototype.isRobotsTxtAllowsResource = function(resource) {
    var self = this;
    if (self.crawler.robotsParser) {
        return self.crawler.robotsParser.canFetchSync(self.crawler.userAgent, resource);
    }
    return true;
};

PolicyChecker.prototype.isFileSizeAllowed = function(body) {
    var self = this;
    return body.length <= self.crawler.maxFileSize;
};

PolicyChecker.prototype.isSiteSizeLimitPassed = function(totalBytesFetched) {
    var self = this;
    return totalBytesFetched >= self.crawler.siteSizeLimit;
};

PolicyChecker.prototype.isLinkNumberPassed = function(fetchedUris) {
    var self = this;
    return fetchedUris.length >= self.crawler.maxLinkNumber;
};

PolicyChecker.prototype.isMaxTimeOverallPassed = function() {
    var self = this;
    return ((Date.now() - self.crawler.crawlStartTime) / 1000) >= self.crawler.maxTimeOverall;
};

module.exports = PolicyChecker;