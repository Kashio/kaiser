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
    PolicyChecker = require('../policy_checker'),
    helpers       = require('../helpers');

var normalizeUri  = helpers.normalizeUri,
    isEmpty       = helpers.isEmpty;

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
                var originator = _.clone(resource);
                delete originator.content;
                self.crawler.crawl(result, originator);
            }
        });
    } else {
        callback(null, resource);
    }
};

BasicDiscoverer.prototype.getUris = function(resource, callback) {
    var self = this;
    var discoverRegex = [
        /\s(?:src|href)\s*=\s*(?:["']?\s*([^"'>]+)\s*["']?)(?:\s+[^"'>\s]+(?:\s*=\s*["']?[^"'>]*["']?)?)*\s*\/?>/ig,
        /\s?url\(["']?([^"']*?)["']?\)/ig,
        /((?:(?:https?):\/\/)(?:\S+(?::\S*)?@)?(?:(?!10(?:\.\d{1,3}){3})(?!127(?:\.\d{1,3}){3})(?!169\.254(?:\.\d{1,3}){2})(?!192\.168(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|\[(?:(?:[0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|(?:[0-9a-fA-F]{1,4}:){1,7}:|(?:[0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|(?:[0-9a-fA-F]{1,4}:){1,5}(?::[0-9a-fA-F]{1,4}){1,2}|(?:[0-9a-fA-F]{1,4}:){1,4}(?::[0-9a-fA-F]{1,4}){1,3}|(?:[0-9a-fA-F]{1,4}:){1,3}(?::[0-9a-fA-F]{1,4}){1,4}|(?:[0-9a-fA-F]{1,4}:){1,2}(?::[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:(?:(?::[0-9a-fA-F]{1,4}){1,6})|:(?:(?::[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(?::[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(?:ffff(?::0{1,4}){0,1}:){0,1}(?:(?:25[0-5]|(?:2[0-4]|1{0,1}[0-9]){0,1}[0-9]).){3,3}(?:25[0-5]|(?:2[0-4]|1{0,1}[0-9]){0,1}[0-9])|(?:[0-9a-fA-F]{1,4}:){1,4}:(?:(?:25[0-5]|(?:2[0-4]|1{0,1}[0-9]){0,1}[0-9]).){3,3}(?:25[0-5]|(?:2[0-4]|1{0,1}[0-9]){0,1}[0-9]))\]|localhost|(?:xn--[a-z0-9\-]{1,59}|(?:(?:[a-z\u00a1-\uffff0-9]+-?){0,62}[a-z\u00a1-\uffff0-9]{1,63}))(?:\.(?:xn--[a-z0-9\-]{1,59}|(?:[a-z\u00a1-\uffff0-9]+-?){0,62}[a-z\u00a1-\uffff0-9]{1,63}))*(?:\.(?:xn--[a-z0-9\-]{1,59}|(?:[a-z\u00a1-\uffff]{2,63}))))(?::\d{2,5})?(?:\/[^"'.()<>:;\s]*)?)/ig
    ];
    var uris = [];
    _.each(discoverRegex, function(regex) {
        var matches = resource.content.match(regex);
        _.each(matches, function(match) {
            var result = regex.exec(match);
            regex.lastIndex = 0;
            uris.push(result[result.length - 1]);
        });
    });
    callback(null, resource, uris);
};

BasicDiscoverer.prototype.formatUris = function(resource, uris, callback) {
    var self = this;
    uris = _.chain(uris)
        .map(function(uri) {
            try {
                return new URI(URI.decode(uri));
            } catch(e) {
                self.crawler.emit('discovererror', resource, uri, e);
                return null;
            }
        })
        .filter(function(uri) {
            return uri !== null && uri._parts.urn !== true;
        })
        .map(function(uri) {
            try {
                return normalizeUri(URI.parse(uri.absoluteTo(resource.uri).toString()));
            } catch (e) {
                self.crawler.emit('discovererror', resource, uri, e);
                return null;
            }
        })
        .filter(function(uri) {
            return uri !== null;
        })
        .value();
    callback(null, uris);
};

BasicDiscoverer.prototype.filterUris = function(uris, callback) {
    var self = this;
    uris = self.filterPolicyCheckNotPassingUris(uris);
    uris = self.filterAnchors(uris);
    uris = self.filterDuplicatedUris(uris);
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

BasicDiscoverer.prototype.filterAnchors = function(uris) {
    var self = this;
    return _.filter(uris, function(uri) {
        return isEmpty(uri.fragment());
    });
};

BasicDiscoverer.prototype.filterDuplicatedUris = function(uris) {
    var self = this;
    return _.uniq(_.map(uris, function(uri) {
        return uri.toString();
    }));
};

module.exports = BasicDiscoverer;