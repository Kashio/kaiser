/**
 * Created by Roy on 20/08/2016.
 */

// npm modules
var chai                     = require('chai'),
	expect                   = require('chai').expect,
	sinon                    = require('sinon'),
	nodefs                   = require('node-fs'),
	fspvr                    = require('fspvr'),
	iconv                    = require('iconv-lite'),
	URI                      = require('urijs');

// core modules
var path                     = require('path'),
	fs                       = require('fs');

// lib modules
require('./spec_helper');

var kaiser                   = require('../index'),
	resourceWorkerSpecHelper = require('./resource_worker_spec_helper'),
	helpers                  = require('../lib/helpers');

var MemoryCache              = kaiser.MemoryCache,
	FsCache                  = kaiser.FsCache;

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
			const expectedCrawler = 'crawler';

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
			expect(FsCache.init.bind(fsCache)).to.throw(Error, 'options must be given to construct an FsCache');
		});
		it('should fail to initialize FsCache instance because `options.rootDir` is not provided', function() {
			// Object set-up
			var fsCache = {};

			// Specific validation
			expect(FsCache.init.bind(fsCache, {})).to.throw(Error, 'options must provide rootDir');
		});
		it('should fail to initialize FsCache instance because `options.rootDir` is not a String', function() {
			// Object set-up
			var fsCache = {};

			// Specific validation
			expect(FsCache.init.bind(fsCache, { rootDir: 5})).to.throw(TypeError, 'rootDir must be of type string');
		});
	});
	describe('#logic()', function() {
		before(function() {
			this.validate = function(fsCache, resource, callback,
			                         expectedError) {
				fsCache.logic(resource, callback);

				sinon.assert.calledOnce(FsCache.prototype.logic);
				sinon.assert.calledWithExactly(FsCache.prototype.logic, resource, callback);
				sinon.assert.calledOnce(callback);
				sinon.assert.calledWithExactly(callback, expectedError);
			};
		});
		beforeEach(function() {
			this.sinon.spy(FsCache.prototype, 'logic');
			resourceWorkerSpecHelper.beforeEach.call(this);
		});
		it('should save a resource with known encoding in filesystem sucessfully', function() {
			// Object set-up
			var fsCache = new FsCache({}, { rootDir: 'websites' });

			// Input arguments
			var resource = {
				uri: new URI('https://www.google.com'),
				depth: 0,
				originator: null
			};
			var callback = this.sinon.spy();

			// Expected arguments to be passed to the callback
			var expectedError = null;

			// Spies, Stubs, Mocks
			this.sinon.stub(fsCache, 'tryMakeResourceDir').returns('websites/google.com');
			this.sinon.stub(helpers, 'makeFileNameFromUri').returns('index.html');
			this.sinon.stub(path, 'join').returns('websites/google.com/index.html');
			this.sinon.stub(fspvr, 'reformatPath').returns('websites/google.com/index.html');
			this.sinon.stub(iconv, 'encodingExists').returns(true);
			this.sinon.stub(iconv, 'encode').returns('buffer');
			this.sinon.stub(fs, 'writeFile').yields(null);

			// Validation
			this.validate(fsCache, resource, callback,
				expectedError);
		});
		it('should save a resource with unknown encoding in filesystem sucessfully', function() {
			// Object set-up
			var fsCache = new FsCache({}, { rootDir: 'websites' });

			// Input arguments
			var resource = {
				uri: new URI('https://www.google.com'),
				depth: 0,
				originator: null
			};
			resource.content = "buffer";
			var callback = this.sinon.spy();

			// Expected arguments to be passed to the callback
			var expectedError = null;

			// Spies, Stubs, Mocks
			this.sinon.stub(fsCache, 'tryMakeResourceDir').returns('websites/google.com');
			this.sinon.stub(helpers, 'makeFileNameFromUri').returns('index.html');
			this.sinon.stub(path, 'join').returns('websites/google.com/index.html');
			this.sinon.stub(fspvr, 'reformatPath').returns('websites/google.com/index.html');
			this.sinon.stub(iconv, 'encodingExists').returns(false);
			this.sinon.stub(fs, 'writeFile').yields(null);

			// Validation
			this.validate(fsCache, resource, callback,
				expectedError);
		});
	});
	describe('#tryMakeResourceDir()', function() {
		before(function() {
			this.validate = function(fsCache, resource, expectedResourceDir) {
				fsCache.tryMakeResourceDir(resource);

				sinon.assert.calledOnce(FsCache.prototype.tryMakeResourceDir);
				sinon.assert.calledWithExactly(FsCache.prototype.tryMakeResourceDir, resource);
				fsCache.tryMakeResourceDir.returned(expectedResourceDir).should.be.true;
			};
		});
		beforeEach(function() {
			this.sinon.spy(FsCache.prototype, 'tryMakeResourceDir');
			resourceWorkerSpecHelper.beforeEach.call(this);
		});
		it('should try to make resource directory sucessfully', function() {
			// Object set-up
			var fsCache = new FsCache({}, { rootDir: 'websites' });

			// Input arguments
			var resource = {
				uri: new URI('https://www.google.com'),
				depth: 0,
				originator: null
			};

			// Expected arguments to be passed to the callback
			var expectedResourceDir = 'websites/google.com';

			// Spies, Stubs, Mocks
			this.sinon.stub(path, 'join').returns('websites/google.com');
			this.sinon.stub(URI, 'decode').returns('websites/google.com');
			this.sinon.stub(fspvr, 'reformatPath').returns('websites/google.com');
			this.sinon.stub(nodefs, 'mkdirSync').onFirstCall().throws(new Error('oops'));

			// Validation
			this.validate(fsCache, resource, expectedResourceDir);
		});
	});
});