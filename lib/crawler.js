/**
 * Created by Roy on 31/12/2015.
 */

'use strict';

// core modules
var util         = require('util'),
    EventEmitter = require('events');

// npm modules
var request      = require('request');

// lib modules
var helpers      = require('./helpers');

var normalizeUri = helpers.normalizeUri;

/**
 * Expected options object
 * {
 *
 *     proxy : {
 *         protocol : string,
 *         username : string,
 *         password : string,
 *         hostname : string,
 *         port : number
 *     }
 * }
 */

function Crawler(options) {
    var self = this;

    EventEmitter.call(self);

    self.init(options);
}

util.inherits(Crawler, EventEmitter);

Crawler.prototype.init = function(options) {
    var self = this;

    if (!options) {
        throw new Error('options must be given to construct a crawler');
    }

    if (!options.uri) {
        throw new Error('options must provide uri with a hostname');
    }

    if (!self.uri) {
        self.uri = normalizeUri(options.uri);
    }

    if (!self.proxy && options.proxy) {
        self.proxy = normalizeUri(options.proxy);
    }

    if (!self.auth && options.auth) {
        self.auth = options.auth;
    }

    if (options.hasOwnProperty('acceptCookies')) {
        self.acceptCookies = options.acceptCookies;
    } else {
        self.acceptCookies = true;
    }

    if (!self.allowedFileTypes) {
        self.allowedFileTypes = [
            'html',
            'css',
            'js',
            'xml',
            'gif',
            'jpg',
            'jpeg',
            'png',
            'tif',
            'bmp'
        ];
    }

    if (!self.allowedMimeTypes) {
        self.allowedMimeTypes = [
            /^text\/.+$/i,
            /^application\/javascript$/i,
            /^application\/(rss|xhtml)(\+xml)?/i,
            /\/xml$/i,
            /^image\/.+$/i
        ];
    }

    if (!self.disallowedHostNames) {
        self.disallowedHostNames = [

        ];
    }
};

module.exports = Crawler;