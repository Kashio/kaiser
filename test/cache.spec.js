/**
 * Created by Roy on 20/08/2016.
 */

// npm modules
var sinon                    = require('sinon'),
    expect                   = require('chai').expect;

// lib modules
var kaiser                   = require('../index'),
	ResourceWorker           = require('../lib/resource_worker'),
	resourceWorkerSpecHelper = require('./resource_worker_spec_helper');

var Cache                    = kaiser.Cache;

describe('Cache', function() {
	describe('Cache()', function() {
		it('should throw an exception', function() {
			// Validation
			expect(function() {
				new Cache();
			}).to.throw(Error, 'cannot instantiate Cache because it\'s an abstract class');
		});
	});
	describe('.init()', function() {
		before(function() {
			this.validate = function(crawler, expectedCrawler) {
				Cache.init(crawler);
				sinon.assert.calledOnce(ResourceWorker.init);
				sinon.assert.calledWithExactly(ResourceWorker.init, expectedCrawler, 'store');
			};
		});
		beforeEach(resourceWorkerSpecHelper.beforeEach);
		it('should call ResourceWorker.init()', function() {
			// Input arguments
			var crawler = 'crawler';

			// Expected arguments to be passed to ResourceWorker.init
			const expectedCrawler = 'crawler';

			// Validation
			this.validate(crawler, expectedCrawler);
		});
	});
	describe('#retrieve()', function() {
		it('should throw an exception', function() {
			// Validation
			expect(function() {
				Cache.prototype.retrieve();
			}).to.throw(Error, 'cannot call abstract method');
		});
	});
});