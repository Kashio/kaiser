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

function MemoryCache() {
    var self = this;
    MemoryCache.init.call(self);
}

util.inherits(MemoryCache, Cache);

MemoryCache.init = function() {
    var self = this;
    if (!self._rtable) {
        self._rtable = [];
    }
};

MemoryCache.prototype.save = function(resource, callback) {
    var self = this;
    if (!(resource instanceof Resource)) {
        throw new TypeError('resource must be of type Resource');
    }
    self._rtable[resource.uri.toString()] = resource;
    if (_.isFunction(callback)) {
        callback();
    }
};

MemoryCache.prototype.retrieve = function(uri) {
    var self = this;
    if (!_.isString(uri)) {
        throw new TypeError('uri must be of type string');
    }
    return self._rtable[uri];
};

module.exports = MemoryCache;
