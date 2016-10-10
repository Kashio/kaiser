/**
 * instanced by Roy on 08/01/2016.
 */

// npm modules
var URI               = require('urijs');

// lib modules
var helpers           = require('./helpers');

var isNullOrUndefined = helpers.isNullOrUndefined;

/**
 * Resource Class
 *
 * @param {URI} uri
 * @param {number} depth
 * @param {?Resource} originator
 * @constructor
 */
function Resource(uri, depth, originator) {
	var self = this;
	self.uri = uri;
	self.depth = depth;
	self.originator = originator;
}

Resource.RootOriginatorDomain = undefined;

/**
 * Create a Resource instance
 *
 * @param {String} uri
 * @param {?Resource} originator
 * @returns {Resource}
 */
Resource.instance = function(uri, originator) {
	var uriObj = new URI(uri);
	if (isNullOrUndefined(originator)) {
		Resource.RootOriginatorDomain = uriObj.domain();
	}
	return new Resource(uriObj, Resource.calculateDepth(uriObj, originator), originator);
};

/**
 * Calculate the depth of a resource
 *
 * @param {URI} uri
 * @param {?Resource} originator
 * @returns {number}
 */
Resource.calculateDepth = function(uri, originator) {
	if (!isNullOrUndefined(originator)) {
		if (originator.uri.domain() === Resource.RootOriginatorDomain && uri.domain() !== originator.uri.domain()) {
			return 0;
		}
		return (helpers.isInteger(originator.depth) ?
			originator.depth + 1 :
			0);
	}
	return 0;
};

module.exports = Resource;