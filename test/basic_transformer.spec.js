/**
 * Created by Roy on 12/08/2016.
 */

// core modules
var util          = require('util');

// npm modules
var chai             = require('chai'),
	chai_things      = require('chai-things'),
	sinon            = require('sinon'),
	URI              = require('urijs');

var uriIsStub = sinon.stub(URI.prototype, 'is');

// lib modules
require('./spec_helper');

var helpers          = require('../lib/helpers'),
	kaiser           = require('../index'),
	Crawler          = require('../lib/crawler'),
	Resource         = require('../lib/resource'),
	PolicyChecker    = require('../lib/policy_checker');

var helpersIsEmptyStub = sinon.stub(helpers, 'isEmpty');

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
	describe('#logic()', function() {
		before(function () {
			this.validate = function (basicTransformer, resource, callback,
			                          expectedError, expectedResource) {
				basicTransformer.logic(resource, callback);

				sinon.assert.calledOnce(BasicTransformer.prototype.logic);
				sinon.assert.calledWithExactly(BasicTransformer.prototype.logic, resource, callback);
				sinon.assert.calledOnce(callback);
				sinon.assert.calledWithExactly(callback, expectedError, expectedResource);
			};
		});
		beforeEach(function () {
			this.sinon.spy(BasicTransformer.prototype, 'logic');
		});
		it('should fail to transform a resource because it can\'t be transformed', function() {
			// Object set-up
			var basicTransformer = new BasicTransformer({}, {});

			// Input arguments
			var resource = Resource.instance('https://www.google.com', null);
			var callback = this.sinon.spy();

			// Expected arguments to be passed to the callback
			const expectedError = null;
			const expectedResource = resource;

			// Spies, Stubs, Mocks
			this.sinon.stub(BasicTransformer.prototype, 'canTransform').returns(false);

			// Validation
			this.validate(basicTransformer, resource, callback,
				expectedError, expectedResource);
		});
		it('should transform a resource sucessfully', function() {
			// Object set-up
			var basicTransformer = new BasicTransformer({}, {});

			// Input arguments
			var resource = Resource.instance('https://www.google.com', null);
			var callback = this.sinon.spy();

			// Expected arguments to be passed to the callback
			const expectedError = null;
			const expectedResource = resource;

			// Spies, Stubs, Mocks
			this.sinon.stub(BasicTransformer.prototype, 'canTransform').returns(true);
			this.sinon.stub(BasicTransformer.prototype, 'populateUriArrays').returns();
			this.sinon.stub(BasicTransformer.prototype, 'replaceResourceContent').returns();

			// Validation
			this.validate(basicTransformer, resource, callback,
				expectedError, expectedResource);
		});
	});
	describe('#canTransform()', function() {
		before(function () {
			this.validate = function (basicTransformer, resource, expectedReturnValue) {
				basicTransformer.canTransform(resource);

				sinon.assert.calledOnce(BasicTransformer.prototype.canTransform);
				sinon.assert.calledWithExactly(BasicTransformer.prototype.canTransform, resource);
				BasicTransformer.prototype.canTransform.returned(expectedReturnValue);
			};
		});
		beforeEach(function () {
			this.sinon.spy(BasicTransformer.prototype, 'canTransform');
		});
		it('should allow a resource with no file in the url to be transformed', function() {
			// Object set-up
			var basicTransformer = new BasicTransformer({}, {
				rewriteLinksFileTypes: [
					'txt'
				]
			});

			// Input arguments
			var resource = Resource.instance('https://www.google.com', null);

			// Expected return value by canTransform()
			const expectedReturnValue = true;

			// Spies, Stubs, Mocks
			this.sinon.stub(PolicyChecker.prototype, 'isDepthAllowed').returns(true);
			helpersIsEmptyStub.returns(true);

			// Validation
			this.validate(basicTransformer, resource, expectedReturnValue);
		});
		it('should allow a resource with file in the url to be transformed', function() {
			// Object set-up
			var basicTransformer = new BasicTransformer({}, {
				rewriteLinksFileTypes: [
					'txt'
				]
			});

			// Input arguments
			var resource = Resource.instance('https://www.google.com/file.txt', null);

			// Expected return value by canTransform()
			const expectedReturnValue = true;

			// Spies, Stubs, Mocks
			this.sinon.stub(PolicyChecker.prototype, 'isDepthAllowed').returns(true);
			helpersIsEmptyStub.returns(false);

			// Validation
			this.validate(basicTransformer, resource, expectedReturnValue);
		});
	});
	describe('#populateUriArrays()', function() {
		before(function () {
			this.validate = function (basicTransformer, resource, fetchedUris, notFetchedUris,
			                          expectedFetchedUris, expectedNotFetchedUris) {
				basicTransformer.populateUriArrays(resource, fetchedUris, notFetchedUris);

				sinon.assert.calledOnce(BasicTransformer.prototype.populateUriArrays);
				sinon.assert.calledWithExactly(BasicTransformer.prototype.populateUriArrays, resource, fetchedUris, notFetchedUris);
				fetchedUris.should.be.deep.equal(expectedFetchedUris);
				notFetchedUris.should.be.deep.equal(expectedNotFetchedUris);
			};
		});
		beforeEach(function () {
			this.sinon.spy(BasicTransformer.prototype, 'populateUriArrays');
		});
		it('should populate fetchedUris array', function() {
			// Object set-up
			var basicTransformer = new BasicTransformer({}, {});

			// Input arguments
			var resource = Resource.instance('https://www.google.com', null);
			var fetchedUris = [];
			var notFetchedUris = [];

			// Expected values
			var urisDictionaryToReturnFromStub = [];
			var regex = /(\s(?:src|href)\s*=\s*["']?\s*)([^"'>]+)(\s*["']?[^>]*>)/ig;
			urisDictionaryToReturnFromStub[regex] = [];
			var match = ' src="www.exmaple.com" >';
			urisDictionaryToReturnFromStub[regex][match] = [];
			urisDictionaryToReturnFromStub[regex][match].push(' src="');
			urisDictionaryToReturnFromStub[regex][match].push('www.exmaple.com');
			urisDictionaryToReturnFromStub[regex][match].push('" >');
			const expectedFetchedUris = [urisDictionaryToReturnFromStub[regex][match]];
			const expectedNotFetchedUris = [];

			// Spies, Stubs, Mocks
			this.sinon.stub(basicTransformer, 'createRegexUrisDictionary').returns(urisDictionaryToReturnFromStub);
			helpersIsEmptyStub.returns(false);
			this.sinon.stub(basicTransformer, 'isUriBlackListed').returns(false);
			uriIsStub.returns(false);
			this.sinon.stub(basicTransformer, 'isUriAllowedByPolicyChecker').returns(true);

			// Validation
			this.validate(basicTransformer, resource, fetchedUris, notFetchedUris,
				expectedFetchedUris, expectedNotFetchedUris);
		});
		it('should populate notFetchedUris array', function() {
			// Object set-up
			var basicTransformer = new BasicTransformer({}, {});

			// Input arguments
			var resource = Resource.instance('https://www.google.com', null);
			var fetchedUris = [];
			var notFetchedUris = [];

			// Expected values
			var urisDictionaryToReturnFromStub = [];
			var regex = /(\s(?:src|href)\s*=\s*["']?\s*)([^"'>]+)(\s*["']?[^>]*>)/ig;
			urisDictionaryToReturnFromStub[regex] = [];
			var match = ' src="www.exmaple.com" >';
			urisDictionaryToReturnFromStub[regex][match] = [];
			urisDictionaryToReturnFromStub[regex][match].push(' src="');
			urisDictionaryToReturnFromStub[regex][match].push('www.exmaple.com');
			urisDictionaryToReturnFromStub[regex][match].push('" >');
			const expectedFetchedUris = [];
			const expectedNotFetchedUris = [urisDictionaryToReturnFromStub[regex][match]];

			// Spies, Stubs, Mocks
			this.sinon.stub(basicTransformer, 'createRegexUrisDictionary').returns(urisDictionaryToReturnFromStub);
			helpersIsEmptyStub.returns(false);
			this.sinon.stub(basicTransformer, 'isUriBlackListed').returns(false);
			uriIsStub.returns(false);
			this.sinon.stub(basicTransformer, 'isUriAllowedByPolicyChecker').returns(false);

			// Validation
			this.validate(basicTransformer, resource, fetchedUris, notFetchedUris,
				expectedFetchedUris, expectedNotFetchedUris);
		});
		it('should fail to populate any of the uris arrays because uri is empty', function() {
			// Object set-up
			var basicTransformer = new BasicTransformer({}, {});

			// Input arguments
			var resource = Resource.instance('https://www.google.com', null);
			var fetchedUris = [];
			var notFetchedUris = [];

			// Expected values
			var urisDictionaryToReturnFromStub = [];
			var regex = /(\s(?:src|href)\s*=\s*["']?\s*)([^"'>]+)(\s*["']?[^>]*>)/ig;
			urisDictionaryToReturnFromStub[regex] = [];
			var match = ' src="" >';
			urisDictionaryToReturnFromStub[regex][match] = [];
			urisDictionaryToReturnFromStub[regex][match].push(' src="');
			urisDictionaryToReturnFromStub[regex][match].push('');
			urisDictionaryToReturnFromStub[regex][match].push('" >');
			const expectedFetchedUris = [];
			const expectedNotFetchedUris = [];

			// Spies, Stubs, Mocks
			this.sinon.stub(basicTransformer, 'createRegexUrisDictionary').returns(urisDictionaryToReturnFromStub);
			helpersIsEmptyStub.returns(true);

			// Validation
			this.validate(basicTransformer, resource, fetchedUris, notFetchedUris,
				expectedFetchedUris, expectedNotFetchedUris);
		});
		it('should fail to populate any of the uris arrays because uri is a urn', function() {
			// Object set-up
			var basicTransformer = new BasicTransformer({}, {});

			// Input arguments
			var resource = Resource.instance('https://www.google.com', null);
			var fetchedUris = [];
			var notFetchedUris = [];

			// Expected values
			var urisDictionaryToReturnFromStub = [];
			var regex = /(\s(?:src|href)\s*=\s*["']?\s*)([^"'>]+)(\s*["']?[^>]*>)/ig;
			urisDictionaryToReturnFromStub[regex] = [];
			var match = ' src="www.example.com" >';
			urisDictionaryToReturnFromStub[regex][match] = [];
			urisDictionaryToReturnFromStub[regex][match].push(' src="');
			urisDictionaryToReturnFromStub[regex][match].push('www.example.com');
			urisDictionaryToReturnFromStub[regex][match].push('" >');
			const expectedFetchedUris = [];
			const expectedNotFetchedUris = [];

			// Spies, Stubs, Mocks
			this.sinon.stub(basicTransformer, 'createRegexUrisDictionary').returns(urisDictionaryToReturnFromStub);
			helpersIsEmptyStub.returns(false);
			this.sinon.stub(basicTransformer, 'isUriBlackListed').returns(false);
			uriIsStub.returns(true);

			// Validation
			this.validate(basicTransformer, resource, fetchedUris, notFetchedUris,
				expectedFetchedUris, expectedNotFetchedUris);
		});
		it('should fail to populate any of the uris arrays because isUriAllowedByPolicyChecker() throws', function() {
			// Object set-up
			this.sinon.stub(Crawler, 'init');
			var basicTransformer = new BasicTransformer(new Crawler({}), {});

			// Input arguments
			var resource = Resource.instance('https://www.google.com', null);
			var fetchedUris = [];
			var notFetchedUris = [];

			// Expected values
			var urisDictionaryToReturnFromStub = [];
			var regex = /(\s(?:src|href)\s*=\s*["']?\s*)([^"'>]+)(\s*["']?[^>]*>)/ig;
			urisDictionaryToReturnFromStub[regex] = [];
			var match = ' src="www.example.com" >';
			urisDictionaryToReturnFromStub[regex][match] = [];
			urisDictionaryToReturnFromStub[regex][match].push(' src="');
			urisDictionaryToReturnFromStub[regex][match].push('www.example.com');
			urisDictionaryToReturnFromStub[regex][match].push('" >');
			const expectedFetchedUris = [];
			const expectedNotFetchedUris = [];

			// Expected values to be passed to the 'transformerror` event spy
			const expectedEventResource = resource;
			const expectedEventUri = 'www.example.com';
			const expectedEventError = new Error('oops');

			// Spies, Stubs, Mocks
			this.sinon.stub(basicTransformer, 'createRegexUrisDictionary').returns(urisDictionaryToReturnFromStub);
			helpersIsEmptyStub.returns(false);
			this.sinon.stub(basicTransformer, 'isUriBlackListed').returns(false);
			uriIsStub.returns(false);
			this.sinon.stub(basicTransformer, 'isUriAllowedByPolicyChecker').throws(new Error('oops'));

			// Specific validation pre-conditions
			var transformErrorEventSpy = this.sinon.spy();
			basicTransformer.crawler.on('transformerror', transformErrorEventSpy);

			// Validation
			this.validate(basicTransformer, resource, fetchedUris, notFetchedUris,
				expectedFetchedUris, expectedNotFetchedUris);

			// Specific validation
			sinon.assert.calledOnce(transformErrorEventSpy);
			sinon.assert.calledWithExactly(transformErrorEventSpy, expectedEventResource, expectedEventUri, expectedEventError);
		});
	});
});