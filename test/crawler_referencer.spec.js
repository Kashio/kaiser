/**
 * Created by Roy on 10/09/2016.
 */

// npm modules
var chai                     = require('chai'),
	sinon                    = require('sinon'),
	expect                   = chai.expect;

// lib modules
var CrawlerReferencer        = require('../lib/crawler_referencer');

require('./spec_helper');

chai.should();

describe('CrawlerReferencer', function() {
	describe('CrawlerReferencer()', function () {
		it('should throw an exception', function () {
			// Validation
			expect(function () {
				new CrawlerReferencer();
			}).to.throw(Error, 'cannot instantiate CrawlerReferencer because it\'s an abstract class');
		});
	});
	describe('.init()', function() {
		before(function() {
			this.validate = function(crawlerReferencer, crawler, expectedCrawler) {
				CrawlerReferencer.init.call(crawlerReferencer, crawler);
				sinon.assert.calledOnce(CrawlerReferencer.init);
				sinon.assert.calledWithExactly(CrawlerReferencer.init, crawler);
				crawlerReferencer.crawler.should.be.equal(expectedCrawler);
			};
		});
		beforeEach(function() {
			this.sinon.spy(CrawlerReferencer, 'init');
		});
		it('should initialize CrawlerReferencer instance with default parameters', function() {
			// Input arguments
			var crawlerReferencer = {};
			var crawler = 'crawler';

			// Expected arguments to be passed to CrawlerReferencer.init
			const expectedCrawler = 'crawler';

			// Validation
			this.validate(crawlerReferencer, crawler, expectedCrawler);
		});
	});
});