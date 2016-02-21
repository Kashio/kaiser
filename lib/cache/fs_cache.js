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
var Cache       = require('./cache'),
    MemoryCache = require('./memory_cache');

function FsCache(crawler, options) {
    var self = this;
    MemoryCache.call(self, crawler);
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
    Cache.prototype.save.call(self, resource, self.saveLogic, callback);
};

FsCache.prototype.saveLogic = function(resource, callback) {
    var self = this;
    //MemoryCache.prototype.saveLogic.call(self, resource, function() {
        //var resourceDir = URI.decode(path.join(self.rootDir, resource.uri.host(), resource.uri.directory()));
        //try {
        //    nodefs.mkdirSync(resourceDir, parseInt('0777', 8), true);
        //    var resourcePath = URI.decode(path.join(resourceDir, resource.uri.filename() ?
        //        resource.uri.filename() :
        //        'index.html'));
        //    var buffer = iconv.encodingExists(resource.encoding) ?
        //        iconv.encode(resource.content, resource.encoding) :
        //        resource.content;
        //    fs.writeFile(resourcePath , buffer, callback);
        //} catch (e) {
        //    console.log(e);
        //}
        //var resourceDir = self.tryMakeResourceDir(resource);
        //var resourcePath = URI.decode(path.join(resourceDir, resource.uri.filename() ?
        //    resource.uri.filename() :
        //    'index.html'));
        //resourcePath = resourcePath.replace(/\.*$'/, '');
        //var buffer = iconv.encodingExists(resource.encoding) ?
        //    iconv.encode(resource.content, resource.encoding) :
        //    resource.content;
        //fs.writeFile(resourcePath , buffer, callback);
    //});
    if (!/^\s+$/.test(resource.uri.filename())) { // No named files
        var resourceDir = self.tryMakeResourceDir(resource);
        var resourcePath = URI.decode(path.join(resourceDir, resource.uri.filename() ?
            resource.uri.filename() :
            'index.html'));
        var buffer = iconv.encodingExists(resource.encoding) ?
            iconv.encode(resource.content, resource.encoding) :
            resource.content;
        fs.writeFile(resourcePath, buffer, callback);
    }
};

FsCache.prototype.tryMakeResourceDir = function(resource) {
    var self = this;
    var forbiddenNames = ['CON', 'PRN', 'AUX', 'CLOCK$', 'NUL', 'COM1', 'COM2', 'COM3',
        'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9', 'LPT1', 'LPT2',
        'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7','LPT8', 'LPT9'];
    var resourceDir = URI.decode(path.join(self.rootDir, resource.uri.host(), resource.uri.directory()));
    if (_.intersection(resourceDir.split('/'), forbiddenNames).length) {
        return '';
    }
    while (resourceDir !== '') {
        try {
            nodefs.mkdirSync(resourceDir, parseInt('0777', 8), true);
            break;
        } catch(e) {
            resource.uri = new URI(resource.uri.toString().slice(0, -1));
            resourceDir = URI.decode(path.join(self.rootDir, resource.uri.host(), resource.uri.directory()));
        }
    }
    return resourceDir;
};

module.exports = FsCache;
