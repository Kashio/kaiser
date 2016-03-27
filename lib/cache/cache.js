/**
 * Created by Roy on 03/01/2016.
 */

'use strict';

// core modules
var util          = require('util');

// lib modules
var ResourceWorker = require('../resource_worker');

function Cache() {
    throw new Error('cannot instantiate Cache because it\'s an abstract class');
}

util.inherits(Cache, ResourceWorker);

Cache.init = function(crawler) {
    var self = this;
    ResourceWorker.init.call(self, crawler, 'store');
};

Cache.prototype.retrieve = function(uri) {
    throw new Error('cannot call abstract method');
};

module.exports = Cache;