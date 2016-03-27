/**
 * Created by Roy on 05/02/2016.
 */

'use strict';

// core modules
var util          = require('util');

// lib modules
var ResourceWorker = require('../resource_worker');

function Fetcher() {
    throw new Error('cannot instantiate Fetcher because it\'s an abstract class');
}

util.inherits(Fetcher, ResourceWorker);

Fetcher.init = function(crawler) {
    var self = this;
    ResourceWorker.init.call(self, crawler, 'fetch');
};

module.exports = Fetcher;