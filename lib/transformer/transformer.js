/**
 * Created by Roy on 06/02/2016.
 */

'use strict';

// core modules
var util          = require('util');

// lib modules
var ResourceWorker = require('../resource_worker');

function Transformer() {
    throw new Error('cannot instantiate Transformer because it\'s an abstract class');
}

util.inherits(Transformer, ResourceWorker);

Transformer.init = function(crawler) {
    var self = this;
    ResourceWorker.init.call(self, crawler, 'transform');
};

Transformer.prototype.canTransform = function(resource) {
    throw new Error('cannot call abstract method');
};

module.exports = Transformer;