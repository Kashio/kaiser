/**
 * Created by Roy on 12/08/2016.
 */

// core modules
var util          = require('util');

// npm modules
var chai          = require('chai'),
	chai_things   = require('chai-things'),
	sinon         = require('sinon'),
	request       = require('request');

// lib modules
require('./spec_helper');

var kaiser        = require('../index'),
	Resource      = require('../lib/resource'),
	PolicyChecker = require('../lib/policy_checker');

var Discoverer    = kaiser.Discoverer,
	BasicDiscoverer  = kaiser.BasicDiscoverer;

chai.should();
chai.use(chai_things);

describe('BasicDiscoverer', function() {
	describe('BasicDiscoverer()', function () {
		before(function () {
			this.validate = function (crawler, expectedCrawler) {
				new BasicDiscoverer(crawler);

				sinon.assert.calledOnce(BasicDiscoverer.init);
				sinon.assert.calledWithExactly(BasicDiscoverer.init, expectedCrawler);
			};
		});
		beforeEach(function () {
			this.sinon.stub(BasicDiscoverer, 'init');
		});
		it('should construct BasicDiscoverer instance successfully', function () {
			// Object set-up
			var crawler = 'crawler';

			// Expected arguments to be passed to BasicDiscoverer.init
			const expectedCrawler = crawler;

			// Validation
			this.validate(crawler, expectedCrawler);
		});
	});
	describe('.init()', function() {
		before(function() {
			this.validate = function(basicDiscoverer, crawler, expectedCrawler) {
				BasicDiscoverer.init.call(basicDiscoverer, crawler);

				sinon.assert.calledOnce(BasicDiscoverer.init);
				sinon.assert.calledWithExactly(BasicDiscoverer.init, crawler);
				sinon.assert.calledOnce(Discoverer.init);
				sinon.assert.calledWithExactly(Discoverer.init, expectedCrawler);
				basicDiscoverer.should.have.property('policyChecker').and.to.be.instanceof(PolicyChecker).and.to.have.property('crawler', crawler);
			};
		});
		beforeEach(function() {
			this.sinon.spy(BasicDiscoverer, 'init');
			this.sinon.spy(Discoverer, 'init'); // Not a stub because we want Discoverer.init() to initialize self.crawler to pass it to self.policyChecker
		});
		it('should initialize BasicDiscoverer instance with default parameters', function() {
			// Object set-up
			var basicDiscoverer = {};

			// Input arguments
			var crawler = 'crawler';

			// Expected arguments to be passed to Discoverer.init
			const expectedCrawler = crawler;

			// Validation
			this.validate(basicDiscoverer, crawler, expectedCrawler);
		});
		it('should initialize BasicDiscoverer instance with default parameters and then fails to initialze the parameters again', function() {
			// Object set-up
			var basicDiscoverer = {};

			// Input arguments
			var crawler = 'crawler';

			// Expected arguments to be passed to Discoverer.init
			const expectedCrawler = crawler;

			// Validation
			this.validate(basicDiscoverer, crawler, expectedCrawler);

			// Specific validation pre-conditions
			BasicDiscoverer.init.call(basicDiscoverer, crawler);

			// Specific validation
			sinon.assert.calledTwice(BasicDiscoverer.init);
			sinon.assert.calledWithExactly(BasicDiscoverer.init, crawler);
			sinon.assert.calledTwice(Discoverer.init);
			sinon.assert.calledWithExactly(Discoverer.init, expectedCrawler);
			basicDiscoverer.should.have.property('policyChecker').and.to.be.instanceof(PolicyChecker).and.to.have.property('crawler', crawler);
		});
	});
});