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
 * @param {Crawler} crawler
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
 * @param {Crawler} crawler
 */
BasicComposer.init = function(crawler) {
	var self = this;
	Composer.init.call(self, crawler);
};

/**
 * Compose a resource out of uris array and originator resource
 *
 * @param {Resource} resource
 * @param {endLogicCallback} callback
 * @param {*[]=} extraArgs
 */
BasicComposer.prototype.logic = function(resource, callback, extraArgs) {
	var resources = _.chain(extraArgs[0])
		.filter(function(uri) {
			return _.isString(uri);
		})
		.map(function(uri) {
			return Resource.instance(uri, resource);
		})
		.value();
	callback(null, resources);
};

module.exports = BasicComposer;