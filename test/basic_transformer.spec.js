/**
 * Created by Roy on 12/08/2016.
 */

// core modules
var util          = require('util');

// npm modules
var chai             = require('chai'),
	chai_things      = require('chai-things'),
	sinon            = require('sinon');

// lib modules
require('./spec_helper');

var helpers          = require('../lib/helpers'),
	kaiser           = require('../index'),
	Crawler          = require('../lib/crawler'),
	Resource         = require('../lib/resource'),
	PolicyChecker    = require('../lib/policy_checker');

var Transformer      = kaiser.Transformer,
	BasicTransformer = kaiser.BasicTransformer;

chai.should();
chai.use(chai_things);

describe('BasicTransformer', function() {
	describe('BasicTransformer()', function () {
		before(function () {
			this.validate = function (crawler, options,
			                          expectedCrawler, expectedOptions) {
				new BasicTransformer(crawler, options);

				sinon.assert.calledOnce(BasicTransformer.init);
				sinon.assert.calledWithExactly(BasicTransformer.init, expectedCrawler, expectedOptions);
			};
		});
		beforeEach(function () {
			this.sinon.stub(BasicTransformer, 'init');
		});
		it('should construct BasicTransformer instance successfully', function () {
			// Object set-up
			var crawler = 'crawler';
			var options = 'options';

			// Expected arguments to be passed to BasicDiscoverer.init
			const expectedCrawler = crawler;
			const expectedOptions = options;

			// Validation
			this.validate(crawler, options,
				expectedCrawler, expectedOptions);
		});
	});
	describe('.init()', function() {
		before(function() {
			this.validate = function(basicTransformer, crawler, options,
			                         expectedCrawler, expectedRewriteLinksFileTypes) {
				BasicTransformer.init.call(basicTransformer, crawler, options);

				sinon.assert.calledOnce(BasicTransformer.init);
				sinon.assert.calledWithExactly(BasicTransformer.init, crawler, options);
				sinon.assert.calledOnce(Transformer.init);
				sinon.assert.calledWithExactly(Transformer.init, expectedCrawler);
				basicTransformer.should.have.property('policyChecker').and.to.be.instanceof(PolicyChecker).and.to.have.property('crawler', crawler);
				basicTransformer.should.have.property('rewriteLinksFileTypes', expectedRewriteLinksFileTypes);
			};
		});
		beforeEach(function() {
			this.sinon.spy(BasicTransformer, 'init');
			this.sinon.spy(Transformer, 'init'); // Not a stub because we want Transformer.init() to initialize self.crawler to pass it to self.policyChecker
		});
		it('should initialize BasicTransformer instance with default parameters', function() {
			// Object set-up
			var basicTransformer = {};

			// Input arguments
			var crawler = 'crawler';
			var options = { rewriteLinksFileTypes: 'rewriteLinksFileTypes' };

			// Expected arguments to be passed to Discoverer.init
			const expectedCrawler = crawler;
			const expectedRewriteLinksFileTypes = 'rewriteLinksFileTypes';

			// Validation
			this.validate(basicTransformer, crawler, options,
				expectedCrawler, expectedRewriteLinksFileTypes);
		});
		it('should initialize BasicTransformer instance with default parameters and then fails to initialze the parameters again', function() {
			// Object set-up
			var basicTransformer = {};

			// Input arguments
			var crawler = 'crawler';
			var options = { rewriteLinksFileTypes: 'rewriteLinksFileTypes' };

			// Expected arguments to be passed to Discoverer.init
			const expectedCrawler = crawler;
			const expectedRewriteLinksFileTypes = 'rewriteLinksFileTypes';

			// Validation
			this.validate(basicTransformer, crawler, options,
				expectedCrawler, expectedRewriteLinksFileTypes);

			// Specific validation pre-conditions
			BasicTransformer.init.call(basicTransformer, crawler, options);

			// Specific validation
			sinon.assert.calledTwice(BasicTransformer.init);
			sinon.assert.calledWithExactly(BasicTransformer.init, crawler, options);
			sinon.assert.calledTwice(Transformer.init);
			sinon.assert.calledWithExactly(Transformer.init, expectedCrawler);
			basicTransformer.should.have.property('policyChecker').and.to.be.instanceof(PolicyChecker).and.to.have.property('crawler', crawler);
			basicTransformer.should.have.property('rewriteLinksFileTypes', expectedRewriteLinksFileTypes);
		});
	});
	describe.skip('#logic()', function() {
		before(function () {
			this.validate = function (basicDiscoverer, resource, callback,
			                          expectedError, expectedResource, expectedResult) {
				basicDiscoverer.logic(resource, callback);

				sinon.assert.calledOnce(BasicDiscoverer.prototype.logic);
				sinon.assert.calledWithExactly(BasicDiscoverer.prototype.logic, resource, callback);
				sinon.assert.calledOnce(callback);
				if (expectedResult) {
					sinon.assert.calledWithExactly(callback, expectedError, expectedResource, expectedResult);
				} else {
					sinon.assert.calledWithExactly(callback, expectedError, expectedResource);
				}
			};
		});
		beforeEach(function () {
			this.sinon.spy(BasicDiscoverer.prototype, 'logic');
		});
		it('should fail to discover more resources because `crawler.isStopping` is set', function() {
			// Object set-up
			var basicDiscoverer = new BasicDiscoverer({
				isStopping: true
			}, {}, {});

			// Input arguments
			var resource = Resource.instance('https://www.google.com', null);
			var callback = this.sinon.spy();

			// Expected arguments to be passed to the callback
			const expectedError = null;
			const expectedResource = resource;

			// Validation
			this.validate(basicDiscoverer, resource, callback,
				expectedError, expectedResource);
		});
		it('should fail to discover more resources because resource is not permitted by policy checker allowed depth check', function() {
			// Object set-up
			var basicDiscoverer = new BasicDiscoverer({
				isStopping: true
			}, {}, {});

			// Input arguments
			var resource = Resource.instance('https://www.google.com', null);
			var callback = this.sinon.spy();

			// Expected arguments to be passed to the callback
			const expectedError = null;
			const expectedResource = resource;

			// Spies, Stubs, Mocks
			this.sinon.stub(PolicyChecker.prototype, 'isDepthAllowed').returns(false);

			// Validation
			this.validate(basicDiscoverer, resource, callback,
				expectedError, expectedResource);
		});
		it('should fail to discover more resources because no resources are found', function() {
			// Object set-up
			var basicDiscoverer = new BasicDiscoverer({}, {}, {});

			// Input arguments
			var resource = Resource.instance('https://www.google.com', null);
			var callback = this.sinon.spy();

			// Expected arguments to be passed to the callback
			const expectedError = null;
			const expectedResource = resource;
			const expectedResult = [];

			// Spies, Stubs, Mocks
			this.sinon.stub(PolicyChecker.prototype, 'isDepthAllowed').returns(true);
			this.sinon.stub(BasicDiscoverer.prototype, 'getUris');
			this.sinon.stub(BasicDiscoverer.prototype, 'formatUris');
			this.sinon.stub(BasicDiscoverer.prototype, 'filterUris');
			asyncWaterfallStub.yields(null, []);

			// Validation
			this.validate(basicDiscoverer, resource, callback,
				expectedError, expectedResource, expectedResult);
		});
		it('should discover more resources successfully', function() {
			// Object set-up
			this.sinon.stub(Crawler, 'init');
			var basicDiscoverer = new BasicDiscoverer(new Crawler({}), {}, {});

			// Input arguments
			var resource = Resource.instance('https://www.google.com', null);
			var callback = this.sinon.spy();

			// Expected arguments to be passed to the callback
			const expectedError = null;
			var expectedResource = resource;
			const expectedResult = ['http://www.google.com'];

			// Spies, Stubs, Mocks
			this.sinon.stub(PolicyChecker.prototype, 'isDepthAllowed').returns(true);
			asyncWaterfallStub.yields(null, ['http://www.google.com']);
			this.sinon.stub(Crawler.prototype, 'crawl');

			// Validation
			this.validate(basicDiscoverer, resource, callback,
				expectedError, expectedResource, expectedResult);

			// Specific validation pre-conditions
			delete expectedResource.originator;

			// Specific validation
			sinon.assert.calledOnce(Crawler.prototype.crawl);
			sinon.assert.calledWithExactly(Crawler.prototype.crawl, expectedResult, expectedResource);
		});
	});
});