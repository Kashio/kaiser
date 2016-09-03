/**
 * Created by Roy on 03/09/2016.
 */

// npm modules
var chai                     = require('chai'),
	sinon                    = require('sinon');

// lib modules
require('./spec_helper');

var PolicyChecker           = require('../lib/policy_checker'),
	CrawlerReferencer       = require('../lib/crawler_referencer');

chai.should();

describe('PolicyChecker', function() {
	describe('PolicyChecker()', function() {
		before(function() {
			this.validate = function(crawler, expectedCrawler) {
				new PolicyChecker(crawler);

				sinon.assert.calledOnce(PolicyChecker.init);
				sinon.assert.calledWithExactly(PolicyChecker.init, expectedCrawler);
			};
		});
		beforeEach(function() {
			this.sinon.stub(PolicyChecker, 'init');
		});
		it('should construct BasicComposer instance successfully', function() {
			// Object set-up
			var crawler = 'crawler';

			// Expected arguments to be passed to PolicyChecker.init
			const expectedCrawler = crawler;

			// Validation
			this.validate(crawler, expectedCrawler);
		});
	});
	describe('.init()', function() {
		before(function() {
			this.validate = function(policyChecker, crawler, expectedCrawler) {
				PolicyChecker.init.call(policyChecker, crawler);

				sinon.assert.calledOnce(PolicyChecker.init);
				sinon.assert.calledWithExactly(PolicyChecker.init, expectedCrawler);
				sinon.assert.calledOnce(CrawlerReferencer.init);
				sinon.assert.calledWithExactly(CrawlerReferencer.init, expectedCrawler);
			};
		});
		beforeEach(function() {
			this.sinon.spy(PolicyChecker, 'init');
			this.sinon.stub(CrawlerReferencer, 'init');
		});
		it('should construct BasicComposer instance successfully', function() {
			// Object set-up
			var policyChecker = {};

			// Input arguments
			var crawler = 'crawler';

			// Expected arguments to be passed to PolicyChecker.init
			const expectedCrawler = 'crawler';

			// Validation
			this.validate(policyChecker, crawler, expectedCrawler);
		});
	});
	describe('#isAllowed()', function() {
		before(function() {
			this.validate = function(policyChecker, array, value,
			                         expectedReturnValue) {
				PolicyChecker.prototype.isAllowed.call(policyChecker, array, value);

				sinon.assert.calledOnce(PolicyChecker.prototype.isAllowed);
				sinon.assert.calledWithExactly(PolicyChecker.prototype.isAllowed, array, value);
				PolicyChecker.prototype.isAllowed.returned(expectedReturnValue);
			};
		});
		beforeEach(function() {
			this.sinon.spy(PolicyChecker.prototype, 'isAllowed');
		});
		it('should construct BasicComposer instance successfully', function() {
			// Object set-up
			var policyChecker = {};

			// Input arguments
			var array = [5];
			var value = 5;

			// Expected return value by isAllowed()
			const expectedReturnValue = true;

			// Validation
			this.validate(policyChecker, array, value,
				expectedReturnValue);
		});
	});
});