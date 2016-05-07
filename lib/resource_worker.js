/**
 * Created by Roy on 26/03/2016.
 */

'use strict';

// core modules
var util              = require('util');

// lib modules
var CrawlerReferencer = require('./crawler_referencer'),
	Resource      = require('./resource');

/**
 * ResourceWorker Class
 *
 * @constructor
 */
function ResourceWorker() {
	throw new Error('cannot instantiate ResourceWorker because it\'s an abstract class');
}

util.inherits(ResourceWorker, CrawlerReferencer);

/**
 * Initialize ResourceWorker
 *
 * @param {Crawler} crawler
 * @param {String} workType
 */
ResourceWorker.init = function(crawler, workType) {
	var self = this;
	CrawlerReferencer.init.call(self, crawler);
	if (!self.workType) {
		self.workType = workType;
	}
};

/**
 *
 * @callback endLogicCallback
 * @param {...*} errorResultAndExtraParams
 */

/**
 * Called by each ResourceWorker instance in the crawling pipeline
 *
 * @param {Resource} resource
 * @param {endLogicCallback} callback
 */
ResourceWorker.prototype.work = function(resource, callback) {
	var self = this;
	if (!(resource instanceof Resource)) {
		throw new TypeError('resource must be of type Resource');
	}
	self.crawler.emit(util.format('%sstart', self.workType), resource);
	self.logic(resource, function() {
		var error = [].shift.apply(arguments);
		if (!error) {
			self.crawler.emit(util.format('%scomplete', self.workType), resource, arguments);
		} else {
			self.crawler.emit(util.format('%serror', self.workType), resource, error);
		}
		callback(error, resource);
	});
};

/**
 * Abstract ResourceWorker logic function implemented differently by different workers
 *
 * @param {Resource} resource
 * @param {endLogicCallback} callback
 */
ResourceWorker.prototype.logic = function(/*eslint-disable no-unused-vars*/resource, callback/*eslint-enable no-unused-vars*/) {
	throw new Error('cannot call abstract method');
};

module.exports = ResourceWorker;