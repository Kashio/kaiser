/**
 * Created by Roy on 05/02/2016.
 */

'use strict';

// core modules
var util            = require('util');

// npm modules
var URI             = require('urijs'),
	_               = require('underscore'),
	nrtvhe          = require('nrtv-he');

// lib modules
var Discoverer      = require('./discoverer'),
	PolicyChecker   = require('../policy_checker'),
	helpers         = require('../helpers');

var discoverRegex = [
	/\s(?:src|href)\s*=\s*(?:["']?\s*([^"'>]+)\s*["']?)[^>]*>/ig,
	/:\s*url\(["']?([^"']*?)["']?\)/ig,
	/((?:(?:https?):\/\/)(?:\S+(?::\S*)?@)?(?:(?!10(?:\.\d{1,3}){3})(?!127(?:\.\d{1,3}){3})(?!169\.254(?:\.\d{1,3}){2})(?!192\.168(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|\[(?:(?:[\da-f]{1,4}:){7}[\da-f]{1,4}|(?:[\da-f]{1,4}:){1,7}:|(?:[\da-f]{1,4}:){1,6}:[\da-f]{1,4}|(?:[\da-f]{1,4}:){1,5}(?::[\da-f]{1,4}){1,2}|(?:[\da-f]{1,4}:){1,4}(?::[\da-f]{1,4}){1,3}|(?:[\da-f]{1,4}:){1,3}(?::[\da-f]{1,4}){1,4}|(?:[\da-f]{1,4}:){1,2}(?::[\da-f]{1,4}){1,5}|[\da-f]{1,4}:(?:(?::[\da-f]{1,4}){1,6})|:(?:(?::[\da-f]{1,4}){1,7}|:)|fe80:(?::[\da-f]{0,4}){0,4}%[\da-z]+|::(?:ffff(?::0{1,4})?:)?(?:(?:25[0-5]|(?:2[0-4]|1?\d)?\d).){3}(?:25[0-5]|(?:2[0-4]|1?\d)?\d)|(?:[\da-f]{1,4}:){1,4}:(?:(?:25[0-5]|(?:2[0-4]|1?\d)?\d).){3}(?:25[0-5]|(?:2[0-4]|1?\d)?\d))\]|localhost|(?:xn--[a-z\d\-]{1,59}|(?:[a-z\u00a1-\uffff\d]+(?:-[a-z\u00a1-\uffff\d]){0,62}))(?:\.(?:xn--[a-z\d\-]{1,59}|(?:[a-z\u00a1-\uffff\d]+(?:-[a-z\u00a1-\uffff\d]){0,62})))*(?:\.(?:xn--[a-z\d\-]{1,59}|(?:[a-z\u00a1-\uffff]{2,63}))))(?::\d{2,5})?(?:\/[^"'()<>\s]*)?)/ig
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
		resource.content = nrtvhe.decode(resource.content);
		var uris = self.getUris(resource);
		uris = self.formatUris(resource, uris);
		uris = self.filterUris(uris);
		if (_.some(uris)) {
			var originator = _.clone(resource);
			delete originator.content;
			delete originator.originator;
			self.crawler.crawl(uris, originator);
		}
		callback(null, resource, uris);
	}
};

/**
 * Find links from a resource content using regex
 *
 * @param {Resource} resource
 */
BasicDiscoverer.prototype.getUris = function(resource) {
	var uris = [];
	_.each(discoverRegex, function(regex) {
		var matches = resource.content.match(regex);
		_.each(matches, function(match) {
			var result = regex.exec(match);
			regex.lastIndex = 0;
			uris.push(result[result.length - 1]);
		});
	});
	return uris;
};

/**
 * Format found links to be used later for crawling
 *
 * @param {Resource} resource
 * @param {String[]} uris
 */
BasicDiscoverer.prototype.formatUris = function(resource, uris) {
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
				return helpers.normalizeUri(URI.parse(uri.absoluteTo(resource.uri).toString()));
			} catch (e) {
				self.crawler.emit(util.format('%serror', self.workType), resource, uri, e);
				return null;
			}
		})
		.filter(function(uri) {
			return uri !== null;
		})
		.value();
	return uris;
};

/**
 * Filter found links to be used later for crawling
 *
 * @param {String[]} uris
 */
BasicDiscoverer.prototype.filterUris = function(uris) {
	var self = this;
	uris = self.filterPolicyCheckNotPassingUris(uris);
	uris = self.filterAnchors(uris);
	uris = self.filterDuplicatedUris(uris);
	return uris;
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
		return helpers.isEmpty(uri.fragment());
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