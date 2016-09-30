/**
 * Created by Roy on 10/09/2016.
 */

// core modules
var EventEmitter             = require('events'),
	path                     = require('path');

// npm modules
var chai                     = require('chai'),
	sinon                    = require('sinon'),
	expect                   = chai.expect,
	URI                      = require('urijs'),
	async                    = require('async'),
	robots                   = require('robots').RobotsParser;

// lib modules
var kaiser                   = require('../index'),
	helpers                  = require('../lib/helpers');

var Crawler                  = kaiser.Crawler,
	BasicComposer            = kaiser.BasicComposer,
	BasicFetcher             = kaiser.BasicFetcher,
	BasicDiscoverer          = kaiser.BasicDiscoverer,
	BasicTransformer         = kaiser.BasicTransformer,
	MemoryCache              = kaiser.MemoryCache;


require('./spec_helper');

chai.should();

describe('Crawler', function() {
	describe('Crawler()', function() {
		before(function() {
			this.validate = function(crawler, options, expectedOptions) {
				Crawler.call(crawler, options);

				sinon.assert.calledOnce(Crawler.init);
				sinon.assert.calledWithExactly(Crawler.init, expectedOptions);
			};
		});
		beforeEach(function() {
			this.sinon.stub(Crawler, 'init');
		});
		it('should construct Crawler instance successfully', function() {
			// Object set-up
			var crawler = {};
			var options = 'options';

			// Expected arguments to be passed to Crawler.init
			const expectedOptions = 'options';

			// Validation
			this.validate(crawler, options, expectedOptions);
		});
	});
	describe('.init()', function() {
		before(function() {
			this.validate = function(crawler, options,
			                         expectedUri, expectedFollowRobotsTxt, expectedMaxDepth,
			                         expectedMaxExternalDepth, expectedMaxFileSize, expectedMaxLinkNumber,
			                         expectedSiteSizeLimit, expectedMaxTimeOverall) {
				Crawler.init.call(crawler, options);
				sinon.assert.calledOnce(Crawler.init);
				sinon.assert.calledWithExactly(Crawler.init, options);
				crawler.uri.should.be.equal(expectedUri);
				crawler.isStopping.should.be.equal(false);
				crawler.should.have.property('activeCrawls').and.to.be.instanceof(Array).and.to.be.empty;
				crawler.followRobotsTxt.should.be.equal(expectedFollowRobotsTxt);
				crawler.maxDepth.should.be.equal(expectedMaxDepth);
				crawler.maxExternalDepth.should.be.equal(expectedMaxExternalDepth);
				crawler.maxFileSize.should.be.equal(expectedMaxFileSize);
				crawler.maxLinkNumber.should.be.equal(expectedMaxLinkNumber);
				crawler.siteSizeLimit.should.be.equal(expectedSiteSizeLimit);
				crawler.maxTimeOverall.should.be.equal(expectedMaxTimeOverall);
				crawler.should.have.property('allowedProtocols').and.to.be.instanceof(Array).and.to.be.deep.equal(['http', 'https']);
				crawler.should.have.property('allowedFileTypes').and.to.be.instanceof(Array).and.to.be.deep.equal(['html', 'htm', 'css', 'js', 'xml', 'gif', 'jpg', 'jpeg', 'png', 'tif', 'bmp', 'eot', 'svg', 'ttf', 'woff', 'txt', 'htc', 'php', 'asp', '']);
				crawler.should.have.property('allowedMimeTypes').and.to.be.instanceof(Array).and.to.be.deep.equal([/^text\/.+$/i, /^application\/(?:x-)?javascript$/i, /^application\/(?:rss|xhtml)(?:\+xml)?/i, /\/xml$/i, /^image\/.+$/i, /application\/octet-stream/i]);
				crawler.should.have.property('disallowedHostnames').and.to.be.instanceof(Array).and.to.be.empty;
				crawler.should.have.property('allowedLinks').and.to.be.instanceof(Array).and.to.be.deep.equal([/.*/i]);
			};
		});
		beforeEach(function() {
			this.sinon.spy(Crawler, 'init');
		});
		it('should initialize Crawler instance with default parameters', function() {
			// Object set-up
			var crawler = {};

			// Input arguments
			var options = {
				uri: 'https://www.google.com'
			};

			// Expected values crawler will be set to
			const expectedUri = new URI('https://www.google.com');
			const expectedFollowRobotsTxt = false;
			const expectedMaxDepth = 1;
			const expectedMaxExternalDepth = 0;
			const expectedMaxFileSize = 1024 * 1024 * 16;
			const expectedMaxLinkNumber = Number.POSITIVE_INFINITY;
			const expectedSiteSizeLimit = Number.POSITIVE_INFINITY;
			const expectedMaxTimeOverall = Number.POSITIVE_INFINITY;

			// Spies, Stubs, Mocks
			this.sinon.stub(helpers, 'normalizeUri').returns(expectedUri);
			this.sinon.stub(helpers, 'isInteger').returns(false);
			this.sinon.stub(helpers, 'isNullOrUndefined').returns(true);
			this.sinon.stub(path, 'dirname').returns('dir');

			// Validation
			this.validate(crawler, options,
				expectedUri, expectedFollowRobotsTxt, expectedMaxDepth,
				expectedMaxExternalDepth, expectedMaxFileSize, expectedMaxLinkNumber,
				expectedSiteSizeLimit, expectedMaxTimeOverall);
		});
		it('should initialize Crawler instance with custom parameters and custom pipeline components', function() {
			// Object set-up
			var crawler = {};

			// Input arguments
			var options = {
				uri: 'https://www.google.com',
				followRobotsTxt: true,
				maxDepth: 3,
				maxExternalDepth: 1,
				maxFileSize: 1024,
				maxLinkNumber: 1000,
				siteSizeLimit: 4096,
				maxTimeOverall: 100000,
				composer: new BasicComposer(),
				fetcher: new BasicFetcher(null, {}, {}),
				discoverer: new BasicDiscoverer(),
				transformer: new BasicTransformer(null, {
					rewriteLinksFileTypes: []
				}),
				cache: new MemoryCache()
			};

			// Expected values crawler will be set to
			const expectedUri = new URI('https://www.google.com');
			const expectedFollowRobotsTxt = true;
			const expectedMaxDepth = 3;
			const expectedMaxExternalDepth = 1;
			const expectedMaxFileSize = 1024;
			const expectedMaxLinkNumber = 1000;
			const expectedSiteSizeLimit = 4096;
			const expectedMaxTimeOverall = 100000;

			// Spies, Stubs, Mocks
			this.sinon.stub(helpers, 'normalizeUri').returns(expectedUri);
			this.sinon.stub(helpers, 'isInteger').returns(true);
			var helpersIsNullOrUndefinedStub = this.sinon.stub(helpers, 'isNullOrUndefined');
			helpersIsNullOrUndefinedStub
				.onFirstCall().returns(true)
				.onSecondCall().returns(true)
				.onThirdCall().returns(false);
			helpersIsNullOrUndefinedStub.returns(true);

			// Validation
			this.validate(crawler, options,
				expectedUri, expectedFollowRobotsTxt, expectedMaxDepth,
				expectedMaxExternalDepth, expectedMaxFileSize, expectedMaxLinkNumber,
				expectedSiteSizeLimit, expectedMaxTimeOverall);
		});
		it('should initialize Crawler instance with custom parameters and custom pipeline components parameters', function() {
			// Object set-up
			var crawler = {};

			// Input arguments
			var options = {
				uri: 'https://www.google.com',
				followRobotsTxt: true,
				maxDepth: 3,
				maxExternalDepth: 1,
				maxFileSize: 1024,
				maxLinkNumber: 1000,
				siteSizeLimit: 4096,
				maxTimeOverall: 100000,
				rewriteLinksFileTypes: [],
				strictSSL: false,
				timeout: 1000,
				maxSockets: 5,
				userAgent: 'userAgent',
				acceptCookies: false,
				proxy: 'https://www.google.com',
				maxConcurrentRequests: 10,
				retryDelay: 10000,
				maxAttempts: 3
			};

			// Expected values crawler will be set to
			const expectedUri = new URI('https://www.google.com');
			const expectedFollowRobotsTxt = true;
			const expectedMaxDepth = 3;
			const expectedMaxExternalDepth = 1;
			const expectedMaxFileSize = 1024;
			const expectedMaxLinkNumber = 1000;
			const expectedSiteSizeLimit = 4096;
			const expectedMaxTimeOverall = 100000;

			// Spies, Stubs, Mocks
			this.sinon.stub(helpers, 'normalizeUri').returns(expectedUri);
			this.sinon.stub(helpers, 'isInteger').returns(true);
			var helpersIsNullOrUndefinedStub = this.sinon.stub(helpers, 'isNullOrUndefined');
			helpersIsNullOrUndefinedStub
				.onFirstCall().returns(true)
				.onSecondCall().returns(true)
				.onThirdCall().returns(false)
				.onCall(9).returns(false)
				.onCall(10).returns(false);
			helpersIsNullOrUndefinedStub.returns(true);
			this.sinon.stub(path, 'dirname').returns('dir');

			// Validation
			this.validate(crawler, options,
				expectedUri, expectedFollowRobotsTxt, expectedMaxDepth,
				expectedMaxExternalDepth, expectedMaxFileSize, expectedMaxLinkNumber,
				expectedSiteSizeLimit, expectedMaxTimeOverall);
		});
		it('should initialize Crawler instance with default parameters and then fails to initialze the parameters again', function() {
			// Object set-up
			var crawler = {};

			// Input arguments
			var options = {
				uri: 'https://www.google.com'
			};

			// Expected values crawler will be set to
			const expectedUri = new URI('https://www.google.com');
			const expectedFollowRobotsTxt = false;
			const expectedMaxDepth = 1;
			const expectedMaxExternalDepth = 0;
			const expectedMaxFileSize = 1024 * 1024 * 16;
			const expectedMaxLinkNumber = Number.POSITIVE_INFINITY;
			const expectedSiteSizeLimit = Number.POSITIVE_INFINITY;
			const expectedMaxTimeOverall = Number.POSITIVE_INFINITY;

			// Spies, Stubs, Mocks
			this.sinon.stub(helpers, 'normalizeUri').returns(expectedUri);
			this.sinon.stub(helpers, 'isInteger').returns(false);
			var helpersIsNullOrUndefinedStub = this.sinon.stub(helpers, 'isNullOrUndefined').returns(true);
			helpersIsNullOrUndefinedStub
				.onCall(11).returns(false)
				.onCall(12).returns(false)
				.onCall(13).returns(false)
				.onCall(14).returns(false)
				.onCall(15).returns(false)
				.onCall(16).returns(false)
				.onCall(17).returns(false)
				.onCall(18).returns(false);
			this.sinon.stub(path, 'dirname').returns('dir');

			// Validation
			this.validate(crawler, options,
				expectedUri, expectedFollowRobotsTxt, expectedMaxDepth,
				expectedMaxExternalDepth, expectedMaxFileSize, expectedMaxLinkNumber,
				expectedSiteSizeLimit, expectedMaxTimeOverall);

			// Specific validation pre-conditions
			Crawler.init.call(crawler, options);

			// Specific validation
			sinon.assert.calledTwice(Crawler.init);
			sinon.assert.calledWithExactly(Crawler.init, options);
			crawler.uri.should.be.equal(expectedUri);
			crawler.isStopping.should.be.equal(false);
			crawler.should.have.property('activeCrawls').and.to.be.instanceof(Array).and.to.be.empty;
			crawler.followRobotsTxt.should.be.equal(expectedFollowRobotsTxt);
			crawler.maxDepth.should.be.equal(expectedMaxDepth);
			crawler.maxExternalDepth.should.be.equal(expectedMaxExternalDepth);
			crawler.maxFileSize.should.be.equal(expectedMaxFileSize);
			crawler.maxLinkNumber.should.be.equal(expectedMaxLinkNumber);
			crawler.siteSizeLimit.should.be.equal(expectedSiteSizeLimit);
			crawler.maxTimeOverall.should.be.equal(expectedMaxTimeOverall);
			crawler.should.have.property('allowedProtocols').and.to.be.instanceof(Array).and.to.be.deep.equal(['http', 'https']);
			crawler.should.have.property('allowedFileTypes').and.to.be.instanceof(Array).and.to.be.deep.equal(['html', 'htm', 'css', 'js', 'xml', 'gif', 'jpg', 'jpeg', 'png', 'tif', 'bmp', 'eot', 'svg', 'ttf', 'woff', 'txt', 'htc', 'php', 'asp', '']);
			crawler.should.have.property('allowedMimeTypes').and.to.be.instanceof(Array).and.to.be.deep.equal([/^text\/.+$/i, /^application\/(?:x-)?javascript$/i, /^application\/(?:rss|xhtml)(?:\+xml)?/i, /\/xml$/i, /^image\/.+$/i, /application\/octet-stream/i]);
			crawler.should.have.property('disallowedHostnames').and.to.be.instanceof(Array).and.to.be.empty;
			crawler.should.have.property('allowedLinks').and.to.be.instanceof(Array).and.to.be.deep.equal([/.*/i]);
		});
		it('should fail to initialize Crawler instance because `options` is not provided', function() {
			// Object set-up
			var crawler = {};

			// Specific validation
			expect(Crawler.init.bind(crawler)).to.throw(Error, 'options must be given to construct a crawler');
		});
		it('should fail to initialize Crawler instance because `options.uri` is not provided', function() {
			// Object set-up
			var crawler = {};

			// Input arguments
			var options = {};

			// Specific validation
			expect(Crawler.init.bind(crawler, options)).to.throw(Error, 'options must provide uri');
		});
	});
	describe('#start()', function() {
		before(function () {
			this.clock = sinon.useFakeTimers();
			this.validate = function (crawler, expectedUris, expectedOriginator) {
				Crawler.prototype.start.call(crawler);
				this.clock.tick(0);

				sinon.assert.calledOnce(Crawler.prototype.start);
				sinon.assert.calledWithExactly(Crawler.prototype.start);
				sinon.assert.calledOnce(crawler.crawl);
				sinon.assert.calledWithExactly(crawler.crawl, expectedUris, expectedOriginator);
				Crawler.prototype.start.returned(crawler).should.be.true;
			};
		});
		beforeEach(function () {
			this.sinon.spy(Crawler.prototype, 'start');
		});
		after(function () {
			this.clock.restore();
		});
		it('should start the crawling process successfully', function() {
			//Object set-up
			var crawler = new EventEmitter();
			crawler.uri = 'https://google.com/';
			crawler.init = this.sinon.stub();
			crawler.crawl = this.sinon.stub();

			// Expected arguments to be passed to Crawler.prototype.crawl()
			const expectedUris = ['https://google.com/'];
			const expectedOriginator = null;

			// Spies, Stubs, Mocks
			var crawlStartEventSpy = this.sinon.spy();
			crawler.on('crawlstart', crawlStartEventSpy);
			this.sinon.stub(async, 'waterfall').yields();

			// Validation
			this.validate(crawler, expectedUris, expectedOriginator);
			sinon.assert.calledOnce(crawlStartEventSpy);
			sinon.assert.calledWithExactly(crawlStartEventSpy);
		});
	});
	describe('#init()', function() {
		before(function () {
			this.validate = function (crawler, expectedCrawlStartTime) {
				Crawler.prototype.init.call(crawler, this.callback);

				sinon.assert.calledOnce(Crawler.prototype.init);
				sinon.assert.calledWithExactly(Crawler.prototype.init, this.callback);
				sinon.assert.calledOnce(this.callback);
				sinon.assert.calledWithExactly(this.callback);
				crawler.crawlStartTime.should.be.equal(expectedCrawlStartTime);
			};
		});
		beforeEach(function () {
			this.sinon.spy(Crawler.prototype, 'init');
			this.callback = this.sinon.stub();
		});
		it('should initialize the crawling process with robots parser successfully', function() {
			//Object set-up
			var crawler = {
				uri: new URI('https://www.google.com'),
				followRobotsTxt: true
			};

			// Expected values crawler is going to be set to
			const expectedCrawlStartTime = 5;

			// Spies, Stubs, Mocks
			this.sinon.stub(Date, 'now').returns(5);
			this.sinon.stub(robots.prototype, 'setUrl').onSecondCall().yields(null, true);

			// Validation
			this.validate(crawler, expectedCrawlStartTime);
		});
		it('should fail to initialize the crawling process with robots parser because of an error', function() {
			//Object set-up
			var crawler = {
				uri: new URI('https://www.google.com'),
				followRobotsTxt: true
			};

			// Expected values crawler is going to be set to
			const expectedCrawlStartTime = 5;

			// Spies, Stubs, Mocks
			this.sinon.stub(Date, 'now').returns(5);
			this.sinon.stub(robots.prototype, 'setUrl').onSecondCall().yields(null, false);

			// Validation
			this.validate(crawler, expectedCrawlStartTime);

			// Specific validation
			expect(crawler.robotsParser).to.be.null;
		});
		it('should not initialize the crawling process with robots parser because of crawler options `followRobotsTxt` set to false', function() {
			//Object set-up
			var crawler = {
				uri: new URI('https://www.google.com'),
				followRobotsTxt: false
			};

			// Expected values crawler is going to be set to
			const expectedCrawlStartTime = 5;

			// Spies, Stubs, Mocks
			this.sinon.stub(Date, 'now').returns(5);

			// Validation
			this.validate(crawler, expectedCrawlStartTime);

			// Specific validation
			expect(crawler.robotsParser).to.be.undefined;
		});
	});
	describe('#crawl()', function() {
		before(function () {
			this.clock = sinon.useFakeTimers();
			this.validate = function (crawler, uris, originator) {
				Crawler.prototype.crawl.call(crawler, uris, originator);
				this.clock.tick(0);

				sinon.assert.calledOnce(Crawler.prototype.crawl);
				sinon.assert.calledWithExactly(Crawler.prototype.crawl, uris, originator);
				sinon.assert.calledOnce(crawler.composer.work);
				sinon.assert.calledWith(crawler.composer.work, originator, uris);
			};
		});
		beforeEach(function () {
			this.sinon.spy(Crawler.prototype, 'crawl');
		});
		it('should crawl successfully', function() {
			//Object set-up
			var crawler = new EventEmitter();
			var resource = {
				uri: new URI('https://www.google.com'),
				originator: null,
				depth: 0
			};
			crawler.composer = {
				work: this.sinon.stub().yields(null, [resource])
			};
			crawler.fetcher = {
				work: this.sinon.stub().yields(null, resource)
			};
			crawler.discoverer = {
				work: this.sinon.stub().yields(null, resource)
			};
			crawler.transformer = {
				work: this.sinon.stub().yields(null, resource)
			};
			crawler.cache = {
				work: this.sinon.stub().yields(null)
			};
			crawler.activeCrawls = [];
			crawler.stop = this.sinon.stub();

			// Input arguments
			var uris = [new URI('https://www.google.com')];
			var originator = null;

			// Expected values crawler is going to be set to
			const expectedActiveCrawls = [];

			// Expected values to be passed to the 'crawlbulkstart` event spy
			const expectedCrawlBulkStartEventUris = [new URI('https://www.google.com')];
			const expectedCrawlBulkStartEventOriginator = null;

			// Expected values to be passed to the 'crawlbulkcomplete` event spy
			const expectedCrawlBulkCompleteEventResult = [{
				uri: new URI('https://www.google.com'),
				originator: null,
				depth: 0
			}];
			const expectedCrawlBulkStartCompleteOriginator = null;

			// Spies, Stubs, Mocks
			var crawlBulkStartEventSpy = this.sinon.spy();
			crawler.on('crawlbulkstart', crawlBulkStartEventSpy);
			var crawlBulkCompleteEventSpy = this.sinon.spy();
			crawler.on('crawlbulkcomplete', crawlBulkCompleteEventSpy);

			// Validation
			this.validate(crawler, uris, originator);
			sinon.assert.calledOnce(crawlBulkStartEventSpy);
			sinon.assert.calledWithExactly(crawlBulkStartEventSpy, expectedCrawlBulkStartEventUris, expectedCrawlBulkStartEventOriginator);
			crawler.activeCrawls.should.be.deep.equal(expectedActiveCrawls);
			sinon.assert.calledOnce(crawlBulkCompleteEventSpy);
			sinon.assert.calledWithExactly(crawlBulkCompleteEventSpy, expectedCrawlBulkCompleteEventResult, expectedCrawlBulkStartCompleteOriginator);

			// Specific validation
			sinon.assert.calledOnce(crawler.fetcher.work);
			sinon.assert.calledWith(crawler.fetcher.work, resource);
			sinon.assert.calledOnce(crawler.discoverer.work);
			sinon.assert.calledWith(crawler.discoverer.work, resource);
			sinon.assert.calledOnce(crawler.transformer.work);
			sinon.assert.calledWith(crawler.transformer.work, resource);
			sinon.assert.calledOnce(crawler.cache.work);
			sinon.assert.calledWith(crawler.cache.work, resource);
			sinon.assert.calledOnce(crawler.stop);
			sinon.assert.calledWithExactly(crawler.stop);
		});
		it('should fail to crawl a resource due to pipeline error and not stop crawling', function() {
			//Object set-up
			var crawler = new EventEmitter();
			var resource = {
				uri: new URI('https://www.google.com'),
				originator: null,
				depth: 0
			};
			crawler.composer = {
				work: this.sinon.stub().yields(null, [resource])
			};
			crawler.fetcher = {
				work: this.sinon.stub().yields(new Error('oops'), resource)
			};
			crawler.discoverer = {
				work: this.sinon.stub()
			};
			crawler.transformer = {
				work: this.sinon.stub()
			};
			crawler.cache = {
				work: this.sinon.stub()
			};
			crawler.activeCrawls = [1];

			// Input arguments
			var uris = [new URI('https://www.google.com')];
			var originator = null;

			// Expected values crawler is going to be set to
			const expectedActiveCrawls = [1];

			// Expected values to be passed to the 'crawlbulkstart` event spy
			const expectedCrawlBulkStartEventUris = [new URI('https://www.google.com')];
			const expectedCrawlBulkStartEventOriginator = null;

			// Expected values to be passed to the 'crawlbulkcomplete` event spy
			const expectedCrawlBulkCompleteEventResult = [];
			const expectedCrawlBulkStartCompleteOriginator = null;

			// Spies, Stubs, Mocks
			var crawlBulkStartEventSpy = this.sinon.spy();
			crawler.on('crawlbulkstart', crawlBulkStartEventSpy);
			var crawlBulkCompleteEventSpy = this.sinon.spy();
			crawler.on('crawlbulkcomplete', crawlBulkCompleteEventSpy);

			// Validation
			this.validate(crawler, uris, originator);
			sinon.assert.calledOnce(crawlBulkStartEventSpy);
			sinon.assert.calledWithExactly(crawlBulkStartEventSpy, expectedCrawlBulkStartEventUris, expectedCrawlBulkStartEventOriginator);
			crawler.activeCrawls.should.be.deep.equal(expectedActiveCrawls);
			sinon.assert.calledOnce(crawlBulkCompleteEventSpy);
			sinon.assert.calledWithExactly(crawlBulkCompleteEventSpy, expectedCrawlBulkCompleteEventResult, expectedCrawlBulkStartCompleteOriginator);

			// Specific validation
			sinon.assert.calledOnce(crawler.fetcher.work);
			sinon.assert.calledWith(crawler.fetcher.work, resource);
		});
	});
	describe('#stop()', function() {
		before(function () {
			this.validate = function (crawler) {
				Crawler.prototype.stop.call(crawler);

				sinon.assert.calledOnce(Crawler.prototype.stop);
				sinon.assert.calledWithExactly(Crawler.prototype.stop);
				sinon.assert.calledOnce(crawler.cleanup);
				sinon.assert.calledWithExactly(crawler.cleanup);
				Crawler.prototype.stop.returned(crawler).should.be.true;
			};
		});
		beforeEach(function () {
			this.sinon.spy(Crawler.prototype, 'stop');
		});
		it('should stop the crawling process successfully', function() {
			//Object set-up
			var crawler = new EventEmitter();
			crawler.cleanup = this.sinon.stub();

			// Spies, Stubs, Mocks
			var crawlCompleteEventSpy = this.sinon.spy();
			crawler.on('crawlcomplete', crawlCompleteEventSpy);

			// Validation
			this.validate(crawler);
			sinon.assert.calledOnce(crawlCompleteEventSpy);
			sinon.assert.calledWithExactly(crawlCompleteEventSpy);
		});
	});
	describe('#cleanup()', function() {
		before(function () {
			this.validate = function (crawler) {
				Crawler.prototype.cleanup.call(crawler);

				sinon.assert.calledOnce(Crawler.prototype.cleanup);
				sinon.assert.calledWithExactly(Crawler.prototype.cleanup);
				crawler.isStopping.should.be.false;
				crawler.should.have.property('activeCrawls').and.to.be.instanceof(Array).and.to.be.empty;
				crawler.fetcher.should.have.property('pendingRequests').and.to.be.instanceof(Array).and.to.be.empty;
				crawler.fetcher.activeRequests.should.be.equal(0);
			};
		});
		beforeEach(function () {
			this.sinon.spy(Crawler.prototype, 'cleanup');
		});
		it('should clean the crawling process successfully', function() {
			//Object set-up
			var crawler = new EventEmitter();
			crawler.isStopping = true;
			crawler.activeCrawls = [1];
			crawler.fetcher = {
				pendingRequests: [1],
				activeRequests: 1
			};

			// Validation
			this.validate(crawler);
		});
	});
});