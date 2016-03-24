/**
 * Created by Roy on 01/01/2016.
 */

'use strict';

// core modules
var util               = require('util'),
    path               = require('path');

// npm modules
var URI                = require('urijs'),
    escapeStringRegexp = require('escape-string-regexp'),
    nrtvhe             = require('nrtv-he'),
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
    while (returnUri.toString() !== '') {
        try {
            returnUri = new URI(returnUri.normalize().toString());
        } catch (e) {
            returnUri = new URI(returnUri.toString().slice(0, -1));
            continue;
        }
        try {
            returnUri = new URI(nrtvhe.decode(URI.decode(returnUri.toString())));
            break;
        } catch (e) {
            throw e;
        }
    }
    return returnUri;
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

function customEscapeStringRegexp(str) {
    str = escapeStringRegexp(str);
    var charactersToEscape = [
        '/'
        //'(',
        //')',
        //'[',
        //']',
        //'{',
        //'}',
        //'^',
        //'$',
        //'.'
    ];
    for (var i = 0; i < charactersToEscape.length; i++) {
        var regex = util.format('(\\%s)', charactersToEscape[i]);
        str = str.replace(new RegExp(regex, 'ig'), '\\$1')
    }
    return str;
}

function makeFileNameFromUri(uri) {
    var filename = uri.filename();
    var query = uri.query();
    var dotIndex = filename.lastIndexOf('.');
    return filename ?
        util.format('%s%s%s',
            filename.substring(0, dotIndex > -1 ? dotIndex : filename.length),
            (query ? util.format('-%s', htmlUriDecode(query)) : ''),
            (dotIndex > -1 ? util.format('.%s', uri.suffix()) : '')) :
        query ? query : 'index.html';
}

function makeValidFsPath(fsPath) {
    if (!_.isString(fsPath)) {
        throw new TypeError('fsPath must be of type string');
    }
    var segments = fsPath.substring(fsPath.indexOf(path.sep) + 1).split(path.sep);
    for(var i = 0; i < segments.length; i++) {
        fsPath = fsPath.replace(segments[i], makeValidFsObjectName(segments[i]));
    }
    return fsPath;
}

function makeValidFsObjectName(name) {
    if (!_.isString(name)) {
        throw new TypeError('name must be of type string');
    }
    return name
        .replace(/[/?<>\\,:*|"]/g, '')
        .replace(/CON|PRN|AUX|CLOCK\$|NUL|COM[1-9]|LPT[1-9]/ig, 'DEVICE_NAME')
        .replace(/(?:[.\s]+)$/, '');
}

function htmlUriDecode(uri) {
    return nrtvhe.decode(tryUriDecode(uri));
}

function tryUriDecode(encodedString) {
    try {
        encodedString = URI.decode(encodedString);
    } catch(e) {

    }
    return encodedString;
}

exports.normalizeUri             = normalizeUri;
exports.isInteger                = isInteger;
exports.isEmpty                  = isEmpty;
exports.isNullOrUndefined        = isNullOrUndefined;
exports.replaceAll               = replaceAll;
exports.customEscapeStringRegexp = customEscapeStringRegexp;
exports.makeFileNameFromUri      = makeFileNameFromUri;
exports.makeValidFsPath          = makeValidFsPath;
exports.htmlUriDecode            = htmlUriDecode;