/**
 * Created by Roy on 20/08/2016.
 */

// npm modules
var chai        = require('chai'),
	expect      = require('chai').expect,
	sinon       = require('sinon'),
	path        = require('path'),
	nodefs      = require('node-fs');

// lib modules
require('./spec_helper');

var kaiser      = require('../index'),
	Resource    = require('../lib/resource');

var MemoryCache = kaiser.MemoryCache,
	FsCache     = kaiser.FsCache;

chai.should();

describe('FsCache', function() {
	describe('FsCache()', function() {
		before(function() {
			this.validate = function(crawler, options, expectedCrawler) {
				new FsCache(crawler, options);

				sinon.assert.calledOnce(FsCache.init);
				sinon.assert.calledWithExactly(FsCache.init, options);
				sinon.assert.calledOnce(MemoryCache.init);
				sinon.assert.calledWithExactly(MemoryCache.init, expectedCrawler);
			};
		});
		beforeEach(function() {
			this.sinon.stub(FsCache, 'init');
			this.sinon.stub(MemoryCache, 'init');
		});
		it('should construct FsCache instance successfully', function() {
			// Object set-up
			var crawler = 'crawler';
			var options = {};

			// Expected arguments to be passed to BasicComposer.init
			const expectedCrawler = crawler;

			// Validation
			this.validate(crawler, options, expectedCrawler);
		});
	});
	describe('.init()', function() {
		before(function() {
			this.validate = function(fsCache, options, expectedRootDir) {
				FsCache.init.call(fsCache, options);

				sinon.assert.calledOnce(FsCache.init);
				sinon.assert.calledWithExactly(FsCache.init, options);
				fsCache.rootDir.should.be.equal(expectedRootDir);
			};
		});
		beforeEach(function() {
			this.sinon.spy(FsCache, 'init');
		});
		it('should initialize FsCache instance with default parameters', function() {
			// Object set-up
			var fsCache = {};

			// Input arguments
			var options = { rootDir: 'websites' };

			// Expected arguments to be passed to Composer.init
			const expectedRootDir = 'websites';

			// Spies, Stubs, Mocks
			this.sinon.stub(path, 'resolve').returns('websites');
			this.sinon.stub(nodefs, 'mkdirSync');

			// Validation
			this.validate(fsCache, options, expectedRootDir);
		});
		it('should initialize FsCache instance with default parameters and then fails to initialze the parameters again', function() {
			// Object set-up
			var fsCache = {};

			// Input arguments
			var options = { rootDir: 'websites' };

			// Expected arguments to be passed to Discoverer.init
			const expectedRootDir = 'websites';

			// Spies, Stubs, Mocks
			this.sinon.stub(path, 'resolve').returns('websites');
			this.sinon.stub(nodefs, 'mkdirSync');

			// Validation
			this.validate(fsCache, options, expectedRootDir);

			// Specific validation pre-conditions
			FsCache.init.call(fsCache, options);

			// Specific validation
			sinon.assert.calledTwice(FsCache.init);
			sinon.assert.calledWithExactly(FsCache.init, options);
			fsCache.rootDir.should.be.equal(expectedRootDir);
		});
		it('should fail to initialize FsCache instance because `options` is not provided', function() {
			// Object set-up
			var fsCache = {};

			// Specific validation
			expect(function() {
				FsCache.init.call(fsCache);
			}).to.throw(Error, 'options must be given to construct an FsCache');
		});
		it('should fail to initialize FsCache instance because `options.rootDir` is not provided', function() {
			// Object set-up
			var fsCache = {};

			// Specific validation
			expect(function() {
				FsCache.init.call(fsCache, {});
			}).to.throw(Error, 'options must provide rootDir');
		});
		it('should fail to initialize FsCache instance because `options.rootDir` is not a String', function() {
			// Object set-up
			var fsCache = {};

			// Specific validation
			expect(function() {
				FsCache.init.call(fsCache, { rootDir: 5});
			}).to.throw(TypeError, 'rootDir must be of type string');
		});
	});
});