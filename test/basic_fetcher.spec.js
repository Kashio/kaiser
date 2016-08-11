/**
 * Created by Roy on 14/05/2016.
 */

// core modules
var util          = require('util');

// npm modules
var chai          = require('chai'),
	chai_things   = require('chai-things'),
	sinon         = require('sinon'),
	request       = require('request');

var requestGetStub = sinon.stub(request, 'get');

// lib modules
require('./spec_helper');

var kaiser        = require('../index'),
	Resource      = require('../lib/resource'),
	PolicyChecker = require('../lib/policy_checker');

var Fetcher       = kaiser.Fetcher,
	BasicFetcher  = kaiser.BasicFetcher;

chai.should();
chai.use(chai_things);

describe('BasicFetcher', function() {
	describe('BasicFetcher()', function() {
		before(function() {
			this.validate = function(crawler, options, requestSettings,
			                         expectedCrawler, expectedOptions, expectedRequestSettings) {
				new BasicFetcher(crawler, options, requestSettings);

				sinon.assert.calledOnce(BasicFetcher.init);
				sinon.assert.calledWithExactly(BasicFetcher.init, expectedCrawler, expectedOptions, expectedRequestSettings);
			};
		});
		beforeEach(function() {
			this.sinon.stub(BasicFetcher, 'init');
		});
		it('should construct BasicFetcher instance successfully', function() {
			// Object set-up
			var crawler = 'crawler';
			var options = 'options';
			var requestSettings = 'requestSettings';

			// Expected arguments to be passed to BasicFetcher.init
			const expectedCrawler = crawler;
			const expectedOptions = options;
			const expectedRequestSettings = requestSettings;

			// Validation
			this.validate(crawler, options, requestSettings,
				expectedCrawler, expectedOptions, expectedRequestSettings);
		});
	});
	describe('.init()', function() {
		before(function() {
			this.validate = function(basicFetcher, crawler, options, requestSettings,
			                         expectedCrawler, expectedMaxAttempts, expectedRetryDelay, expectedMaxConcurrentRequests) {
				BasicFetcher.init.call(basicFetcher, crawler, options, requestSettings);

				sinon.assert.calledOnce(BasicFetcher.init);
				sinon.assert.calledWithExactly(BasicFetcher.init, crawler, options, requestSettings);
				sinon.assert.calledOnce(Fetcher.init);
				sinon.assert.calledWithExactly(Fetcher.init, expectedCrawler);
				basicFetcher.should.have.property('policyChecker').and.to.be.instanceof(PolicyChecker).and.to.have.property('crawler');
				basicFetcher.should.have.property('maxAttempts').and.to.equal(expectedMaxAttempts);
				basicFetcher.should.have.property('retryDelay').and.to.equal(expectedRetryDelay);
				basicFetcher.should.have.property('maxConcurrentRequests').and.to.equal(expectedMaxConcurrentRequests);
				basicFetcher.should.have.property('fetchedUris').and.to.be.instanceof(Array).and.to.be.empty;
				basicFetcher.should.have.property('pendingRequests').and.to.be.instanceof(Array).and.to.be.empty;
				basicFetcher.should.have.property('activeRequests').and.to.equal(0);
				basicFetcher.should.have.property('totalBytesFetched').and.to.equal(0);
			};
		});
		beforeEach(function() {
			this.sinon.spy(BasicFetcher, 'init');
			this.sinon.stub(Fetcher, 'init');
		});
		it('should initialize BasicFetcher instance with default parameters', function() {
			// Object set-up
			var basicFetcher = {};

			// Input arguments
			var crawler = 'crawler';
			var options = 'options';
			var requestSettings = 'requestSettings';

			// Expected arguments to be passed to Composer.init
			const expectedCrawler = crawler;

			// Expected values basicFetcher will be set to
			const expectedMaxAttempts = 10;
			const expectedRetryDelay = 5000;
			const expectedMaxConcurrentRequests = 100;

			// Validation
			this.validate(basicFetcher, crawler, options, requestSettings,
				expectedCrawler, expectedMaxAttempts, expectedRetryDelay, expectedMaxConcurrentRequests);
		});
		it('should initialize BasicFetcher instance with custom parameters', function() {
			// Object set-up
			var basicFetcher = {};

			// Input arguments
			var crawler = 'crawler';
			var options = {
				maxAttempts: 1,
				retryDelay: 1,
				maxConcurrentRequests: 1
			};
			var requestSettings = 'requestSettings';

			// Expected arguments to be passed to Composer.init
			const expectedCrawler = crawler;

			// Expected values basicFetcher will be set to
			const expectedMaxAttempts = 1;
			const expectedRetryDelay = 1;
			const expectedMaxConcurrentRequests = 1;

			// Validation
			this.validate(basicFetcher, crawler, options, requestSettings,
				expectedCrawler, expectedMaxAttempts, expectedRetryDelay, expectedMaxConcurrentRequests);
		});
	});
	describe('#logic()', function() {
		before(function() {
			this.validate = function(basicFetcher, resource, callback,
			                         expectedError, checkCallback) {
				basicFetcher.logic(resource, callback);

				sinon.assert.calledOnce(BasicFetcher.prototype.logic);
				sinon.assert.calledWithExactly(BasicFetcher.prototype.logic, resource, callback);
				if (checkCallback) {
					sinon.assert.calledOnce(callback);
					sinon.assert.calledWithExactly(callback, expectedError);
				}
			};
		});
		beforeEach(function() {
			this.sinon.spy(BasicFetcher.prototype, 'logic');
		});
		it ('should fail to create a resource request because `crawler.isStopping` is set', function() {
			// Object set-up
			var basicFetcher = new BasicFetcher({
				isStopping: true
			}, {}, {});

			// Input arguments
			var resource = Resource.instance('https://www.google.com', null);
			var callback = this.sinon.spy();

			// Expected arguments to be passed to the callback
			const expectedError = new Error('Fetch failed because crawler is stopping');

			// Validation
			this.validate(basicFetcher, resource, callback,
				expectedError, true);
		});
		it('should fail to create a resource request because resource is not permitted by policy checker robots txt check', function() {
			// Object set-up
			var basicFetcher = new BasicFetcher({}, {}, {});

			// Input arguments
			var resource = Resource.instance('https://www.google.com', null);
			var callback = this.sinon.spy();

			// Expected arguments to be passed to the callback
			const expectedError = new Error('Fetch failed because of robots txt disallowance');

			// Spies, Stubs, Mocks
			this.sinon.stub(PolicyChecker.prototype, 'isRobotsTxtAllowsResource').returns(false);

			// Validation
			this.validate(basicFetcher, resource, callback,
				expectedError, true);
		});
		it('should fail to create a resource request because of a crawler limit pass', function() {
			// Object set-up
			var basicFetcher = new BasicFetcher({
				isStopping: false
			}, {}, {});

			// Input arguments
			var resource = Resource.instance('https://www.google.com', null);
			var callback = this.sinon.spy();

			// Expected arguments to be passed to the callback
			const expectedError = new Error('Fetch failed because a crawler limit was passed');

			// Expected values
			const expectedCrawlerIsStopping = true;

			// Spies, Stubs, Mocks
			this.sinon.stub(PolicyChecker.prototype, 'isMaxTimeOverallPassed').returns(true);

			// Validation
			this.validate(basicFetcher, resource, callback,
				expectedError, true);

			// Specific validation
			basicFetcher.crawler.isStopping.should.be.equal(expectedCrawlerIsStopping);
		});
		it('should fail to create a resource request because the resource was already fetched', function() {
			// Object set-up
			var basicFetcher = new BasicFetcher({}, {}, {});

			// Input arguments
			var resource = Resource.instance('https://www.google.com', null);
			var callback = this.sinon.spy();

			// Expected arguments to be passed to the callback
			const expectedError = new Error('Fetch failed because resource was already fetched');

			// Pre-conditions
			basicFetcher.fetchedUris.push(resource.uri.toString());

			// Validation
			this.validate(basicFetcher, resource, callback,
				expectedError, true);
		});
		it('should create a resource request', function() {
			// Object set-up
			var basicFetcher = new BasicFetcher({}, {}, {});

			// Input arguments
			var resource = Resource.instance('https://www.google.com', null);
			var callback = this.sinon.spy();

			// Expected values
			const expectedFetchedUris = [resource.uri.toString()];
			const expectedPendingRequests = [{
				"arguments": [{
					uri: resource.uri.toString()
				}, basicFetcher.maxAttempts, resource, callback],
				"function": basicFetcher.requestLoop
			}];

			// Spies, Stubs, Mocks
			var runRequestStub = this.sinon.stub(basicFetcher, 'runRequest');

			// Validation
			this.validate(basicFetcher, resource, callback,
				null, false);

			// Specific validation
			basicFetcher.fetchedUris.should.deep.have.members(expectedFetchedUris);
			basicFetcher.pendingRequests.should.deep.have.members(expectedPendingRequests);
			sinon.assert.calledOnce(runRequestStub);
		});
	});
	describe('#requestLoop()', function() {
		before(function() {
			this.validate = function(basicFetcher, options, attemptsLeft, resource, callback, lastError,
			                         expectedError, expectedResponse, expectedBody, expectedResource, expectedCallback) {
				basicFetcher.requestLoop(options, attemptsLeft, resource, callback, lastError);

				sinon.assert.calledOnce(BasicFetcher.prototype.requestLoop);
				sinon.assert.calledWithExactly(BasicFetcher.prototype.requestLoop, options, attemptsLeft, resource, callback, lastError);
				sinon.assert.calledOnce(BasicFetcher.prototype.handleResponse);
				sinon.assert.calledWithExactly(BasicFetcher.prototype.handleResponse, expectedError, expectedResponse, expectedBody, expectedResource, expectedCallback);
			};
		});
		beforeEach(function() {
			this.sinon.spy(BasicFetcher.prototype, 'requestLoop');
			this.sinon.stub(BasicFetcher.prototype, 'handleResponse');
		});
		it('should fail to request a resource due to passing `attemptsLeft` count without error', function() {
			// Object set-up
			var basicFetcher = new BasicFetcher({}, {}, {});

			// Input arguments
			var options = {};
			var attemptsLeft = 0;
			var resource = null;
			var callback = function() {};
			var lastError = null;

			// Expected arguments to be passed to BasicFetcher.prototype.handleResponse
			const expectedError = new Error('No attempts to fetch the URL were made');
			const expectedResponse = null;
			const expectedBody = null;
			const expectedResource = resource;
			const expectedCallback = callback;

			// Validation
			this.validate(basicFetcher, options, attemptsLeft, resource, callback, lastError,
				expectedError, expectedResponse, expectedBody, expectedResource, expectedCallback);
		});
		it('should fail to request a resource due to passing `attemptsLeft` count with error', function() {
			// Object set-up
			var basicFetcher = new BasicFetcher({}, {}, {});

			// Input arguments
			var options = {};
			var attemptsLeft = 0;
			var resource = null;
			var callback = function() {};
			var lastError = new Error('My custom error');

			// Expected arguments to be passed to BasicFetcher.prototype.handleResponse
			const expectedError = lastError;
			const expectedResponse = null;
			const expectedBody = null;
			const expectedResource = resource;
			const expectedCallback = callback;

			// Validation
			this.validate(basicFetcher, options, attemptsLeft, resource, callback, lastError,
				expectedError, expectedResponse, expectedBody, expectedResource, expectedCallback);
		});
		describe('handleResponseErrors()', function() {
			before(function() {
				this.clock = sinon.useFakeTimers();
				this.validate = function(basicFetcher, options, attemptsLeft, resource, callback, lastError,
				                         expectedError, expectedResponse, expectedBody, expectedResource, expectedCallback,
				                         tick, recursive) {
					basicFetcher.requestLoop(options, attemptsLeft, resource, callback, lastError);

					sinon.assert.calledOnce(BasicFetcher.prototype.requestLoop);
					sinon.assert.calledWithExactly(BasicFetcher.prototype.requestLoop, options, attemptsLeft, resource, callback, lastError);
					if (tick) {
						this.clock.tick(tick);
					}
					if (recursive) {
						sinon.assert.calledTwice(BasicFetcher.prototype.requestLoop);
						sinon.assert.calledWithExactly(BasicFetcher.prototype.requestLoop.secondCall, options, attemptsLeft - 1, resource, callback, expectedError);
					}
					sinon.assert.calledOnce(BasicFetcher.prototype.handleResponse);
					sinon.assert.calledWithExactly(BasicFetcher.prototype.handleResponse, expectedError, expectedResponse, expectedBody, expectedResource, expectedCallback);
				};
			});
			it('should fail handling response error with recoverable error `ESOCKETTIMEDOUT`', function() {
				// Object set-up
				var basicFetcher = new BasicFetcher({}, {
					retryDelay: 0
				}, {});

				// Input arguments
				var attemptsLeft = 1;
				var resource = Resource.instance('https://www.google.com', null);
				var options = { uri: resource.uri.toString() };
				var callback = function() {};
				var lastError = null;

				// Expected arguments to be passed to BasicFetcher.prototype.handleResponse
				var expectedError = new Error('ESOCKETTIMEDOUT error on https://www.google.com/');
				expectedError.code = 'ESOCKETTIMEDOUT';
				const expectedResponse = null;
				const expectedBody = null;
				const expectedResource = resource;
				const expectedCallback = callback;

				// Spies, Stubs, Mocks
				var requestCallbackError = new Error();
				requestCallbackError.code = 'ESOCKETTIMEDOUT';
				requestGetStub.yields(requestCallbackError, { statusCode: 400 }, 'body');

				// Validation
				this.validate(basicFetcher, options, attemptsLeft, resource, callback, lastError,
					expectedError, expectedResponse, expectedBody, expectedResource, expectedCallback,
					1, true);
			});
			it('should fail hadling response error with http response 500', function() {
				// Object set-up
				var basicFetcher = new BasicFetcher({}, {
					retryDelay: 0
				}, {});

				// Input arguments
				var attemptsLeft = 1;
				var resource = Resource.instance('https://www.google.com', null);
				var options = { uri: resource.uri.toString() };
				var callback = function() {};
				var lastError = null;

				// Expected arguments to be passed to BasicFetcher.prototype.handleResponse
				var expectedError = new Error('HTTP 500 error fetching https://www.google.com/');
				expectedError.code = 500;
				const expectedResponse = null;
				const expectedBody = null;
				const expectedResource = resource;
				const expectedCallback = callback;

				// Spies, Stubs, Mocks
				requestGetStub.yields(null, { statusCode: 500 }, 'body');

				// Validation
				this.validate(basicFetcher, options, attemptsLeft, resource, callback, lastError,
					expectedError, expectedResponse, expectedBody, expectedResource, expectedCallback,
					1, true);
			});
			it('should succeed handling response error with http response 200', function() {
				// Object set-up
				var basicFetcher = new BasicFetcher({}, {
					retryDelay: 0
				}, {});

				// Input arguments
				var attemptsLeft = 1;
				var resource = Resource.instance('https://www.google.com', null);
				var options = { uri: resource.uri.toString() };
				var callback = function() {};
				var lastError = null;

				// Expected arguments to be passed to BasicFetcher.prototype.handleResponse
				const expectedError = null;
				const expectedResponse = { statusCode: 200 };
				const expectedBody = 'body';
				const expectedResource = resource;
				const expectedCallback = callback;

				// Spies, Stubs, Mocks
				requestGetStub.yields(null, expectedResponse, expectedBody);

				// Validation
				this.validate(basicFetcher, options, attemptsLeft, resource, callback, lastError,
					expectedError, expectedResponse, expectedBody, expectedResource, expectedCallback,
					false, false);
			});
			it('should fail handling responsee error with unrecoverable error', function() {
				// Object set-up
				var basicFetcher = new BasicFetcher({}, {
					retryDelay: 0
				}, {});

				// Input arguments
				var attemptsLeft = 1;
				var resource = Resource.instance('https://www.google.com', null);
				var options = { uri: resource.uri.toString() };
				var callback = function() {};
				var lastError = null;

				// Expected arguments to be passed to BasicFetcher.prototype.handleResponse
				var expectedError = new Error('Error fetching https://www.google.com/: oops (101)');
				expectedError.code = 101;
				const expectedResponse = null;
				const expectedBody = null;
				const expectedResource = resource;
				const expectedCallback = callback;

				// Spies, Stubs, Mocks
				var requestGetCallbackError = new Error('oops');
				requestGetCallbackError.code = 101;
				requestGetStub.yields(requestGetCallbackError, expectedResponse, expectedBody);

				// Validation
				this.validate(basicFetcher, options, attemptsLeft, resource, callback, lastError,
					expectedError, expectedResponse, expectedBody, expectedResource, expectedCallback,
					false, false);
			});
			it('should fail hadling response error with http response 400', function() {
				// Object set-up
				var basicFetcher = new BasicFetcher({}, {
					retryDelay: 0
				}, {});

				// Input arguments
				var attemptsLeft = 1;
				var resource = Resource.instance('https://www.google.com', null);
				var options = { uri: resource.uri.toString() };
				var callback = function() {};
				var lastError = null;

				// Expected arguments to be passed to BasicFetcher.prototype.handleResponse
				var expectedError = new Error('HTTP 400 error fetching https://www.google.com/');
				expectedError.code = 400;
				const expectedResponse = null;
				const expectedBody = null;
				const expectedResource = resource;
				const expectedCallback = callback;

				// Spies, Stubs, Mocks
				requestGetStub.yields(null, { statusCode: expectedError.code }, expectedBody);

				// Validation
				this.validate(basicFetcher, options, attemptsLeft, resource, callback, lastError,
					expectedError, expectedResponse, expectedBody, expectedResource, expectedCallback,
					false, false);
			});
		});
	});
	describe('#handleResponse()', function() {
		before(function() {
			this.validate = function(basicFetcher, error, response, body, resource, callback,
			                         expectedError, expectedResource) {
				basicFetcher.handleResponse(error, response, body, resource, callback);

				sinon.assert.calledOnce(BasicFetcher.prototype.handleResponse);
				sinon.assert.calledWithExactly(BasicFetcher.prototype.handleResponse, error, response, body, resource, callback);
				sinon.assert.calledOnce(callback);
				sinon.assert.calledWithExactly(callback, expectedError, expectedResource);
				sinon.assert.calledOnce(BasicFetcher.prototype.runRequest);
			};
		});
		beforeEach(function() {
			this.sinon.spy(BasicFetcher.prototype, 'handleResponse');
			this.sinon.stub(BasicFetcher.prototype, 'runRequest');
		});
		it('should succeed hadling response', function() {
			// Object set-up
			var basicFetcher = new BasicFetcher({}, {}, {});

			// Input arguments
			var error = null;
			var response = { headers: {} };
			var body = 'body';
			var resource = Resource.instance('https://www.google.com', null);
			var callback = this.sinon.spy();

			// Expected arguments to be passed to the callback
			const expectedError = null;
			var expectedResource = resource;
			expectedResource.content = body;

			// Expected values
			const expectedTotalBytesFetched = body.length;
			const expectedResourceContent = body;
			const expectedActiveRequests = basicFetcher.activeRequests - 1;

			// Spies, Stubs, Mocks
			this.sinon.stub(PolicyChecker.prototype, 'isMimeTypeAllowed').returns(true);
			this.sinon.stub(PolicyChecker.prototype, 'isFileSizeAllowed').returns(true);
			this.sinon.stub(basicFetcher, 'decodeBuffer').returns(body);

			// Validation
			this.validate(basicFetcher, error, response, body, resource, callback,
				expectedError, expectedResource);

			// Specific validation
			basicFetcher.totalBytesFetched.should.be.equal(expectedTotalBytesFetched);
			resource.content.should.be.equal(expectedResourceContent);
			basicFetcher.activeRequests.should.be.equal(expectedActiveRequests);
		});
	});
});