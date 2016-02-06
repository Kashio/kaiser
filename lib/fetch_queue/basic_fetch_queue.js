/**
 * Created by Roy on 06/02/2016.
 */

'use strict';

// core modules
var util         = require('util');

// npm modules
var _            = require('underscore');

// lib modules
var FetchQueue    = require('./fetch_queue'),
    Resource     = require('../resource');

function BasicFetchQueue() {
    var self = this;
    BasicFetchQueue.init.call(self);
}

util.inherits(BasicFetchQueue, FetchQueue);

BasicFetchQueue.init = function() {
    var self = this;
    if (!self.fetchedUris) {
        self.fetchedUris = [];
    }
};

BasicFetchQueue.prototype.queue = function(resources, callback) {
    var self = this;
    _.each(_.filter(resources, function(resource) {
        return resource instanceof Resource;
    }), function(resource) {
        self.fetchedUris.push(resource.uri.toString());
    });
    callback(null, resources);
};

BasicFetchQueue.prototype.exists = function(uri, callback) {
    var self = this;
    return _.some(self.fetchedUris, function(fetchedUri) {
        return fetchedUri === uri;
    });
};

module.exports = BasicFetchQueue;