/**
 * Created by Roy on 05/02/2016.
 */

'use strict';

// core modules
var util          = require('util');

// lib modules
var CrawlerHolder = require('../crawlerholder');

function Discoverer() {
    throw new Error('cannot instantiate Discoverer because it\'s an abstract class');
}

util.inherits(Discoverer, CrawlerHolder);

Discoverer.init = function(crawler) {
    var self = this;
    CrawlerHolder.init.call(self, crawler);
};

Discoverer.prototype.discover = function(resource, callback) {
    throw new Error('cannot call abstract method');
};

module.exports = Discoverer;