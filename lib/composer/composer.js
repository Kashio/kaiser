/**
 * Created by Roy on 05/02/2016.
 */

'use strict';

// core modules
var util          = require('util');

// lib modules
var CrawlerReferencer = require('../crawler_referencer');

function Composer() {
    throw new Error('cannot instantiate Composer because it\'s an abstract class');
}

Composer.init = function(crawler) {
    var self = this;
    CrawlerReferencer.init.call(self, crawler);
};

Composer.prototype.compose = function(uris, originator, callback) {
    throw new Error('cannot call abstract method');
};

module.exports = Composer;