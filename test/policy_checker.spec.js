/**
 * Created by Roy on 03/09/2016.
 */

// npm modules
var chai                     = require('chai'),
	sinon                    = require('sinon'),
	URI                      = require('urijs');

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
		it('should construct PolicyChecker instance successfully', function() {
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
		it('should initialize PolicyChecker instance with default parameters', function() {
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
	describe('#isProtocolAllowed()', function() {
		before(function() {
			this.validate = function(policyChecker, protocol, expectedReturnValue) {
				PolicyChecker.prototype.isProtocolAllowed.call(policyChecker, protocol);

				sinon.assert.calledOnce(PolicyChecker.prototype.isProtocolAllowed);
				sinon.assert.calledWithExactly(PolicyChecker.prototype.isProtocolAllowed, protocol);
				PolicyChecker.prototype.isProtocolAllowed.returned(expectedReturnValue).should.be.true;
			};
		});
		beforeEach(function() {
			this.sinon.spy(PolicyChecker.prototype, 'isProtocolAllowed');
		});
		it('should check if protocol is allowed successfully', function() {
			// Object set-up
			var policyChecker = {
				crawler: {
					allowedProtocols: [
						'http'
					]
				}
			};

			// Input arguments
			var protocol = 'http';

			// Expected return value by isProtocolAllowed()
			const expectedReturnValue = true;

			// Validation
			this.validate(policyChecker, protocol, expectedReturnValue);
		});
	});
	describe('#isFileTypeAllowed()', function() {
		before(function() {
			this.validate = function(policyChecker, fileType, expectedReturnValue) {
				PolicyChecker.prototype.isFileTypeAllowed.call(policyChecker, fileType);

				sinon.assert.calledOnce(PolicyChecker.prototype.isFileTypeAllowed);
				sinon.assert.calledWithExactly(PolicyChecker.prototype.isFileTypeAllowed, fileType);
				PolicyChecker.prototype.isFileTypeAllowed.returned(expectedReturnValue).should.be.true;
			};
		});
		beforeEach(function() {
			this.sinon.spy(PolicyChecker.prototype, 'isFileTypeAllowed');
		});
		it('should check if fileType is allowed successfully', function() {
			// Object set-up
			var policyChecker = {
				crawler: {
					allowedFileTypes: [
						'html'
					]
				}
			};

			// Input arguments
			var fileType = 'html';

			// Expected return value by isFileTypeAllowed()
			const expectedReturnValue = true;

			// Validation
			this.validate(policyChecker, fileType, expectedReturnValue);
		});
	});
	describe('#isMimeTypeAllowed()', function() {
		before(function() {
			this.validate = function(policyChecker, mimeType, expectedReturnValue) {
				PolicyChecker.prototype.isMimeTypeAllowed.call(policyChecker, mimeType);

				sinon.assert.calledOnce(PolicyChecker.prototype.isMimeTypeAllowed);
				sinon.assert.calledWithExactly(PolicyChecker.prototype.isMimeTypeAllowed, mimeType);
				PolicyChecker.prototype.isMimeTypeAllowed.returned(expectedReturnValue).should.be.true;
			};
		});
		beforeEach(function() {
			this.sinon.spy(PolicyChecker.prototype, 'isMimeTypeAllowed');
		});
		it('should check if mimeType is allowed successfully', function() {
			// Object set-up
			var policyChecker = {
				crawler: {
					allowedMimeTypes: [
						/text\/html/i
					]
				}
			};

			// Input arguments
			var mimeType = 'text/html';

			// Expected return value by isMimeTypeAllowed()
			const expectedReturnValue = true;

			// Validation
			this.validate(policyChecker, mimeType, expectedReturnValue);
		});
	});
	describe('#isHostnameAllowed()', function() {
		before(function() {
			this.validate = function(policyChecker, hostname, expectedReturnValue) {
				PolicyChecker.prototype.isHostnameAllowed.call(policyChecker, hostname);

				sinon.assert.calledOnce(PolicyChecker.prototype.isHostnameAllowed);
				sinon.assert.calledWithExactly(PolicyChecker.prototype.isHostnameAllowed, hostname);
				PolicyChecker.prototype.isHostnameAllowed.returned(expectedReturnValue).should.be.true;
			};
		});
		beforeEach(function() {
			this.sinon.spy(PolicyChecker.prototype, 'isHostnameAllowed');
		});
		it('should check if hostname is allowed successfully', function() {
			// Object set-up
			var policyChecker = {
				crawler: {
					disallowedHostnames: [
						'google.com'
					]
				}
			};

			// Input arguments
			var hostname = 'google.com';

			// Expected return value by isHostnameAllowed()
			const expectedReturnValue = false;

			// Validation
			this.validate(policyChecker, hostname, expectedReturnValue);
		});
	});
	describe('#isLinkAllowed()', function() {
		before(function() {
			this.validate = function(policyChecker, uri, expectedReturnValue) {
				PolicyChecker.prototype.isLinkAllowed.call(policyChecker, uri);

				sinon.assert.calledOnce(PolicyChecker.prototype.isLinkAllowed);
				sinon.assert.calledWithExactly(PolicyChecker.prototype.isLinkAllowed, uri);
				PolicyChecker.prototype.isLinkAllowed.returned(expectedReturnValue).should.be.true;
			};
		});
		beforeEach(function() {
			this.sinon.spy(PolicyChecker.prototype, 'isLinkAllowed');
		});
		it('should check if link is allowed successfully', function() {
			// Object set-up
			var policyChecker = {
				crawler: {
					allowedLinks: [
						/.+google\.com/i
					]
				}
			};

			// Input arguments
			var uri = 'subdomain.google.com';

			// Expected return value by isLinkAllowed()
			const expectedReturnValue = true;

			// Validation
			this.validate(policyChecker, uri, expectedReturnValue);
		});
	});
	describe('#isDepthAllowed()', function() {
		before(function() {
			this.validate = function(policyChecker, resource, expectedReturnValue) {
				PolicyChecker.prototype.isDepthAllowed.call(policyChecker, resource);

				sinon.assert.calledOnce(PolicyChecker.prototype.isDepthAllowed);
				sinon.assert.calledWithExactly(PolicyChecker.prototype.isDepthAllowed, resource);
				PolicyChecker.prototype.isDepthAllowed.returned(expectedReturnValue).should.be.true;
			};
		});
		beforeEach(function() {
			this.sinon.spy(PolicyChecker.prototype, 'isDepthAllowed');
		});
		it('should check if resource with domain same to the original crawled resource domain depth is allowed successfully', function() {
			// Object set-up
			var policyChecker = {
				crawler: {
					uri: new URI('https://www.google.com'),
					maxDepth: 1
				}
			};

			// Input arguments
			var resource = {
				uri: new URI('https://www.google.com/dir/file.txt'),
				depth: 2,
				originator: null
			};

			// Expected return value by isDepthAllowed()
			const expectedReturnValue = false;

			// Validation
			this.validate(policyChecker, resource, expectedReturnValue);
		});
		it('should check if resource with domain not the same to the original crawled resource domain depth is allowed successfully', function() {
			// Object set-up
			var policyChecker = {
				crawler: {
					uri: new URI('https://www.google.com'),
					maxExternalDepth: 1
				}
			};

			// Input arguments
			var resource = {
				uri: new URI('https://www.example.com/dir/file.txt'),
				depth: 2,
				originator: null
			};

			// Expected return value by isDepthAllowed()
			const expectedReturnValue = false;

			// Validation
			this.validate(policyChecker, resource, expectedReturnValue);
		});
	});
	describe('#isRobotsTxtAllowsResource()', function() {
		before(function() {
			this.validate = function(policyChecker, resource, expectedReturnValue) {
				PolicyChecker.prototype.isRobotsTxtAllowsResource.call(policyChecker, resource);

				sinon.assert.calledOnce(PolicyChecker.prototype.isRobotsTxtAllowsResource);
				sinon.assert.calledWithExactly(PolicyChecker.prototype.isRobotsTxtAllowsResource, resource);
				PolicyChecker.prototype.isRobotsTxtAllowsResource.returned(expectedReturnValue).should.be.true;
			};
		});
		beforeEach(function() {
			this.sinon.spy(PolicyChecker.prototype, 'isRobotsTxtAllowsResource');
		});
		it('should check if resource is allowed to be fetched by crawlers according to robots.txt successfully', function() {
			// Object set-up
			var policyChecker = {
				crawler: {
					userAgent: 'userAgent',
					robotsParser: {
						canFetchSync: this.sinon.stub().returns(true)
					}
				}
			};

			// Input arguments
			var resource = {
				uri: new URI('https://www.google.com'),
				depth: 0,
				originator: null
			};

			// Expected return value by isRobotsTxtAllowsResource()
			const expectedReturnValue = true;

			// Validation
			this.validate(policyChecker, resource, expectedReturnValue);
		});
		it('should not check if resource is allowed to be fetched by crawlers according to robots.txt because no robots.txt parser is available', function() {
			// Object set-up
			var policyChecker = { crawler: {} };

			// Input arguments
			var resource = null;

			// Expected return value by isRobotsTxtAllowsResource()
			const expectedReturnValue = true;

			// Validation
			this.validate(policyChecker, resource, expectedReturnValue);
		});
	});
	describe('#isFileSizeAllowed()', function() {
		before(function() {
			this.validate = function(policyChecker, body, expectedReturnValue) {
				PolicyChecker.prototype.isFileSizeAllowed.call(policyChecker, body);

				sinon.assert.calledOnce(PolicyChecker.prototype.isFileSizeAllowed);
				sinon.assert.calledWithExactly(PolicyChecker.prototype.isFileSizeAllowed, body);
				PolicyChecker.prototype.isFileSizeAllowed.returned(expectedReturnValue).should.be.true;
			};
		});
		beforeEach(function() {
			this.sinon.spy(PolicyChecker.prototype, 'isFileSizeAllowed');
		});
		it('should check if file size is allowed successfully', function() {
			// Object set-up
			var policyChecker = {
				crawler: {
					maxFileSize: 5
				}
			};

			// Input arguments
			var body = '123456';

			// Expected return value by isFileSizeAllowed()
			const expectedReturnValue = false;

			// Validation
			this.validate(policyChecker, body, expectedReturnValue);
		});
	});
	describe('#isSiteSizeLimitPassed()', function() {
		before(function() {
			this.validate = function(policyChecker, totalBytesFetched, expectedReturnValue) {
				PolicyChecker.prototype.isSiteSizeLimitPassed.call(policyChecker, totalBytesFetched);

				sinon.assert.calledOnce(PolicyChecker.prototype.isSiteSizeLimitPassed);
				sinon.assert.calledWithExactly(PolicyChecker.prototype.isSiteSizeLimitPassed, totalBytesFetched);
				PolicyChecker.prototype.isSiteSizeLimitPassed.returned(expectedReturnValue).should.be.true;
			};
		});
		beforeEach(function() {
			this.sinon.spy(PolicyChecker.prototype, 'isSiteSizeLimitPassed');
		});
		it('should check if crawler site size limit has passed successfully', function() {
			// Object set-up
			var policyChecker = {
				crawler: {
					siteSizeLimit: 10
				}
			};

			// Input arguments
			var totalBytesFetched = 11;

			// Expected return value by isSiteSizeLimitPassed()
			const expectedReturnValue = true;

			// Validation
			this.validate(policyChecker, totalBytesFetched, expectedReturnValue);
		});
	});
	describe('#isLinkNumberPassed()', function() {
		before(function() {
			this.validate = function(policyChecker, fetchedUris, expectedReturnValue) {
				PolicyChecker.prototype.isLinkNumberPassed.call(policyChecker, fetchedUris);

				sinon.assert.calledOnce(PolicyChecker.prototype.isLinkNumberPassed);
				sinon.assert.calledWithExactly(PolicyChecker.prototype.isLinkNumberPassed, fetchedUris);
				PolicyChecker.prototype.isLinkNumberPassed.returned(expectedReturnValue).should.be.true;
			};
		});
		beforeEach(function() {
			this.sinon.spy(PolicyChecker.prototype, 'isLinkNumberPassed');
		});
		it('should check if crawler link number limit has passed successfully', function() {
			// Object set-up
			var policyChecker = {
				crawler: {
					maxLinkNumber: 2
				}
			};

			// Input arguments
			var fetchedUris = [1, 2, 3];

			// Expected return value by isLinkNumberPassed()
			const expectedReturnValue = true;

			// Validation
			this.validate(policyChecker, fetchedUris, expectedReturnValue);
		});
	});
	describe('#isMaxTimeOverallPassed()', function() {
		before(function() {
			this.validate = function(policyChecker, expectedReturnValue) {
				PolicyChecker.prototype.isMaxTimeOverallPassed.call(policyChecker);

				sinon.assert.calledOnce(PolicyChecker.prototype.isMaxTimeOverallPassed);
				sinon.assert.calledWithExactly(PolicyChecker.prototype.isMaxTimeOverallPassed);
				PolicyChecker.prototype.isMaxTimeOverallPassed.returned(expectedReturnValue).should.be.true;
			};
		});
		beforeEach(function() {
			this.sinon.spy(PolicyChecker.prototype, 'isMaxTimeOverallPassed');
		});
		it('should check if file size is allowed successfully', function() {
			// Object set-up
			var policyChecker = {
				crawler: {
					crawlStartTime: Date.now(),
					maxTimeOverall: 0
				}
			};

			// Expected return value by isMaxTimeOverallPassed()
			const expectedReturnValue = true;

			// Validation
			this.validate(policyChecker, expectedReturnValue);
		});
	});
});