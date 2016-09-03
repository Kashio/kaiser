/**
 * Created by Roy on 14/05/2016.
 */

// npm modules
var sinon                    = require('sinon'),
    expect                   = require('chai').expect;

// lib modules
var kaiser                   = require('../index'),
	ResourceWorker           = require('../lib/resource_worker'),
	resourceWorkerSpecHelper = require('./resource_worker_spec_helper');

var Discoverer               = kaiser.Discoverer;

describe('Discoverer', function() {
	describe('Discoverer()', function() {
		it('should throw an exception', function() {
			// Validation
			expect(function() {
				new Discoverer();
			}).to.throw(Error, 'cannot instantiate Discoverer because it\'s an abstract class');
		});
	});
	describe('.init()', function() {
		before(function() {
			this.validate = function(crawler, expectedCrawler) {
				Discoverer.init(crawler);
				sinon.assert.calledOnce(ResourceWorker.init);
				sinon.assert.calledWithExactly(ResourceWorker.init, expectedCrawler, 'discover');
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
});