/**
 * Created by Roy on 05/02/2016.
 */

// lib modules
var Crawler = require('./crawler');

function CrawlerHolder() {
    throw new Error('cannot instantiate CrawlerHolder because it\'s an abstract class');
}

CrawlerHolder.init = function(crawler) {
    var self = this;
    //if (!(crawler instanceof Crawler)) {
    //    throw new TypeError('crawler must be of type Crawler')
    //}
    if (!self.crawler) {
        self.crawler = crawler;
    }
};

module.exports = CrawlerHolder;