/**
 * Created by Roy on 05/02/2016.
 */

'use strict';

// core modules
var util          = require('util');

// lib modules
var ResourceWorker = require('../resource_worker');

function Discoverer() {
    throw new Error('cannot instantiate Discoverer because it\'s an abstract class');
}

util.inherits(Discoverer, ResourceWorker);

Discoverer.init = function(crawler) {
    var self = this;
    ResourceWorker.init.call(self, crawler, 'discover');
};

module.exports = Discoverer;