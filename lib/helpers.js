/**
 * Created by Roy on 01/01/2016.
 */

'use strict';

// npm modules
var URI        = require('urijs');

function normalizeUri(uri) {
    if (!uri.hostname) {
        throw new Error('uri must provide a hostname');
    }
    if (typeof uri.hostname != 'string') {
        throw new Error('hostname must be of type string');
    }
    uri.protocol = uri.protocol || uri.port === 443 ? 'https' : 'http';
    if (typeof uri.protocol != 'string') {
        throw new Error('protocol must be of type string');
    }
    if (uri.username && typeof uri.username != 'string') {
        throw new Error('username must be of type string');
    }
    if (uri.password && typeof uri.password != 'string') {
        throw new Error('password must be of type string');
    }
    if (uri.port && !isInteger(uri.port)) {
        throw new Error('port must be of type number and an integer');
    }
    return new URI(URI.build(uri)).normalize().toString();
}

function isInteger(value) {
    var x;
    return isNaN(value) ? !1 : (x = parseFloat(value), (0 | x) === x);
}

exports.normalizeUri = normalizeUri;
exports.isInteger    = isInteger;