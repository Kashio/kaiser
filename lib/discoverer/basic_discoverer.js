/**
 * Created by Roy on 05/02/2016.
 */

'use strict';

// core modules
var util          = require('util');

// npm modules
var async         = require('async'),
    URI           = require('urijs'),
    _             = require('underscore');

// lib modules
var Discoverer    = require('./discoverer'),
    Resource      = require('../resource'),
    PolicyChecker = require('../policychecker'),
    helpers       = require('../helpers');

var normalizeUri  = helpers.normalizeUri;

function BasicDiscoverer(crawler) {
    var self = this;
    BasicDiscoverer.init.call(self, crawler);
}

util.inherits(BasicDiscoverer, Discoverer);

BasicDiscoverer.init = function(crawler) {
    var self = this;
    Discoverer.init.call(self, crawler);
    if (!self.policyChecker) {
        self.policyChecker = new PolicyChecker(self.crawler);
    }
};

BasicDiscoverer.prototype.discover = function(resource, callback) {
    var self = this;
    if (!(resource instanceof Resource)) {
        throw new TypeError('resource must be of type Resource');
    }
    if (self.policyChecker.isDepthAllowed(resource)) {
        self.crawler.emit('discoverstart', resource);
        async.waterfall([
            async.apply(self.getUris.bind(self), resource),
            self.formatUris.bind(self),
            self.filterUris.bind(self)
        ], function (err, result) {
            self.crawler.emit('discovercomplete', result, resource);
            callback(null, resource);
            if (_.some(result)) {
                self.crawler.crawl(result, resource);
            }
        });
    } else {
        callback(null, resource);
    }
};

BasicDiscoverer.prototype.getUris = function(resource, callback) {
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
    callback(null, resource, uris);
};

BasicDiscoverer.prototype.formatUris = function(resource, uris, callback) {
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

BasicDiscoverer.prototype.filterUris = function(uris, callback) {
    var self = this;
    uris = self.filterPolicyCheckNotPassingUris(uris);
    uris = self.filterDuplicatedUris(uris);
    uris = self.filterAlreadyFetchedUris(uris);
    callback(null, uris);
};

BasicDiscoverer.prototype.filterPolicyCheckNotPassingUris = function(uris) {
    var self = this;
    return _.filter(uris, function(uri) {
        return self.policyChecker.isProtocolAllowed(uri.protocol()) &&
            self.policyChecker.isFileTypeAllowed(uri.suffix()) &&
            self.policyChecker.isHostnameAllowed(uri.hostname);
    });
};

BasicDiscoverer.prototype.filterDuplicatedUris = function(uris) {
    var self = this;
    return _.uniq(_.map(uris, function(uri) {
        return uri.toString();
    }));
};

BasicDiscoverer.prototype.filterAlreadyFetchedUris = function(uris) {
    var self = this;
    var fetchQueue = self.crawler.fetchQueue;
    return _.filter(uris, function(uri) {
        return !fetchQueue.exists(uri);
    });
};

module.exports = BasicDiscoverer;