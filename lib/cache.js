/**
 * Created by Roy on 03/01/2016.
 */

'use strict';

// core modules
var util     = require('util'),
    fs       = require('fs');

// npm modules
var nodefs   = require('node-fs'),
    _        = require('underscore'),
    iconv    = require('iconv-lite'),
    URI      = require('urijs');

// lib modules
var Resource = require('./resource');

function Cache() {
    throw new Error('cannot instantiate Cache because it\'s an abstract class');
}

Cache.prototype.save = function(resource, callback) {
    throw new Error('cannot call abstract method');
};

Cache.prototype.retrieve = function(uri) {
    throw new Error('cannot call abstract method');
};

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
    var obj = [];
    obj[resource.uri.toString()] = resource;
    self._rtable.push(obj);
    if (_.isFunction(callback)) {
        callback();
    }
};

MemoryCache.prototype.retrieve = function(uri) {
    var self = this;
    return self._rtable.find(function(element, index, array) {
        return element[uri] != 'undefined';
    })[uri];
};

function FsCache(options) {
    var self = this;
    MemoryCache.call(self);
    FsCache.init.call(self, options);
}

util.inherits(FsCache, MemoryCache);

FsCache.init = function (options) {
    var self = this;
    if (!options) {
        throw new Error('options must be given to construct an FsCache');
    }
    if (!options.rootDir) {
        throw new Error('options must provide rootDir');
    }
    if (typeof options.rootDir != 'string') {
        throw new TypeError('rootDir must be of type string');
    }
    if (!self.rootDir) {
        self.rootDir = options.rootDir;
    }
    nodefs.mkdirSync(self.rootDir, parseInt('0777',8), true);
};

FsCache.prototype.save = function(resource, callback) {
    var self = this;
    var resourceDir = URI.decode(util.format('%s\/%s\/%s', self.rootDir, resource.uri.host(), resource.uri.directory()));
    nodefs.mkdirSync(resourceDir, parseInt('0777', 8), true);
    var resourcePath = URI.decode(util.format('%s\/%s', resourceDir, resource.uri.filename() || 'index.html'));
    var buffer = resource.content;
    if (iconv.encodingExists(resource.encoding)) {
        buffer = iconv.encode(buffer, resource.encoding);
    }
    fs.writeFile(resourcePath , buffer, function(err) {
        if (_.isFunction(callback)) {
            callback(err);
        }
    });
};

module.exports.Cache = Cache;
module.exports.MemoryCache = MemoryCache;
module.exports.FsCache = FsCache;