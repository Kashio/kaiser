/**
 * Created by Roy on 31/01/2016.
 */

'use strict';

// core modules
var util        = require('util'),
    fs          = require('fs'),
    path        = require('path');

// npm modules
var nodefs      = require('node-fs'),
    _           = require('underscore'),
    iconv       = require('iconv-lite'),
    URI         = require('urijs');

// lib modules
var MemoryCache = require('./memorycache');

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
    if (!_.isString(options.rootDir)) {
        throw new TypeError('rootDir must be of type string');
    }
    if (!self.rootDir) {
        self.rootDir = path.resolve(options.rootDir);
    }
    nodefs.mkdirSync(self.rootDir, parseInt('0777', 8), true);
};

FsCache.prototype.save = function(resource, callback) {
    var self = this;
    MemoryCache.prototype.save.call(self, resource);
    var resourceDir = URI.decode(path.join(self.rootDir, resource.uri.host(), resource.uri.directory()));
    nodefs.mkdirSync(resourceDir, parseInt('0777', 8), true);
    var resourcePath = URI.decode(path.join(resourceDir, resource.uri.filename() ?
        util.format('%s%s%s', resource.uri.filename(), resource.uri.search(), resource.uri.hash()) :
        'index.html'));
    var buffer = iconv.encodingExists(resource.encoding) ?
        iconv.encode(resource.content, resource.encoding) :
        resource.content;
    fs.writeFile(resourcePath , buffer, function(err) {
        if (_.isFunction(callback)) {
            callback(err);
        }
    });
};

module.exports = FsCache;
