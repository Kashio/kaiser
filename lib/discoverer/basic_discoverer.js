/**
 * Created by Roy on 05/02/2016.
 */

'use strict';

// core modules
var util            = require('util');

// npm modules
var async           = require('async'),
	URI             = require('urijs'),
	_               = require('underscore');

// lib modules
var Discoverer      = require('./discoverer'),
	PolicyChecker   = require('../policy_checker'),
	helpers         = require('../helpers');

var normalizeUri    = helpers.normalizeUri,
	isEmpty         = helpers.isEmpty;

const discoverRegex = [
	/\s(?:src|href)\s*=\s*(?:["']?\s*([^"'>]+)\s*["']?)(?:\s+[^"'>\s]+(?:\s*=\s*["']?[^"'>]*["']?)?)*\s*\/?>/ig,
	/:\s*url\(["']?([^"']*?)["']?\)/ig,
	/((?:(?:https?):\/\/)(?:\S+(?::\S*)?@)?(?:(?!10(?:\.\d{1,3}){3})(?!127(?:\.\d{1,3}){3})(?!169\.254(?:\.\d{1,3}){2})(?!192\.168(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|\[(?:(?:[\da-f]{1,4}:){7}[\da-f]{1,4}|(?:[\da-f]{1,4}:){1,7}:|(?:[\da-f]{1,4}:){1,6}:[\da-f]{1,4}|(?:[\da-f]{1,4}:){1,5}(?::[\da-f]{1,4}){1,2}|(?:[\da-f]{1,4}:){1,4}(?::[\da-f]{1,4}){1,3}|(?:[\da-f]{1,4}:){1,3}(?::[\da-f]{1,4}){1,4}|(?:[\da-f]{1,4}:){1,2}(?::[\da-f]{1,4}){1,5}|[\da-f]{1,4}:(?:(?::[\da-f]{1,4}){1,6})|:(?:(?::[\da-f]{1,4}){1,7}|:)|fe80:(?::[\da-f]{0,4}){0,4}%[\da-z]+|::(?:ffff(?::0{1,4})?:)?(?:(?:25[0-5]|(?:2[0-4]|1?\d)?\d).){3}(?:25[0-5]|(?:2[0-4]|1?\d)?\d)|(?:[\da-f]{1,4}:){1,4}:(?:(?:25[0-5]|(?:2[0-4]|1?\d)?\d).){3}(?:25[0-5]|(?:2[0-4]|1?\d)?\d))\]|localhost|(?:xn--[a-z\d\-]{1,59}|(?:(?:[a-z\u00a1-\uffff\d]+(?:-[a-z\u00a1-\uffff\d]){0,62})))(?:\.(?:xn--[a-z\d\-]{1,59}|(?:[a-z\u00a1-\uffff\d]+(?:-[a-z\u00a1-\uffff\d]){0,62})))*(?:\.(?:xn--[a-z\d\-]{1,59}|(?:[a-z\u00a1-\uffff]{2,63}))))(?::\d{2,5})?(?:\/[^"'()<>\s]*)?)/ig
];

/**
 * Basic Discoverer
 *
 * @param {Crawler} crawler
 * @constructor
 */
function BasicDiscoverer(crawler) {
	var self = this;
	BasicDiscoverer.init.call(self, crawler);
}

util.inherits(BasicDiscoverer, Discoverer);

/**
 * Initialize BasicDiscoverer
 *
 * @param {Crawler} crawler
 */
BasicDiscoverer.init = function(crawler) {
	var self = this;
	Discoverer.init.call(self, crawler);
	if (!self.policyChecker) {
		self.policyChecker = new PolicyChecker(self.crawler);
	}
};

/**
 * Discover new links from the resource
 *
 * @param {Resource} resource
 * @param {endLogicCallback} callback
 */
BasicDiscoverer.prototype.logic = function(resource, callback) {
	var self = this;
	if (self.crawler.isStopping || !self.policyChecker.isDepthAllowed(resource)) {
		callback(null, resource);
	} else {
		async.waterfall([
			async.apply(self.getUris.bind(self), resource),
			self.formatUris.bind(self),
			self.filterUris.bind(self)
		], function (/*eslint-disable no-unused-vars*/err/*eslint-enable no-unused-vars*/, result) {
			callback(null, resource, result);
			if (_.some(result)) {
				var originator = _.clone(resource);
				delete originator.content;
				delete originator.originator;
				self.crawler.crawl(result, originator);
			}
		});
	}
};

/**
 * Find links from a resource content using regex
 *
 * @param {Resource} resource
 * @param {Function} callback
 */
BasicDiscoverer.prototype.getUris = function(resource, callback) {
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

/**
 * Format found links to be used later for crawling
 *
 * @param {Resource} resource
 * @param {String[]} uris
 * @param {Function} callback
 */
BasicDiscoverer.prototype.formatUris = function(resource, uris, callback) {
	var self = this;
	uris = _.chain(uris)
		.map(function(uri) {
			return new URI(uri);
		})
		.filter(function(uri) {
			return !uri.is('urn');
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

/**
 * Filter found links to be used later for crawling
 *
 * @param {String[]} uris
 * @param {Function} callback
 */
BasicDiscoverer.prototype.filterUris = function(uris, callback) {
	var self = this;
	uris = self.filterPolicyCheckNotPassingUris(uris);
	uris = self.filterAnchors(uris);
	uris = self.filterDuplicatedUris(uris);
	callback(null, uris);
};

/**
 * Filter links that do not pass the policy checker
 *
 * @param {String[]} uris
 */
BasicDiscoverer.prototype.filterPolicyCheckNotPassingUris = function(uris) {
	var self = this;
	return _.filter(uris, function(uri) {
		return self.policyChecker.isProtocolAllowed(uri.protocol()) &&
			self.policyChecker.isFileTypeAllowed(uri.suffix()) &&
			self.policyChecker.isHostnameAllowed(uri.hostname) &&
			self.policyChecker.isLinkAllowed(uri.toString());
	});
};

/**
 * Filter links which are anchors
 *
 * @param {String[]} uris
 */
BasicDiscoverer.prototype.filterAnchors = function(uris) {
	return _.filter(uris, function(uri) {
		return isEmpty(uri.fragment());
	});
};

/**
 * Filter duplicated links
 *
 * @param uris
 */
BasicDiscoverer.prototype.filterDuplicatedUris = function(uris) {
	return _.uniq(_.map(uris, function(uri) {
		return uri.toString();
	}));
};

module.exports = BasicDiscoverer;