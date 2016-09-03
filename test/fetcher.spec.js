/**
 * Created by Roy on 14/05/2016.
 */

// npm modules
var sinon                   = require('sinon'),
    expect                  = require('chai').expect;

// lib modules
var kaiser                  = require('../index'),
	ResourceWorker          = require('../lib/resource_worker'),
	resourcWorkerSpecHelper = require('./resource_worker_spec_helper');

var Fetcher                 = kaiser.Fetcher;

describe('Fetcher', function() {
	describe('Fetcher()', function() {
		it('should throw an exception', function() {
			// Validation
			expect(function() {
				new Fetcher();
			}).to.throw(Error, 'cannot instantiate Fetcher because it\'s an abstract class');
		});
	});
	describe('.init()', function() {
		before(function() {
			this.validate = function(crawler, expectedCrawler) {
				Fetcher.init(crawler);
				sinon.assert.calledOnce(ResourceWorker.init);
				sinon.assert.calledWithExactly(ResourceWorker.init, expectedCrawler, 'fetch');
			};
		});
		beforeEach(resourcWorkerSpecHelper.beforeEach);
		it('should call ResourceWorker.init()', function() {
			// Input arguments
			var crawler = 'crawler';

			// Expected arguments to be passed to ResourceWorker.init
			const expectedCrawler = 'crawler';

			// Validation
			this.validate(crawler, expectedCrawler);
		});
	});
});