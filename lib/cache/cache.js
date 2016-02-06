/**
 * Created by Roy on 03/01/2016.
 */

'use strict';

// core modules
var util          = require('util');

// npm modules
var _             = require('underscore');

// lib modules
var CrawlerHolder = require('../crawlerholder'),
    Resource      = require('../resource');

function Cache() {
    throw new Error('cannot instantiate Cache because it\'s an abstract class');
}

util.inherits(Cache, CrawlerHolder);

Cache.init = function(crawler) {
    var self = this;
    CrawlerHolder.init.call(self, crawler);
};

Cache.prototype.save = function(resource, saveLogic, callback) {
    var self = this;
    if (!(resource instanceof Resource)) {
        throw new TypeError('resource must be of type Resource');
    }
    self.crawler.emit('storestart', resource);
    saveLogic.call(self, resource, function(err) {
        if (!err) {
            self.crawler.emit('storecomplete', resource);
            callback(null, resource);
        } else {
            self.crawler.emit('storeerror', resource, err);
            callback(err, resource);
        }
    });
};

Cache.prototype.retrieve = function(uri) {
    throw new Error('cannot call abstract method');
};

module.exports = Cache;