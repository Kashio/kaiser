/**
 * Created by Roy on 31/01/2016.
 */

'use strict';

// core modules
var util                = require('util'),
	fs                  = require('fs'),
	path                = require('path');

// npm modules
var nodefs              = require('node-fs'),
	_                   = require('underscore'),
	iconv               = require('iconv-lite'),
	URI                 = require('urijs');

// lib modules
var MemoryCache         = require('./memory_cache'),
	helpers             = require('../helpers');

var makeFileNameFromUri = helpers.makeFileNameFromUri,
	makeValidFsPath     = helpers.makeValidFsPath;

/**
 * Filesystem Cache
 *
 * @param {Crawler} crawler
 * @param {Object} options
 * @constructor
 */
function FsCache(crawler, options) {
	var self = this;
	MemoryCache.call(self, crawler);
	FsCache.init.call(self, options);
}

util.inherits(FsCache, MemoryCache);

/**
 * Initialize FsCache
 *
 * @param {Object} options
 */
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

/**
 * Save resource as a file to the filesystem
 *
 * @param {Resource} resource
 * @param {endLogicCallback} callback
 */
FsCache.prototype.logic = function(resource, callback) {
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
	var resourceDir = self.tryMakeResourceDir(resource);
	var resourcePath = makeValidFsPath(path.join(resourceDir, makeFileNameFromUri(resource.uri)));
	var buffer = iconv.encodingExists(resource.encoding) ?
		iconv.encode(resource.content, resource.encoding) :
		resource.content;
	fs.writeFile(resourcePath, buffer, callback);
};

/**
 * Attempt making resource dir
 *
 * @param {Resource} resource
 * @returns {String}
 */
FsCache.prototype.tryMakeResourceDir = function(resource) {
	var self = this;
	var resourceDir = URI.decode(path.join(self.rootDir, resource.uri.hostname(), resource.uri.directory()));
	while (resourceDir !== '') {
		try {
			nodefs.mkdirSync(resourceDir, parseInt('0777', 8), true);
			break;
		} catch (e) {
			resource.uri = new URI(resource.uri.toString().slice(0, -1));
			resourceDir = URI.decode(path.join(self.rootDir, resource.uri.host(), resource.uri.directory()));
		}
	}
	return makeValidFsPath(resourceDir);
};

module.exports = FsCache;