/**
 * Created by Roy on 26/03/2016.
 */

'use strict';

// core modules
var util          = require('util');

// lib modules
var CrawlerHolder = require('./crawlerholder'),
    Resource      = require('./resource');

function ResourceWorker() {
    throw new Error('cannot instantiate ResourceWorker because it\'s an abstract class');
}

util.inherits(ResourceWorker, CrawlerHolder);

ResourceWorker.init = function(crawler, workType) {
    var self = this;
    CrawlerHolder.init.call(self, crawler);
    if (!self.workType) {
        self.workType = workType;
    }
};

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

ResourceWorker.prototype.logic = function(resource, callback) {
    throw new Error('cannot call abstract method');
};

module.exports = ResourceWorker;