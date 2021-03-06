/**
 * Created by Roy on 14/05/2016.
 */

// npm modules
var sinon                    = require('sinon'),
    URI                      = require('urijs');

// lib modules
require('./spec_helper');

var kaiser                   = require('../index'),
	Resource                 = require('../lib/resource'),
	resourceWorkerSpecHelper = require('./resource_worker_spec_helper');

var Composer                 = kaiser.Composer,
	BasicComposer            = kaiser.BasicComposer;

describe('BasicComposer', function() {
	describe('BasicComposer()', function() {
		before(function() {
			this.validate = function(crawler, expectedCrawler) {
				new BasicComposer(crawler);

				sinon.assert.calledOnce(BasicComposer.init);
				sinon.assert.calledWithExactly(BasicComposer.init, expectedCrawler);
			};
		});
		beforeEach(function() {
			this.sinon.stub(BasicComposer, 'init');
		});
		it('should construct BasicComposer instance successfully', function() {
			// Object set-up
			var crawler = 'crawler';

			// Expected arguments to be passed to BasicComposer.init
			const expectedCrawler = 'crawler';

			// Validation
			this.validate(crawler, expectedCrawler);
		});
	});
	describe('.init()', function() {
		before(function() {
			this.validate = function(basicComposer, crawler, expectedCrawler) {
				BasicComposer.init.call(basicComposer, crawler);

				sinon.assert.calledOnce(BasicComposer.init);
				sinon.assert.calledWithExactly(BasicComposer.init, crawler);
				sinon.assert.calledOnce(Composer.init);
				sinon.assert.calledWithExactly(Composer.init, expectedCrawler);
			};
		});
		beforeEach(function() {
			this.sinon.spy(BasicComposer, 'init');
			this.sinon.stub(Composer, 'init');
		});
		it('should initialize BasicComposer instance with default parameters', function() {
			// Object set-up
			var basicComposer = {};

			// Input arguments
			var crawler = 'crawler';

			// Expected arguments to be passed to Composer.init
			const expectedCrawler = 'crawler';

			// Validation
			this.validate(basicComposer, crawler, expectedCrawler);
		});
	});
	describe('#logic()', function() {
		before(function() {
			this.validate = function(basicComposer, resource, callback, extraArgs,
			                         expectedError, expectedResources) {
				basicComposer.logic(resource, callback, extraArgs);

				sinon.assert.calledOnce(BasicComposer.prototype.logic);
				sinon.assert.calledWithExactly(BasicComposer.prototype.logic, resource, callback, extraArgs);
				sinon.assert.calledOnce(callback);
				sinon.assert.calledWithExactly(callback, expectedError, expectedResources);
			};
		});
		beforeEach(function() {
			this.sinon.spy(BasicComposer.prototype, 'logic');
			resourceWorkerSpecHelper.beforeEach.call(this);
		});
		it ('should compose resources from an array', function() {
			// Object set-up
			var basicComposer = new BasicComposer();

			// Input arguments
			var resource = {
				uri: new URI('https://www.google.com'),
				depth: 0,
				originator: null
			};

			var callback = sinon.spy();
			var uris = [[
				'https://en.wikipedia.org/wiki/Main_Page',
				'https://www.youtube.com/',
				'https://www.npmjs.com/',
				'https://www.facebook.com/doodles',
				532,
				{
					url: 'https://nodejs.org/en/'
				},
				[],
				/test/i
			]];

			// Expected arguments to be passed to the callback
			const expectedError = null;
			const expectedResources = [
				{
					uri: new URI('https://en.wikipedia.org/wiki/Main_Page'),
					depth: 0,
					originator: resource
				},
				{
					uri: new URI('https://www.youtube.com/'),
					depth: 0,
					originator: resource
				},
				{
					uri: new URI('https://www.npmjs.com/'),
					depth: 0,
					originator: resource
				},
				{
					uri: new URI('https://www.facebook.com/doodles'),
					depth: 0,
					originator: resource
				}
			];

			// Spies, Stubs, Mocks
			this.sinon.stub(Resource, 'instance', function(uri, resource) {
				return {
					uri: new URI(uri),
					depth: 0,
					originator: resource
				};
			});

			// Validation
			this.validate(basicComposer, resource, callback, uris,
				expectedError, expectedResources);
		});
	});
});