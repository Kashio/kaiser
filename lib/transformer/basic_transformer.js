/**
 * Created by Roy on 06/02/2016.
 */

'use strict';

// core modules
var util          = require('util'),
    path          = require('path');

// npm modules
var async         = require('async'),
    URI           = require('urijs'),
    _             = require('underscore');

// lib modules
var Transformer       = require('./transformer'),
    Resource      = require('../resource'),
    PolicyChecker = require('../policychecker'),
    helpers       = require('../helpers');

var isEmpty       = helpers.isEmpty,
    normalizeUri  = helpers.normalizeUri,
    replaceAll    = helpers.replaceAll;

function BasicTransformer(crawler) {
    var self = this;
    BasicTransformer.init.call(self, crawler);
}

util.inherits(BasicTransformer, Transformer);

BasicTransformer.init = function(crawler) {
    var self = this;
    Transformer.init.call(self, crawler);
    if (!self.policyChecker) {
        self.policyChecker = new PolicyChecker(self.crawler);
    }
};

BasicTransformer.prototype.transform = function(resource, callback) {
    var self = this;
    if (!(resource instanceof Resource)) {
        throw new TypeError('resource must be of type Resource');
    }
    if (self.canTransform(resource)) {
        self.crawler.emit('transformstart', resource);
        async.waterfall([
            async.apply(self.crawler.discoverer.getUris.bind(self), resource),
            function (resource, uris, callback) {
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
                    var uri = map[key];
                    if (!(self.policyChecker.isProtocolAllowed(uri.protocol()) &&
                        self.policyChecker.isFileTypeAllowed(uri.suffix()) &&
                        self.policyChecker.isHostnameAllowed(uri.hostname))) {
                        delete map[key];
                    } else {
                        uris.push(key);
                    }
                });
                uris = _.uniq(uris);
                uris = _.filter(uris, function(uri) {
                    var uriObj = new URI(uri);
                    if (normalizeUri(URI.parse(uriObj.absoluteTo(resource.uri).toString())).toString() === resource.uri.toString()) {
                        return uriObj.domain() === resource.uri.domain();
                    } // TODO : (keep only connect-able uris)
                    return true;
                });
                callback(null, resource, uris);
            },
            function(resource, uris, callback) {
                _.each(uris, function(uri) {
                    var uriObj = new URI(uri);
                    var replace = path.join(self.crawler.cache.rootDir, uriObj.host(), uriObj.directory(), uriObj.filename() ?
                        uriObj.filename() :
                        'index.html');
                    resource.content = replaceAll(resource.content, uri, replace);
                });
                callback(null, resource);
            }
        ], function (err, result) {
            self.crawler.emit('transformcomplete', resource);
            callback(null, resource);
        });
    } else {
        callback(null, resource);
    }
};

BasicTransformer.prototype.canTransform = function(resource) {
    var self = this;
    return self.crawler.rewriteLinks && self.policyChecker.isDepthAllowed(resource) && isEmpty(resource.uri.filename());
};

module.exports = BasicTransformer;