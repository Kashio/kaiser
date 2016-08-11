/**
 * Created by Roy on 01/01/2016.
 */

'use strict';

// core modules
var util               = require('util');

// npm modules
var URI                = require('urijs'),
	escapeStringRegexp = require('escape-string-regexp'),
	nrtvhe             = require('nrtv-he'),
	fspvr              = require('fspvr'),
	_                  = require('underscore');

/**
 * Check if variable is null or undefined
 *
 * @param {*} variable
 * @returns {Boolean}
 */
function isNullOrUndefined(variable) {
	return _.isUndefined(variable) || _.isNull(variable);
}

/**
 * Check if number is an integer
 *
 * @param {number} value
 * @returns {Boolean}
 */
function isInteger(value) {
	var x;
	return isNaN(value) ? !1 : (x = parseFloat(value), (0 | x) === x);
}

/**
 * Normalize uri forthe crawling process
 *
 * @param {String} uri
 * @returns {String}
 */
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

/**
 * Check if string is empty
 *
 * @param {String} str
 * @returns {Boolean}
 */
function isEmpty(str) {
	if (!_.isString(str)) {
		throw new TypeError('str must be of type string');
	}
	return (!str || 0 === str.length);
}

/**
 * Custom escaping of regex string
 *
 * @param {String} str
 * @returns {String}
 */
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

/**
 * Decode html uri
 * @param encodedString
 * @returns {String}
 */
function tryUriDecode(encodedString) {
	try {
		encodedString = URI.decode(encodedString);
	} catch (e) {

	}
	return encodedString;
}

/**
 * Decode html entities inside uri
 * @param {String} uri
 * @returns {String}
 */
function htmlUriDecode(uri) {
	return nrtvhe.decode(tryUriDecode(uri));
}

/**
 * Generate filename from a given uri
 * @param {String} uri
 * @returns {String}
 */
function makeFileNameFromUri(uri) {
	var filename = uri.filename();
	var query = uri.query();
	var dotIndex = filename.lastIndexOf('.');
	return fspvr.reformatSegment(filename ?
		util.format('%s%s%s',
			filename.substring(0, dotIndex > -1 ? dotIndex : filename.length),
			(query ? util.format('-%s', htmlUriDecode(query)) : ''),
			(dotIndex > -1 ? util.format('.%s', uri.suffix()) : '')) :
		query ? htmlUriDecode(query) : 'index.html');
}

exports.normalizeUri = normalizeUri;
exports.isInteger = isInteger;
exports.isEmpty = isEmpty;
exports.isNullOrUndefined = isNullOrUndefined;
exports.customEscapeStringRegexp = customEscapeStringRegexp;
exports.makeFileNameFromUri = makeFileNameFromUri;
exports.htmlUriDecode = htmlUriDecode;