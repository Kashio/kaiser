/**
 * Created by Roy on 01/01/2016.
 */

'use strict';

// npm modules
var URI                = require('urijs'),
    escapeStringRegexp = require('escape-string-regexp'),
    _                  = require('underscore');

function normalizeUri(uri) {
    if (!uri.hostname) {
        throw new Error('uri must provide a hostname');
    }
    if (!_.isString(uri.hostname)) {
        throw new TypeError('hostname must be of type string');
    }
    if (isNullOrUndefined(uri.protocol)) {
        uri.protocol = uri.port === 443 ? 'https' : 'http';
    }
    if (!_.isString(uri.protocol)) {
        throw new TypeError('protocol must be of type string');
    }
    if (uri.username && !_.isString(uri.username)) {
        throw new TypeError('username must be of type string');
    }
    if (uri.password && !_.isString(uri.password)) {
        throw new TypeError('password must be of type string');
    }
    if (uri.port && !isInteger(uri.port)) {
        throw new TypeError('port must be of type number and an integer');
    }
    var returnUri = new URI(URI.build(uri));
    if (returnUri.subdomain() === 'www') {
        returnUri.subdomain('');
    }
    return new URI(returnUri.normalize());
}

function isInteger(value) {
    var x;
    return isNaN(value) ? !1 : (x = parseFloat(value), (0 | x) === x);
}

function isEmpty(str) {
    if (!_.isString(str)) {
        throw new TypeError('str must be of type string');
    }
    return (!str || 0 === str.length);
}

function isNullOrUndefined(variable) {
    return _.isUndefined(variable) || _.isNull(variable);
}

function replaceAll(str, find, replace) {
    if (!_.isString(str)) {
        throw new TypeError('str must be of type string');
    }
    if (!_.isString(find)) {
        throw new TypeError('find must be of type string');
    }
    if (!_.isString(replace)) {
        throw new TypeError('replace must be of type string');
    }
    return str.replace(new RegExp(escapeStringRegexp(find), 'ig'), replace);
}

exports.normalizeUri      = normalizeUri;
exports.isInteger         = isInteger;
exports.isEmpty           = isEmpty;
exports.isNullOrUndefined = isNullOrUndefined;
exports.replaceAll        = replaceAll;