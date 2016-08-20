/**
 * Created by Roy on 20/08/2016.
 */

// npm modules
var chai        = require('chai'),
	expect      = require('chai').expect,
	sinon       = require('sinon');

// lib modules
require('./spec_helper');

var kaiser      = require('../index'),
	Resource    = require('../lib/resource');

var Cache       = kaiser.Cache,
	MemoryCache = kaiser.MemoryCache;

chai.should();

describe('MemoryCache', function() {
	describe('MemoryCache()', function() {
		before(function() {
			this.validate = function(crawler, expectedCrawler) {
				new MemoryCache(crawler);

				sinon.assert.calledOnce(MemoryCache.init);
				sinon.assert.calledWithExactly(MemoryCache.init, expectedCrawler);
			};
		});
		beforeEach(function() {
			this.sinon.stub(MemoryCache, 'init');
		});
		it('should construct MemoryCache instance successfully', function() {
			// Object set-up
			var crawler = 'crawler';

			// Expected arguments to be passed to BasicComposer.init
			const expectedCrawler = crawler;

			// Validation
			this.validate(crawler, expectedCrawler);
		});
	});
	describe('.init()', function() {
		before(function() {
			this.validate = function(memoryCache, crawler, expectedCrawler) {
				MemoryCache.init.call(memoryCache, crawler);

				sinon.assert.calledOnce(MemoryCache.init);
				sinon.assert.calledWithExactly(MemoryCache.init, crawler);
				sinon.assert.calledOnce(Cache.init);
				sinon.assert.calledWithExactly(Cache.init, expectedCrawler);
				memoryCache._rtable.should.be.deep.equal([]);
			};
		});
		beforeEach(function() {
			this.sinon.spy(MemoryCache, 'init');
			this.sinon.stub(Cache, 'init');
		});
		it('should initialize MemoryCache instance with default parameters', function() {
			// Object set-up
			var memoryCache = {};

			// Input arguments
			var crawler = 'crawler';

			// Expected arguments to be passed to Composer.init
			const expectedCrawler = crawler;

			// Validation
			this.validate(memoryCache, crawler, expectedCrawler);
		});
		it('should initialize MemoryCache instance with default parameters and then fails to initialze the parameters again', function() {
			// Object set-up
			var memoryCache = {};

			// Input arguments
			var crawler = 'crawler';

			// Expected arguments to be passed to Discoverer.init
			const expectedCrawler = crawler;

			// Validation
			this.validate(memoryCache, crawler, expectedCrawler);

			// Specific validation pre-conditions
			MemoryCache.init.call(memoryCache, crawler);

			// Specific validation
			sinon.assert.calledTwice(MemoryCache.init);
			sinon.assert.calledWithExactly(MemoryCache.init, crawler);
			sinon.assert.calledTwice(Cache.init);
			sinon.assert.calledWithExactly(Cache.init, expectedCrawler);
			memoryCache._rtable.should.be.deep.equal([]);
		});
	});
	describe('#logic()', function() {
		before(function() {
			this.validate = function(memoryCache, resource, callback,
			                         expectedRTable) {
				memoryCache.logic(resource, callback);

				sinon.assert.calledOnce(MemoryCache.prototype.logic);
				sinon.assert.calledWithExactly(MemoryCache.prototype.logic, resource, callback);
				memoryCache._rtable.should.be.deep.equal(expectedRTable);
				sinon.assert.calledOnce(callback);
				sinon.assert.calledWithExactly(callback);
			};
		});
		beforeEach(function() {
			this.sinon.spy(MemoryCache.prototype, 'logic');
		});
		it('should cache a resource in memory sucessfully', function() {
			// Object set-up
			var memoryCache = new MemoryCache({});

			// Input arguments
			var resource = Resource.instance('https://www.google.com', null);
			var callback = this.sinon.spy();

			// Expected arguments to be passed to Composer.init
			var expectedRTable = [];
			expectedRTable[resource.uri.toString()] = resource;

			// Validation
			this.validate(memoryCache, resource, callback,
				expectedRTable);
		});
	});
	describe('#retrieve()', function() {
		before(function() {
			this.validate = function(memoryCache, uri, expectedResource) {
				memoryCache.retrieve(uri);

				sinon.assert.calledOnce(MemoryCache.prototype.retrieve);
				sinon.assert.calledWithExactly(MemoryCache.prototype.retrieve, uri);
				MemoryCache.prototype.retrieve.returned(expectedResource);
			};
		});
		beforeEach(function() {
			this.sinon.spy(MemoryCache.prototype, 'retrieve');
		});
		it('should retrieve a cached resource from memory sucessfully', function() {
			// Object set-up
			var memoryCache = new MemoryCache({});

			// Input arguments
			var uri = 'https://www.google.com';

			// Expected resource to be returned by retrive()
			const expectedResource = Resource.instance('https://www.google.com', null);

			// Pre-conditions
			memoryCache._rtable[expectedResource .uri.toString()] = expectedResource ;

			// Validation
			this.validate(memoryCache, uri, expectedResource );
		});
		it('should fail to retrieve a cached resource from memory because uri is not a String', function() {
			// Object set-up
			var memoryCache = new MemoryCache({});

			// Input arguments
			var uri = 5;

			// Specific validation
			expect(function() {
				memoryCache.retrieve(uri);
			}).to.throw(TypeError, 'uri must be of type string');
		});
	});
});