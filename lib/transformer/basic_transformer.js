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

const discoverRegex = [
	/(\s(?:src|href)\s*=\s*["']?\s*)([^"'>]+)(\s*["']?[^>]*>)/ig,
	/(:\s*url\(["']?)([^"']*?)(["']?\))/ig,
	/(.{1,20})((?:(?:https?):\/\/)(?:\S+(?::\S*)?@)?(?:(?!10(?:\.\d{1,3}){3})(?!127(?:\.\d{1,3}){3})(?!169\.254(?:\.\d{1,3}){2})(?!192\.168(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|\[(?:(?:[\da-f]{1,4}:){7}[\da-f]{1,4}|(?:[\da-f]{1,4}:){1,7}:|(?:[\da-f]{1,4}:){1,6}:[\da-f]{1,4}|(?:[\da-f]{1,4}:){1,5}(?::[\da-f]{1,4}){1,2}|(?:[\da-f]{1,4}:){1,4}(?::[\da-f]{1,4}){1,3}|(?:[\da-f]{1,4}:){1,3}(?::[\da-f]{1,4}){1,4}|(?:[\da-f]{1,4}:){1,2}(?::[\da-f]{1,4}){1,5}|[\da-f]{1,4}:(?:(?::[\da-f]{1,4}){1,6})|:(?:(?::[\da-f]{1,4}){1,7}|:)|fe80:(?::[\da-f]{0,4}){0,4}%[\da-z]+|::(?:ffff(?::0{1,4})?:)?(?:(?:25[0-5]|(?:2[0-4]|1?\d)?\d).){3}(?:25[0-5]|(?:2[0-4]|1?\d)?\d)|(?:[\da-f]{1,4}:){1,4}:(?:(?:25[0-5]|(?:2[0-4]|1?\d)?\d).){3}(?:25[0-5]|(?:2[0-4]|1?\d)?\d))\]|localhost|(?:xn--[a-z\d\-]{1,59}|(?:(?:[a-z\u00a1-\uffff\d]+(?:-[a-z\u00a1-\uffff\d]){0,62})))(?:\.(?:xn--[a-z\d\-]{1,59}|(?:[a-z\u00a1-\uffff\d]+(?:-[a-z\u00a1-\uffff\d]){0,62})))*(?:\.(?:xn--[a-z\d\-]{1,59}|(?:[a-z\u00a1-\uffff]{2,63}))))(?::\d{2,5})?(?:\/[^"'()<>\s]*)?)(.{1,20})/ig
];

const blackListUris = [
	'#',
	'javascript:'
];

/**
 * Basic Transformer
 *
 * @param {Crawler} crawler
 * @param {Object} options
 * @constructor
 */
function BasicTransformer(crawler, options) {
	var self = this;
	BasicTransformer.init.call(self, crawler, options);
}

util.inherits(BasicTransformer, Transformer);

/**
 * Initialize BasicTransformer
 *
 * @param {Crawler} crawler
 * @param {Object} options
 */
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

/**
 * Transform a resource by changing all links to relative or absolute paths
 *
 * @param {Resource} resource
 * @param {endLogicCallback} callback
 */
BasicTransformer.prototype.logic = function(resource, callback) {
	var self = this;
	if (self.canTransform(resource)) {
		var fetchedUris = [];
		var notFetchedUris = [];
		self.populateUriArrays(resource, fetchedUris, notFetchedUris);
		self.replaceResourceContent(resource, fetchedUris, self.calculateReplacePortionOfFetchedUris);
		self.replaceResourceContent(resource, notFetchedUris, self.calculateReplacePortionOfNotFetchedUris);
	}
	callback(null, resource);
};

/**
 * Check if a resource can be transformed by checking
 * max depth limit and allowable file types rewrite links array
 * @param {Resource} resource
 * @returns {Boolean}
 */
BasicTransformer.prototype.canTransform = function(resource) {
	var self = this;
	return self.policyChecker.isDepthAllowed(resource) && _.some(self.rewriteLinksFileTypes, function(fileType) {
			return helpers.isEmpty(resource.uri.filename()) || resource.uri.suffix() === fileType;
		});
};

/**
 * Find links from a resource content using regex and
 * populate fetchedUris by fetched links and
 * notFetchedUris by not fetched links
 *
 * @param {Resource} resource
 * @param {String[]} fetchedUris
 * @param {String[]} notFetchedUris
 */
BasicTransformer.prototype.populateUriArrays = function(resource, fetchedUris, notFetchedUris) {
	var self = this;
	_.each(discoverRegex, function(regex) {
		var regexUrisDictionary = self.createRegexUrisDictionary(resource, regex);
		_.each(_.keys(regexUrisDictionary[regex]), function(match) {
			var uri = regexUrisDictionary[regex][match][1];
			if (helpers.isEmpty(uri) || self.isUriBlackListed(uri)) {
				return;
			}
			var uriObj = new URI(uri);
			if (uriObj.is('urn')) {
				return;
			}
			try {
				self.isUriAllowedByPolicyChecker(resource, uriObj) ?
					fetchedUris.push(regexUrisDictionary[regex][match]) :
					notFetchedUris.push(regexUrisDictionary[regex][match]);
			} catch (e) {
				self.crawler.emit(util.format('%serror', self.workType), resource, uri, e);
			}
		});
	});
};

/**
 * Create a regex to uris dictionary used by populateUriArrays() to later populate uri arrays
 *
 * @param {Resource} resource
 * @param {RegExp} regex
 * @returns {Array}
 */
BasicTransformer.prototype.createRegexUrisDictionary = function(resource, regex) {
	var regexUrisDictionary = [];
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
	return regexUrisDictionary;
};

/**
 * Check if uri is blacklisted
 *
 * @param {String} uri
 * @returns {Boolean}
 */
BasicTransformer.prototype.isUriBlackListed = function(uri) {
	return _.some(blackListUris, function(blackListUri) {
		return uri.startsWith(blackListUri);
	});
};

/**
 * Check if the uriObj is allowed to be fetched by the policy checker
 *
 * @param {Resource} resource
 * @param {URI} uriObj
 * @returns {Boolean}
 */
BasicTransformer.prototype.isUriAllowedByPolicyChecker = function(resource, uriObj) {
	var self = this;
	var normalizedUri = helpers.normalizeUri(URI.parse(uriObj.absoluteTo(resource.uri).toString()));
	return self.policyChecker.isProtocolAllowed(normalizedUri.protocol()) &&
		self.policyChecker.isFileTypeAllowed(normalizedUri.suffix()) &&
		self.policyChecker.isHostnameAllowed(normalizedUri.hostname()) &&
		self.policyChecker.isLinkAllowed(normalizedUri.toString());
};

/**
 * Replace found links uris
 *
 * @param {Resource} resource
 * @param {String[]} matches
 * @param {Function} replaceCalculationFunction
 */
BasicTransformer.prototype.replaceResourceContent = function(resource, matches, replaceCalculationFunction) {
	var self = this;
	_.each(matches, function(match) {
		var uri = helpers.customEscapeStringRegexp(match[1]);
		var regex = util.format('%s%s%s', helpers.customEscapeStringRegexp(match[0]), uri, helpers.customEscapeStringRegexp(match[2]));
		var replace = util.format('%s%s%s', match[0], helpers.htmlUriDecode(replaceCalculationFunction.call(self, resource, match[1])), match[2]);
		if (replace !== uri) {
			try {
				resource.content = resource.content.replace(new RegExp(regex, 'ig'), replace);
			} catch (e) {
				self.crawler.emit(util.format('%serror', self.workType), resource, uri, e);
			}
		}
	});
};

/**
 * Calculate the new relative uri path of fetched uris
 *
 * @param {Resource} resource
 * @param {string} uri
 * @returns {String}
 */
BasicTransformer.prototype.calculateReplacePortionOfFetchedUris = function(resource, uri) {
	if (uri === '/') {
		return 'index.html';
	} else {
		var uriObj = new URI(uri);
		uriObj = helpers.normalizeUri(URI.parse(uriObj.absoluteTo(resource.uri).toString()));
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
			calculatedPath = path.join(relativness, uriObj.hostname(), uriObj.directory(), helpers.makeFileNameFromUri(uriObj));
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
				for (var k = 0; k < resourceUriDirs.length - sameDirCount; k++) {
					relativness += '../';
				}
				if (newDirPortion === '') {
					relativness = './';
				}
			}
			calculatedPath = path.join(relativness, newDirPortion, helpers.makeFileNameFromUri(uriObj));
		}
		return calculatedPath.replace(/\\/g, '/');
	}
};

/**
 * Calculate the new absolute uri path of not fetched uris
 *
 * @param {Resource} resource
 * @param {String} uri
 * @returns {String}
 */
BasicTransformer.prototype.calculateReplacePortionOfNotFetchedUris = function(resource, uri) {
	return new URI(uri).absoluteTo(resource.uri.toString()).toString();
};

module.exports = BasicTransformer;