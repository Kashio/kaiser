/**
 * Created by Roy on 06/02/2016.
 */

'use strict';

// core modules
var util                     = require('util'),
    path                     = require('path');

// npm modules
var async                    = require('async'),
    URI                      = require('urijs'),
    _                        = require('underscore');

// lib modules
var Transformer              = require('./transformer'),
    PolicyChecker            = require('../policy_checker'),
    helpers                  = require('../helpers');

var isEmpty                  = helpers.isEmpty,
    normalizeUri             = helpers.normalizeUri,
    customEscapeStringRegexp = helpers.customEscapeStringRegexp,
    makeFileNameFromUri      = helpers.makeFileNameFromUri,
    htmlUriDecode            = helpers.htmlUriDecode;

const discoverRegex          = [
    /(\s(?:src|href)\s*=\s*["']?\s*)([^"'>]+)(\s*["']?(?:\s+[^"'>\s]+(?:\s*=\s*["']?[^"'>]*["']?)?)*\s*\/?>)/ig,
    /(:\s*url\(["']?)([^"']*?)(["']?\))/ig,
    /(.{1,20})((?:(?:https?):\/\/)(?:\S+(?::\S*)?@)?(?:(?!10(?:\.\d{1,3}){3})(?!127(?:\.\d{1,3}){3})(?!169\.254(?:\.\d{1,3}){2})(?!192\.168(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|\[(?:(?:[\da-f]{1,4}:){7}[\da-f]{1,4}|(?:[\da-f]{1,4}:){1,7}:|(?:[\da-f]{1,4}:){1,6}:[\da-f]{1,4}|(?:[\da-f]{1,4}:){1,5}(?::[\da-f]{1,4}){1,2}|(?:[\da-f]{1,4}:){1,4}(?::[\da-f]{1,4}){1,3}|(?:[\da-f]{1,4}:){1,3}(?::[\da-f]{1,4}){1,4}|(?:[\da-f]{1,4}:){1,2}(?::[\da-f]{1,4}){1,5}|[\da-f]{1,4}:(?:(?::[\da-f]{1,4}){1,6})|:(?:(?::[\da-f]{1,4}){1,7}|:)|fe80:(?::[\da-f]{0,4}){0,4}%[\da-z]+|::(?:ffff(?::0{1,4})?:)?(?:(?:25[0-5]|(?:2[0-4]|1?\d)?\d).){3}(?:25[0-5]|(?:2[0-4]|1?\d)?\d)|(?:[\da-f]{1,4}:){1,4}:(?:(?:25[0-5]|(?:2[0-4]|1?\d)?\d).){3}(?:25[0-5]|(?:2[0-4]|1?\d)?\d))\]|localhost|(?:xn--[a-z\d\-]{1,59}|(?:(?:[a-z\u00a1-\uffff\d]+(?:-[a-z\u00a1-\uffff\d]){0,62})))(?:\.(?:xn--[a-z\d\-]{1,59}|(?:[a-z\u00a1-\uffff\d]+(?:-[a-z\u00a1-\uffff\d]){0,62})))*(?:\.(?:xn--[a-z\d\-]{1,59}|(?:[a-z\u00a1-\uffff]{2,63}))))(?::\d{2,5})?(?:\/[^"'()<>\s]*)?)(.{1,20})/ig
];
const blackListUris          = [
    '#',
    'javascript:'
];

function BasicTransformer(crawler, options) {
    var self = this;
    BasicTransformer.init.call(self, crawler, options);
}

util.inherits(BasicTransformer, Transformer);

BasicTransformer.init = function(crawler, options) {
    var self = this;
    Transformer.init.call(self, crawler);
    if (!self.policyChecker) {
        self.policyChecker = new PolicyChecker(self.crawler);
    }
    if (!self.rewriteLinksFileTypes) {
        self.rewriteLinksFileTypes = options.rewriteLinksFileTypes;
    }
};

BasicTransformer.prototype.logic = function(resource, callback) {
    var self = this;
    if (self.canTransform(resource)) {
        async.waterfall([
            async.apply(self.getUris.bind(self), resource),
            self.replaceResourceContent.bind(self)
        ], callback);
    } else {
        callback();
    }
};

BasicTransformer.prototype.canTransform = function(resource) {
    var self = this;
    return self.policyChecker.isDepthAllowed(resource) && _.some(self.rewriteLinksFileTypes, function(fileType) {
            return isEmpty(resource.uri.filename()) || resource.uri.suffix() === fileType;
        });
};

BasicTransformer.prototype.getUris = function(resource, callback) {
    var self = this;
    var regexUrisDictionary = [];
    var allowedUris = [];
    var notAllowedUris = [];
    _.each(discoverRegex, function(regex) {
        regexUrisDictionary[regex] = [];
        var matches = resource.content.match(regex);
        _.each(matches, function(match) {
            var groups = regex.exec(match);
            var loopCount = groups.length;
            regexUrisDictionary[regex][groups.input] = [];
            for (var i = 1; i < loopCount; i++) {
                regexUrisDictionary[regex][groups.input].push(groups[i]);
            }
            regex.lastIndex = 0;
        });
        regexUrisDictionary = _.chain(_.keys(regexUrisDictionary[regex]))
            .each(function(match) {
                var uri = regexUrisDictionary[regex][match][1];
                if (isEmpty(uri) || _.some(blackListUris, function(blackListUri) {
                        return uri.startsWith(blackListUri);
                    })) {
                    return;
                }
                var uriObj = new URI(uri);
                if (uriObj.is('urn')) {
                    return;
                }
                try {
                    var normalizedUri = normalizeUri(URI.parse(uriObj.absoluteTo(resource.uri).toString()));
                    var isPolicyAllowed = self.policyChecker.isProtocolAllowed(normalizedUri.protocol()) &&
                        self.policyChecker.isFileTypeAllowed(normalizedUri.suffix()) &&
                        self.policyChecker.isHostnameAllowed(normalizedUri.hostname()) &&
                        self.policyChecker.isLinkAllowed(normalizedUri.toString());
                    if (isPolicyAllowed) {
                        allowedUris.push(regexUrisDictionary[regex][match]);
                    } else {
                        notAllowedUris.push(regexUrisDictionary[regex][match]);
                    }
                } catch (e) {
                    self.crawler.emit('transformerror', resource, uri, e);
                }
            })
            .filter(false)
            .value();
    });
    self.replaceResourceContent(resource, notAllowedUris, self.calculateReplacePortionOfNotAllowedUris, function(err, result) {
        callback(null, result, allowedUris, self.calculateReplacePortionOfAllowedUris);
    });
};

BasicTransformer.prototype.replaceResourceContent = function(resource, matches, replaceCalculationFunction, callback) {
    var self = this;
    _.each(matches, function(match) {
        var uri = customEscapeStringRegexp(match[1]);
        var regex = util.format('%s%s%s', customEscapeStringRegexp(match[0]), uri, customEscapeStringRegexp(match[2]));
        var replace = util.format('%s%s%s', match[0], htmlUriDecode(replaceCalculationFunction.call(self, resource, match[1])), match[2]);
        if (replace !== uri) {
            resource.content = resource.content.replace(new RegExp(regex, 'ig'), replace);
        }
    });
    callback(null, resource);
};

BasicTransformer.prototype.calculateReplacePortionOfAllowedUris = function(resource, uri) {
    var self = this;
    if (uri === '/') {
        return 'index.html';
    } else {
        var uriObj = new URI(uri);
        uriObj = normalizeUri(URI.parse(uriObj.absoluteTo(resource.uri).toString()));
        var calculatedPath = '';
        var relativness = '';
        if (resource.uri.hostname() != uriObj.hostname()) {
            var resourceDirectory = resource.uri.directory();
            if (resourceDirectory.slice(-1) !== '/') {
                resourceDirectory = util.format('%s/', resourceDirectory);
            }
            var numberOfDirectories = (resourceDirectory.match(/\//g) || []).length;
            for (var i = 0; i < numberOfDirectories; i++) {
                relativness += '../';
            }
            calculatedPath = path.join(relativness, uriObj.hostname(), uriObj.directory(), makeFileNameFromUri(uriObj));
        } else {
            var newDirPortion = '';
            var resourceUriDirs = _.filter(resource.uri.directory().split('/'), function(split) {
                return split !== '';
            });
            if (!resourceUriDirs.length) {
                relativness = './';
                newDirPortion = uriObj.directory();
            } else {
                var uriDirs = _.filter(uriObj.directory().split('/'), function(split) {
                    return split !== '';
                });
                var sameDirCount = 0;
                for (var j = 0; j < resourceUriDirs.length; j++) {
                    if (resourceUriDirs[j] === uriDirs[j]) {
                        sameDirCount++;
                    } else {
                        var uriObjDirectory = uriObj.directory();
                        newDirPortion = uriObjDirectory.substring(uriObjDirectory.indexOf(uriDirs[j]));
                        break;
                    }
                }
                for(var k = 0; k < resourceUriDirs.length - sameDirCount; k++) {
                    relativness += '../';
                }
                if (newDirPortion === '') {
                    relativness = './';
                }
            }
            calculatedPath = path.join(relativness, newDirPortion, makeFileNameFromUri(uriObj));
        }
        return calculatedPath.replace(/\\/g, '/');
    }
};

BasicTransformer.prototype.calculateReplacePortionOfNotAllowedUris = function(resource, uri) {
    var self = this;
    return new URI(uri).absoluteTo(resource.uri.toString()).toString();
};

module.exports = BasicTransformer;