/**
 * Created by Roy on 06/02/2016.
 */

'use strict';

// core modules
var util          = require('util');

// lib modules
var CrawlerHolder = require('../crawlerholder');

function Transformer() {
    throw new Error('cannot instantiate Transformer because it\'s an abstract class');
}

util.inherits(Transformer, CrawlerHolder);

Transformer.init = function(crawler) {
    var self = this;
    CrawlerHolder.init.call(self, crawler);
};

Transformer.prototype.transform = function(resource, callback) {
    throw new Error('cannot call abstract method');
};

Transformer.prototype.canTransform = function(resource) {
    throw new Error('cannot call abstract method');
};

module.exports = Transformer;