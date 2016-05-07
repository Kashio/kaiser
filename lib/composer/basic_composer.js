/**
 * Created by Roy on 05/02/2016.
 */

'use strict';

// core modules
var util         = require('util');

// npm modules
var _            = require('underscore');

// lib modules
var Composer     = require('./composer'),
	Resource     = require('../resource');

/**
 * Basic Composer
 *
 * @param {Cralwer} crawler
 * @constructor
 */
function BasicComposer(crawler) {
	var self = this;
	BasicComposer.init.call(self, crawler);
}

util.inherits(BasicComposer, Composer);

/**
 * Initialize BasicComposer
 *
 * @param {Cralwer} crawler
 */
BasicComposer.init = function(crawler) {
	var self = this;
	Composer.init.call(self, crawler);
};

/**
 * Compose a resource out of uris array and originator resource
 *
 * @param {String[]} uris
 * @param {?Resource} originator
 * @param {endComposeCallback} callback
 */
BasicComposer.prototype.compose = function(uris, originator, callback) {
	var self = this;
	if (!Array.isArray(uris)) {
		uris = [uris];
	}
	var resources = _.chain(uris)
		.filter(function(uri) {
			return _.isString(uri);
		})
		.map(function(uri) {
			self.crawler.emit('composestart', uri, originator);
			var resource = Resource.instance(uri, originator);
			self.crawler.emit('composecomplete', uri, originator, resource);
			return resource;
		})
		.value();
	callback(null, resources);
};

module.exports = BasicComposer;