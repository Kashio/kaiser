/**
 * Created by Roy on 05/02/2016.
 */

'use strict';

// core modules
var util           = require('util');

// lib modules
var ResourceWorker = require('../resource_worker');

/**
 * Abstract Composer Class
 *
 * @constructor
 */
function Composer() {
	throw new Error('cannot instantiate Composer because it\'s an abstract class');
}

util.inherits(Composer, ResourceWorker);

/**
 * Initialize Composer
 *
 * @param {Crawler} crawler
 */
Composer.init = function(crawler) {
	var self = this;
	ResourceWorker.init.call(self, crawler, 'compose');
};

module.exports = Composer;