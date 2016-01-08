/**
 * Created by Roy on 01/01/2016.
 */

'use strict';

// npm modules
var URI          = require('urijs');

function normalizeUri(uri) {
    if (!uri.hostname) {
        throw new Error('uri must provide a hostname');
    }
    if (typeof uri.hostname != 'string') {
        throw new TypeError('hostname must be of type string');
    }
    uri.protocol = uri.protocol || uri.port === 443 ? 'https' : 'http';
    if (typeof uri.protocol != 'string') {
        throw new TypeError('protocol must be of type string');
    }
    if (uri.username && typeof uri.username != 'string') {
        throw new TypeError('username must be of type string');
    }
    if (uri.password && typeof uri.password != 'string') {
        throw new TypeError('password must be of type string');
    }
    if (uri.port && !isInteger(uri.port)) {
        throw new TypeError('port must be of type number and an integer');
    }
    var returnUri = new URI(URI.build(uri));
    if (returnUri.subdomain() === 'www') {
        returnUri.subdomain('');
    }
    return returnUri.normalize().toString();
}

function isInteger(value) {
    var x;
    return isNaN(value) ? !1 : (x = parseFloat(value), (0 | x) === x);
}

function isEmpty(str) {
    if (typeof str != 'string') {
        throw new TypeError('str must be of type string');
    }
    return (!str || 0 === str.length);
}

function isNullOrUndefined(variable) {
    return variable === undefined || variable === null;
}

exports.normalizeUri      = normalizeUri;
exports.isInteger         = isInteger;
exports.isEmpty           = isEmpty;
exports.isNullOrUndefined = isNullOrUndefined;