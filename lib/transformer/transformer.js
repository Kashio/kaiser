/**
 * Created by Roy on 06/02/2016.
 */

'use strict';

// core modules
var util           = require('util');

// lib modules
var ResourceWorker = require('../resource_worker');

/**
 * Abstract Transformer Class
 *
 * @constructor
 */
function Transformer() {
	throw new Error('cannot instantiate Transformer because it\'s an abstract class');
}

util.inherits(Transformer, ResourceWorker);

/**
 * Initialize Transformer
 *
 * @param {Crawler} crawler
 */
Transformer.init = function(crawler) {
	var self = this;
	ResourceWorker.init.call(self, crawler, 'transform');
};

/**
 * Check if a resource can be transformed
 *
 * @param {Resource} resource
 */
Transformer.prototype.canTransform = function(/*eslint-disable no-unused-vars*/resource/*eslint-enable no-unused-vars*/) {
	throw new Error('cannot call abstract method');
};

module.exports = Transformer;