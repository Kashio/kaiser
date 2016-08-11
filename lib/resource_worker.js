/**
 * Created by Roy on 26/03/2016.
 */

'use strict';

// core modules
var util              = require('util');

// lib modules
var CrawlerReferencer = require('./crawler_referencer');

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
 * @callback endWorkCallback
 * @param {?*} error
 * @param {Resource} resource
 */

/**
 * Called by each ResourceWorker instance in the crawling pipeline
 *
 * @param {?Resource} resource
 * @param {...*} extraArgs
 * @param {endWorkCallback} callback
 */
ResourceWorker.prototype.work = function(resource) {
	var self = this;
	var workExtraArgs = [].slice.call(arguments, 1, arguments.length - 1);
	var callback = [].slice.call(arguments, arguments.length - 1, arguments.length)[0];
	if (workExtraArgs.length) {
		self.crawler.emit(util.format('%sstart', self.workType), resource, workExtraArgs);
	} else {
		self.crawler.emit(util.format('%sstart', self.workType), resource);
	}
	self.logic(resource, function(error, continuationValue) {
		if (!error) {
			var endLogicCallbackExtraArgs = [].splice.call(arguments, 2, arguments.length);
			if (endLogicCallbackExtraArgs.length) {
				self.crawler.emit(util.format('%scomplete', self.workType), resource, endLogicCallbackExtraArgs);
			} else {
				self.crawler.emit(util.format('%scomplete', self.workType), resource);
			}
		} else {
			self.crawler.emit(util.format('%serror', self.workType), resource, error);
		}
		callback(error, continuationValue);
	}, workExtraArgs);
};

/**
 *
 * @callback endLogicCallback
 * @param {?*} error
 * @param {?*} continuationValue
 * @param {...*} extraArgs
 */

/**
 * Abstract ResourceWorker logic function implemented differently by various workers
 *
 * @param {Resource} resource
 * @param {endLogicCallback} callback
 * @param {*[]=} extraArgs
 */
ResourceWorker.prototype.logic = function(/*eslint-disable no-unused-vars*/resource, callback, extraArgs/*eslint-enable no-unused-vars*/) {
	throw new Error('cannot call abstract method');
};

module.exports = ResourceWorker;