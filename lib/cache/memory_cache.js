/**
 * Created by Roy on 31/01/2016.
 */

'use strict';

// core modules
var util     = require('util');

// npm modules
var _        = require('underscore');

// lib modules
var Cache    = require('./cache'),
    Resource = require('../resource');

function MemoryCache(crawler) {
    var self = this;
    MemoryCache.init.call(self, crawler);
}

util.inherits(MemoryCache, Cache);

MemoryCache.init = function(crawler) {
    var self = this;
    Cache.init.call(self, crawler);
    if (!self._rtable) {
        self._rtable = [];
    }
};

MemoryCache.prototype.save = function(resource, callback) {
    var self = this;
    Cache.prototype.save.call(self, resource, self.saveLogic, callback);
};

MemoryCache.prototype.saveLogic = function(resource, callback) {
    var self = this;
    self._rtable[resource.uri.toString()] = resource;
    callback();
};

MemoryCache.prototype.retrieve = function(uri) {
    var self = this;
    if (!_.isString(uri)) {
        throw new TypeError('uri must be of type string');
    }
    return self._rtable[uri];
};

module.exports = MemoryCache;
