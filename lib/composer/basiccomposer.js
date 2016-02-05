/**
 * Created by Roy on 05/02/2016.
 */

'use strict';

// core modules
var util     = require('util');

// npm modules
var _        = require('underscore');

// lib modules
var Composer = require('./composer'),
    Resource = require('../resource');

function BasicComposer() {
    var self = this;
}

util.inherits(BasicComposer, Composer);

BasicComposer.prototype.compose = function(uris, originator, callback) {
    var self = this;
    if (!Array.isArray(uris)) {
        uris = [uris];
    }
    _.each(uris, function(uri) {
        if (!_.isString(uri)) {
            throw new TypeError('uris must be of type array of string');
        }
    });
    var resources = _.map(uris, function(uri) {
        return Resource.instance(uri, originator);
    });
    if (_.isFunction(callback)) {
        callback(resources);
    }
};

module.exports = BasicComposer;