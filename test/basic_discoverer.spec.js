/**
 * Created by Roy on 12/08/2016.
 */

// core modules
var EventEmitter             = require('events');

// npm modules
var chai                     = require('chai'),
	chai_things              = require('chai-things'),
	sinon                    = require('sinon'),
	URI                      = require('urijs');

// lib modules
require('./spec_helper');

var helpers                  = require('../lib/helpers'),
	kaiser                   = require('../index'),
	PolicyChecker            = require('../lib/policy_checker'),
	resourceWorkerSpecHelper = require('./resource_worker_spec_helper');

var Discoverer               = kaiser.Discoverer,
	BasicDiscoverer          = kaiser.BasicDiscoverer;

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
			const expectedCrawler = 'crawler';

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
			};
		});
		beforeEach(function() {
			this.sinon.spy(BasicDiscoverer, 'init');
			this.sinon.stub(Discoverer, 'init');
		});
		it('should initialize BasicDiscoverer instance with default parameters', function() {
			// Object set-up
			var basicDiscoverer = {};

			// Input arguments
			var crawler = 'crawler';

			// Expected arguments to be passed to Discoverer.init
			const expectedCrawler = 'crawler';

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
		});
	});
	describe('#logic()', function() {
		before(function () {
			this.validate = function (basicDiscoverer, resource, callback,
			                          expectedError, expectedResource, expectedUris) {
				basicDiscoverer.logic(resource, callback);

				sinon.assert.calledOnce(BasicDiscoverer.prototype.logic);
				sinon.assert.calledWithExactly(BasicDiscoverer.prototype.logic, resource, callback);
				sinon.assert.calledOnce(callback);
				if (expectedUris) {
					sinon.assert.calledWithExactly(callback, expectedError, expectedResource, expectedUris);
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
			var resource = {
				uri: new URI('https://www.google.com'),
				depth: 0,
				originator: null
			};
			var callback = this.sinon.spy();

			// Expected arguments to be passed to the callback
			const expectedError = null;
			const expectedResource = {
				uri: new URI('https://www.google.com'),
				depth: 0,
				originator: null
			};

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
			var resource = {
				uri: new URI('https://www.google.com'),
				depth: 0,
				originator: null
			};
			var callback = this.sinon.spy();

			// Expected arguments to be passed to the callback
			const expectedError = null;
			const expectedResource = {
				uri: new URI('https://www.google.com'),
				depth: 0,
				originator: null
			};

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
			var resource = {
				uri: new URI('https://www.google.com'),
				depth: 0,
				originator: null
			};
			var callback = this.sinon.spy();

			// Expected arguments to be passed to the callback
			const expectedError = null;
			const expectedResource = {
				uri: new URI('https://www.google.com'),
				depth: 0,
				originator: null
			};
			const expectedResult = [];

			// Spies, Stubs, Mocks
			this.sinon.stub(PolicyChecker.prototype, 'isDepthAllowed').returns(true);
			this.sinon.stub(BasicDiscoverer.prototype, 'getUris');
			this.sinon.stub(BasicDiscoverer.prototype, 'formatUris');
			this.sinon.stub(BasicDiscoverer.prototype, 'filterUris').returns([]);

			// Validation
			this.validate(basicDiscoverer, resource, callback,
				expectedError, expectedResource, expectedResult);
		});
		it('should discover more resources successfully', function() {
			// Object set-up
			var eventEmitter = new EventEmitter();
			eventEmitter.__proto__.crawl = this.sinon.stub();
			var basicDiscoverer = new BasicDiscoverer(eventEmitter, {}, {});

			// Input arguments
			var resource = {
				uri: new URI('https://www.google.com'),
				depth: 0,
				originator: null
			};
			var callback = this.sinon.spy();

			// Expected arguments to be passed to the callback
			const expectedError = null;
			var expectedResource = {
				uri: new URI('https://www.google.com'),
				depth: 0,
				originator: null
			};
			const expectedResult = [new URI('http://www.google.com')];

			// Spies, Stubs, Mocks
			this.sinon.stub(PolicyChecker.prototype, 'isDepthAllowed').returns(true);
			this.sinon.stub(BasicDiscoverer.prototype, 'getUris');
			this.sinon.stub(BasicDiscoverer.prototype, 'formatUris');
			this.sinon.stub(BasicDiscoverer.prototype, 'filterUris').returns([new URI('http://www.google.com')]);

			// Validation
			this.validate(basicDiscoverer, resource, callback,
				expectedError, expectedResource, expectedResult);

			// Specific validation pre-conditions
			delete expectedResource.originator;

			// Specific validation
			sinon.assert.calledOnce(eventEmitter.crawl);
			sinon.assert.calledWithExactly(eventEmitter.crawl, expectedResult, expectedResource);
		});
	});
	describe('#getUris()', function() {
		before(function () {
			this.validate = function (basicDiscoverer, resource, expectedUris) {
				basicDiscoverer.getUris(resource);

				sinon.assert.calledOnce(BasicDiscoverer.prototype.getUris);
				sinon.assert.calledWithExactly(BasicDiscoverer.prototype.getUris, resource);
				BasicDiscoverer.prototype.getUris.returned(expectedUris).should.be.true;
			};
		});
		beforeEach(function () {
			this.sinon.spy(BasicDiscoverer.prototype, 'getUris');
			resourceWorkerSpecHelper.beforeEach.call(this);
		});
		it('should get resource\'s uri successfully', function () {
			// Object set-up
			var basicDiscoverer = new BasicDiscoverer({}, {}, {});

			// Input arguments
			var resource = {
				uri: new URI('https://www.google.com'),
				depth: 0,
				originator: null
			};
			resource.content = '<head><body><p>http://www.google.com</p></body></head>';

			// Expected arguments to be passed to the callback
			const expectedUris = ['http://www.google.com'];

			// Validation
			this.validate(basicDiscoverer, resource, expectedUris);
		});
	});
	describe('#formatUris()', function() {
		before(function () {
			this.validate = function (basicDiscoverer, resource, uris,
			                          expectedUris) {
				basicDiscoverer.formatUris(resource, uris);

				sinon.assert.calledOnce(BasicDiscoverer.prototype.formatUris);
				sinon.assert.calledWithExactly(BasicDiscoverer.prototype.formatUris, resource, uris);
				BasicDiscoverer.prototype.formatUris.returned(expectedUris).should.be.true;
			};
		});
		beforeEach(function () {
			this.sinon.spy(BasicDiscoverer.prototype, 'formatUris');
			this.helpersNormalizeUriStub = this.sinon.stub(helpers, 'normalizeUri');
		});
		it('should format uris successfully', function () {
			// Object set-up
			var basicDiscoverer = new BasicDiscoverer({}, {}, {});

			// Input arguments
			var resource = {
				uri: new URI('https://www.google.com'),
				depth: 0,
				originator: null
			};
			resource.content = '<head><body><p>http://www.google.com</p></body></head>';
			var uris = ['http://www.google.com'];

			// Expected arguments to be passed to the callback
			const expectedUris = [new URI('http://google.com/')];

			// Spies, Stubs, Mocks
			this.helpersNormalizeUriStub.returns(new URI('http://google.com/'));

			// Validation
			this.validate(basicDiscoverer, resource, uris,
				expectedUris);
		});
		it('should format uris successfully while emitting discovererror due to malformed uri', function () {
			// Object set-up
			var eventEmitter = new EventEmitter();
			eventEmitter.__proto__.crawl = this.sinon.stub();
			var basicDiscoverer = new BasicDiscoverer(eventEmitter, {}, {});

			// Input arguments
			var resource = {
				uri: new URI('https://www.google.com'),
				depth: 0,
				originator: null
			};
			resource.content = '<head><body><p>http://www.google.com</p></body></head>';
			var uris = ['http://www.google.com'];

			// Expected arguments to be passed to the callback
			const expectedUris = [];

			// Expected values to be passed to the 'discovererror` event spy
			var expectedEventResource = {
				uri: new URI('https://www.google.com'),
				depth: 0,
				originator: null
			};
			expectedEventResource.content = '<head><body><p>http://www.google.com</p></body></head>';
			const expectedEventUri = new URI('http://www.google.com/');
			const expectedEventError = new Error('oops');

			// Spies, Stubs, Mocks
			this.helpersNormalizeUriStub.throws(new Error('oops'));
			resourceWorkerSpecHelper.beforeEach.call(this);

			// Specific validation pre-conditions
			var discoverErrorEventSpy = this.sinon.spy();
			basicDiscoverer.crawler.on('discovererror', discoverErrorEventSpy);

			// Validation
			this.validate(basicDiscoverer, resource, uris,
				expectedUris);

			// Specific validation
			sinon.assert.calledOnce(discoverErrorEventSpy);
			sinon.assert.calledWithExactly(discoverErrorEventSpy, expectedEventResource, expectedEventUri, expectedEventError);
		});
	});
	describe('#filterUris()', function() {
		before(function () {
			this.validate = function (basicDiscoverer, uris, expectedUris) {
				basicDiscoverer.filterUris(uris);

				sinon.assert.calledOnce(BasicDiscoverer.prototype.filterUris);
				sinon.assert.calledWithExactly(BasicDiscoverer.prototype.filterUris, uris);
				BasicDiscoverer.prototype.filterUris.returned(expectedUris).should.be.true;
			};
		});
		beforeEach(function () {
			this.sinon.spy(BasicDiscoverer.prototype, 'filterUris');
			resourceWorkerSpecHelper.beforeEach.call(this);
		});
		it('should filter uris successfully', function () {
			// Object set-up
			var basicDiscoverer = new BasicDiscoverer({}, {}, {});

			// Input arguments
			var uris = [new URI('http://google.com/')];

			// Expected arguments to be passed to the callback
			const expectedUris = [new URI('http://google.com/')];

			// Spies, Stubs, Mocks
			this.sinon.stub(basicDiscoverer, 'filterPolicyCheckNotPassingUris');
			this.sinon.stub(basicDiscoverer, 'filterAnchors');
			this.sinon.stub(basicDiscoverer, 'filterDuplicatedUris').returns([new URI('http://google.com/')]);

			// Validation
			this.validate(basicDiscoverer, uris, expectedUris);
		});
	});
	describe('#filterPolicyCheckNotPassingUris()', function() {
		before(function () {
			this.validate = function (basicDiscoverer, uris, expectedUris) {
				basicDiscoverer.filterPolicyCheckNotPassingUris(uris);

				sinon.assert.calledOnce(BasicDiscoverer.prototype.filterPolicyCheckNotPassingUris);
				sinon.assert.calledWithExactly(BasicDiscoverer.prototype.filterPolicyCheckNotPassingUris, uris);
				BasicDiscoverer.prototype.filterPolicyCheckNotPassingUris.returned(expectedUris).should.be.true;
			};
		});
		beforeEach(function () {
			this.sinon.spy(BasicDiscoverer.prototype, 'filterPolicyCheckNotPassingUris');
			resourceWorkerSpecHelper.beforeEach.call(this);
		});
		it('should filter uris by policy checker successfully', function () {
			// Object set-up
			var basicDiscoverer = new BasicDiscoverer({}, {}, {});

			// Input arguments
			var uris = [new URI('http://google.com/')];

			// Expected return value by filterPolicyCheckNotPassingUris()
			var expectedUri = new URI('http://google.com/');
			expectedUri.toString(); // build expectedResource.__proto__._string property
			const expectedUris = [expectedUri];

			// Spies, Stubs, Mocks
			this.sinon.stub(PolicyChecker.prototype, 'isProtocolAllowed').returns(true);
			this.sinon.stub(PolicyChecker.prototype, 'isFileTypeAllowed').returns(true);
			this.sinon.stub(PolicyChecker.prototype, 'isHostnameAllowed').returns(true);
			this.sinon.stub(PolicyChecker.prototype, 'isLinkAllowed').returns(true);

			// Validation
			this.validate(basicDiscoverer, uris, expectedUris);
		});
	});
	describe('#filterAnchors()', function() {
		before(function () {
			this.validate = function (basicDiscoverer, uris, expectedUris) {
				basicDiscoverer.filterAnchors(uris);

				sinon.assert.calledOnce(BasicDiscoverer.prototype.filterAnchors);
				sinon.assert.calledWithExactly(BasicDiscoverer.prototype.filterAnchors, uris);
				BasicDiscoverer.prototype.filterAnchors.returned(expectedUris).should.be.true;
			};
		});
		beforeEach(function () {
			this.sinon.spy(BasicDiscoverer.prototype, 'filterAnchors');
			resourceWorkerSpecHelper.beforeEach.call(this);
		});
		it('should filter uris by anchors successfully', function () {
			// Object set-up
			var basicDiscoverer = new BasicDiscoverer({}, {}, {});

			// Input arguments
			var uris = [new URI('http://google.com/')];

			// Expected return value by filterPolicyCheckNotPassingUris()
			const expectedUris = [new URI('http://google.com/')];

			// Spies, Stubs, Mocks
			this.sinon.stub(helpers, 'isEmpty').returns(true);

			// Validation
			this.validate(basicDiscoverer, uris, expectedUris);
		});
	});
	describe('#filterDuplicatedUris()', function() {
		before(function () {
			this.validate = function (basicDiscoverer, uris, expectedUris) {
				basicDiscoverer.filterDuplicatedUris(uris);

				sinon.assert.calledOnce(BasicDiscoverer.prototype.filterDuplicatedUris);
				sinon.assert.calledWithExactly(BasicDiscoverer.prototype.filterDuplicatedUris, uris);
				BasicDiscoverer.prototype.filterDuplicatedUris.returned(expectedUris).should.be.true;
			};
		});
		beforeEach(function () {
			this.sinon.spy(BasicDiscoverer.prototype, 'filterDuplicatedUris');
			resourceWorkerSpecHelper.beforeEach.call(this);
		});
		it('should filter duplicated uris successfully', function () {
			// Object set-up
			var basicDiscoverer = new BasicDiscoverer({}, {}, {});

			// Input arguments
			var uris = [new URI('http://google.com/')];

			// Expected return value by filterPolicyCheckNotPassingUris()
			const expectedUris = ['http://google.com/'];

			// Validation
			this.validate(basicDiscoverer, uris, expectedUris);
		});
	});
});