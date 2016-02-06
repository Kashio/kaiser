/**
 * Created by Roy on 05/02/2016.
 */

'use strict';

// core modules
var util          = require('util');

// lib modules
var CrawlerHolder = require('../crawlerholder');

function Fetcher() {
    throw new Error('cannot instantiate Fetcher because it\'s an abstract class');
}

util.inherits(Fetcher, CrawlerHolder);

Fetcher.init = function(crawler) {
    var self = this;
    CrawlerHolder.init.call(self, crawler);
};

Fetcher.prototype.fetch = function(resources, callback) {
    throw new Error('cannot call abstract method');
};

module.exports = Fetcher;