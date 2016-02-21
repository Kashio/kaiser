/**
 * Created by Roy on 06/02/2016.
 */

'use strict';

// core modules
var util               = require('util'),
    path               = require('path');

// npm modules
var async              = require('async'),
    URI                = require('urijs'),
    escapeStringRegexp = require('escape-string-regexp'),
    _                  = require('underscore');

// lib modules
var Transformer       = require('./transformer'),
    Resource          = require('../resource'),
    PolicyChecker     = require('../policy_checker'),
    helpers           = require('../helpers');

var isEmpty           = helpers.isEmpty,
    normalizeUri      = helpers.normalizeUri;

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
            async.apply(self.getUris.bind(self), resource),
            self.replaceResourceContent.bind(self)
        ], function (err, result) {
            self.crawler.emit('transformcomplete', result);
            callback(null, result);
        });
    } else {
        callback(null, resource);
    }
};

BasicTransformer.prototype.canTransform = function(resource) {
    var self = this;
    var rewriteLinksFileTypes = [
        'html',
        'css',
        'js',
        'php',
        'asp',
        'txt'
    ];
    return self.policyChecker.isDepthAllowed(resource) && _.some(rewriteLinksFileTypes, function(fileType) {
        return isEmpty(resource.uri.filename()) || resource.uri.suffix() === fileType;
    });
};

BasicTransformer.prototype.getUris = function(resource, callback) {
    var self = this;
    var discoverRegex = [
        /(\s(?:src|href)\s*=\s*["']?\s*)([^"'>]+)(\s*["']?(?:\s+[^"'>\s]+(?:\s*=\s*["']?[^"'>]*["']?)?)*\s*\/?>)/ig,
        /(\s?url\(["']?)([^"']*?)(["']?\))/ig,
        /(.)((?:(?:https?):\/\/)(?:\S+(?::\S*)?@)?(?:(?!10(?:\.\d{1,3}){3})(?!127(?:\.\d{1,3}){3})(?!169\.254(?:\.\d{1,3}){2})(?!192\.168(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|\[(?:(?:[0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|(?:[0-9a-fA-F]{1,4}:){1,7}:|(?:[0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|(?:[0-9a-fA-F]{1,4}:){1,5}(?::[0-9a-fA-F]{1,4}){1,2}|(?:[0-9a-fA-F]{1,4}:){1,4}(?::[0-9a-fA-F]{1,4}){1,3}|(?:[0-9a-fA-F]{1,4}:){1,3}(?::[0-9a-fA-F]{1,4}){1,4}|(?:[0-9a-fA-F]{1,4}:){1,2}(?::[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:(?:(?::[0-9a-fA-F]{1,4}){1,6})|:(?:(?::[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(?::[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(?:ffff(?::0{1,4}){0,1}:){0,1}(?:(?:25[0-5]|(?:2[0-4]|1{0,1}[0-9]){0,1}[0-9]).){3,3}(?:25[0-5]|(?:2[0-4]|1{0,1}[0-9]){0,1}[0-9])|(?:[0-9a-fA-F]{1,4}:){1,4}:(?:(?:25[0-5]|(?:2[0-4]|1{0,1}[0-9]){0,1}[0-9]).){3,3}(?:25[0-5]|(?:2[0-4]|1{0,1}[0-9]){0,1}[0-9]))\]|localhost|(?:xn--[a-z0-9\-]{1,59}|(?:(?:[a-z\u00a1-\uffff0-9]+-?){0,62}[a-z\u00a1-\uffff0-9]{1,63}))(?:\.(?:xn--[a-z0-9\-]{1,59}|(?:[a-z\u00a1-\uffff0-9]+-?){0,62}[a-z\u00a1-\uffff0-9]{1,63}))*(?:\.(?:xn--[a-z0-9\-]{1,59}|(?:[a-z\u00a1-\uffff]{2,63}))))(?::\d{2,5})?(?:\/[^"'.()<>:;\s]*)?)(.)/ig
    ];
    var blackListUris = [
        '#',
        'javascript:'
    ];
    var regexUrisDictionary = [];
    _.each(discoverRegex, function(regex) {
        regexUrisDictionary[regex] = [];
        var matches = resource.content.match(regex);
        _.each(matches, function(match) {
            var result = regex.exec(match);
            regex.lastIndex = 0;
            regexUrisDictionary[regex].push(result[result.length - 2]);
        });
        regexUrisDictionary[regex] = _.chain(regexUrisDictionary[regex])
            .filter(function(uri) {
                var uriObj = new URI(uri);
                if (uriObj._parts.urn === true) {
                    return false;
                }
                var normalizedUri = normalizeUri(URI.parse(uriObj.absoluteTo(resource.uri).toString()));
                return self.policyChecker.isProtocolAllowed(normalizedUri.protocol()) &&
                    self.policyChecker.isFileTypeAllowed(normalizedUri.suffix()) &&
                    self.policyChecker.isHostnameAllowed(normalizedUri.hostname);
            })
            .uniq()
            .filter(function(uri) {
                return !(isEmpty(uri) || _.some(blackListUris, function(blackListUri) {
                        return uri.startsWith(blackListUri);
                    }));
            })
            .value();
    });
    callback(null, resource, regexUrisDictionary);
};

BasicTransformer.prototype.replaceResourceContent = function(resource, regexUrisDictionary, callback) {
    var self = this;
    _.each(_.keys(regexUrisDictionary), function(key) {
        _.each(regexUrisDictionary[key], function(uri) {
            var regex = key.toString().replace(/(\([^]*?\))(?:\([^]*\))(\([^]*\))/ig, util.format('$1(?:%s)$2', escapeStringRegexp(uri).replace(/(\/)/ig, '\\$1')));
            regex = regex.substring(1, regex.length - 3);
            var replace = '';
            if (uri === '/') {
                replace = path.join(self.crawler.cache.rootDir, resource.uri.host(), resource.uri.directory(), 'index.html');
            } else {
                var uriObj = new URI(uri);
                uriObj = normalizeUri(URI.parse(uriObj.absoluteTo(resource.uri).toString()));
                replace = path.join(self.crawler.cache.rootDir, uriObj.host(), uriObj.directory(), uriObj.filename() ?
                    uriObj.filename() :
                    'index.html');
            }
            replace = util.format('file:///%s', replace.replace(/\\/ig, '/'));
            if (key.toString() === '/(\\s?url\\(["\']?)([^"\']*?)(["\']?\\))/gi') {
                replace = util.format('\'%s\'', replace);
            }
            resource.content = resource.content.replace(new RegExp(regex, 'ig'), util.format('$1%s$2', replace));
        });
    });
    callback(null, resource);
};

module.exports = BasicTransformer;