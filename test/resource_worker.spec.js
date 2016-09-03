/**
 * Created by Roy on 02/09/2016.
 */

// npm modules
var sinon                    = require('sinon'),
	expect                   = require('chai').expect;

// lib modules
require('./spec_helper');

var kaiser                   = require('../index'),
	ResourceWorker           = require('../lib/resource_worker'),
    CrawlerReferencer        = require('../lib/crawler_referencer'),
	Crawler                  = require('../lib/crawler');

var BaiscComposer            = kaiser.BasicComposer;

describe('ResourceWorker', function() {
	describe('ResourceWorker()', function() {
		it('should throw an exception', function() {
			// Validation
			expect(function() {
				new ResourceWorker();
			}).to.throw(Error, 'cannot instantiate ResourceWorker because it\'s an abstract class');
		});
	});
	describe('.init()', function() {
		before(function() {
			this.validate = function(resourceWorker, crawler, workType,
			                         expectedCrawler) {
				ResourceWorker.init.call(resourceWorker, crawler, workType);
				sinon.assert.calledOnce(CrawlerReferencer.init);
				sinon.assert.calledWithExactly(CrawlerReferencer.init, expectedCrawler);
			};
		});
		beforeEach(function() {
			this.sinon.stub(CrawlerReferencer, 'init');
		});
		it('should initialize ResourceWorker instance with default parameters', function() {
			// Object set-up
			var resourceWorker = {};

			// Input arguments
			var crawler = 'crawler';
			var workType = 'workType';

			// Expected arguments to be passed to Discoverer.init
			const expectedCrawler = crawler;

			// Validation
			this.validate(resourceWorker, crawler, workType,
				expectedCrawler);
		});
		it('should initialize ResourceWorker instance with default parameters and then fails to initialze the parameters again', function() {
			// Object set-up
			var resourceWorker = {};

			// Input arguments
			var crawler = 'crawler';
			var workType = 'workType';

			// Expected arguments to be passed to Discoverer.init
			const expectedCrawler = crawler;

			// Validation
			this.validate(resourceWorker, crawler, workType,
				expectedCrawler);

			// Specific validation pre-conditions
			ResourceWorker.init.call(resourceWorker, crawler, workType);

			// Specific validation
			sinon.assert.calledTwice(CrawlerReferencer.init);
			sinon.assert.calledWithExactly(CrawlerReferencer.init, expectedCrawler);
		});
	});
	describe('#work()', function() {
		before(function() {
			this.validate = function(resourceWorker, resource, workExtraArgs, expectedError, expectedContinuationValue) {
				var arguments = [resource].concat(workExtraArgs);
				ResourceWorker.prototype.work.apply(resourceWorker, arguments);
				sinon.assert.calledOnce(resourceWorker.work);
				sinon.assert.calledWithExactly.apply(sinon.assert, [resourceWorker.work].concat(arguments));
				sinon.assert.calledOnce(this.endWorkCallback);
				sinon.assert.calledWithExactly(this.endWorkCallback, expectedError, expectedContinuationValue);
			};
		});
		beforeEach(function() {
			this.sinon.spy(ResourceWorker.prototype, 'work');
			this.endWorkCallback = this.sinon.spy();
		});
		it('should work succesfully with extra args passed and no error passed to the end logic callback but with extra args passed', function() {
			// Object set-up
			this.sinon.stub(Crawler, 'init');
			var resourceWorker = new BaiscComposer(new Crawler({}));

			// Input arguments
			var resource = 'resource';
			var workExtraArgs = [5, 3, this.endWorkCallback];

			// Expected values to be passed to the 'composestart` event spy
			const expectedEventResource = resource;
			const expectedEventWorkExtraArgs = [5, 3];

			// Input arguments to call end logic callback with
			var error = null;
			var continuationValue = 'continuationValue';
			var endLogicExtraArgs = [9, 8];

			// Expected values to be passed to endWorkCallback
			const expectedError = error;
			const expectedContinuationValue = continuationValue;

			// Expected values to be passed to the 'composecomplete` event spy
			const expectedEventEndLogicExtraArgs = endLogicExtraArgs;

			// Spies, Stubs, Mocks
			this.sinon.stub(resourceWorker, 'logic').yields(error, continuationValue, endLogicExtraArgs);

			// Specific validation pre-conditions
			var workStartEventSpy = this.sinon.spy();
			resourceWorker.crawler.on('composestart', workStartEventSpy);
			var workCompleteEventSpy = this.sinon.spy();
			resourceWorker.crawler.on('composecomplete', workCompleteEventSpy);

			// Validation
			this.validate(resourceWorker, resource, workExtraArgs,
				expectedError, expectedContinuationValue);

			// Specific validation
			sinon.assert.calledOnce(workStartEventSpy);
			sinon.assert.calledWithExactly(workStartEventSpy, expectedEventResource, expectedEventWorkExtraArgs);
			sinon.assert.calledOnce(workCompleteEventSpy);
			sinon.assert.calledWithExactly(workCompleteEventSpy, expectedEventResource, expectedEventEndLogicExtraArgs);
		});
		it('should work succesfully with no extra args passed and no error or extra args passed to the end logic callback', function() {
			// Object set-up
			this.sinon.stub(Crawler, 'init');
			var resourceWorker = new BaiscComposer(new Crawler({}));

			// Input arguments
			var resource = 'resource';
			var workExtraArgs = [this.endWorkCallback];

			// Expected values to be passed to the 'composestart` event spy
			const expectedEventResource = resource;

			// Input arguments to call end logic callback with
			var error = null;
			var continuationValue = 'continuationValue';

			// Expected values to be passed to endWorkCallback
			const expectedError = error;
			const expectedContinuationValue = continuationValue;

			// Spies, Stubs, Mocks
			this.sinon.stub(resourceWorker, 'logic').yields(error, continuationValue);

			// Specific validation pre-conditions
			var workStartEventSpy = this.sinon.spy();
			resourceWorker.crawler.on('composestart', workStartEventSpy);
			var workCompleteEventSpy = this.sinon.spy();
			resourceWorker.crawler.on('composecomplete', workCompleteEventSpy);

			// Validation
			this.validate(resourceWorker, resource, workExtraArgs,
				expectedError, expectedContinuationValue);

			// Specific validation
			sinon.assert.calledOnce(workStartEventSpy);
			sinon.assert.calledWithExactly(workStartEventSpy, expectedEventResource);
			sinon.assert.calledOnce(workCompleteEventSpy);
			sinon.assert.calledWithExactly(workCompleteEventSpy, expectedEventResource);
		});
		it('should work succesfully with no extra args passed and an error passed to the end logic callback', function() {
			// Object set-up
			this.sinon.stub(Crawler, 'init');
			var resourceWorker = new BaiscComposer(new Crawler({}));

			// Input arguments
			var resource = 'resource';
			var workExtraArgs = [this.endWorkCallback];

			// Expected values to be passed to the 'composestart` event spy
			const expectedEventResource = resource;

			// Input arguments to call end logic callback with
			var error = new Error('oops');
			var continuationValue = 'continuationValue';

			// Expected values to be passed to endWorkCallback
			const expectedError = error;
			const expectedContinuationValue = continuationValue;

			// Spies, Stubs, Mocks
			this.sinon.stub(resourceWorker, 'logic').yields(error, continuationValue);

			// Specific validation pre-conditions
			var workStartEventSpy = this.sinon.spy();
			resourceWorker.crawler.on('composestart', workStartEventSpy);
			var workErrorEventSpy = this.sinon.spy();
			resourceWorker.crawler.on('composeerror', workErrorEventSpy);

			// Validation
			this.validate(resourceWorker, resource, workExtraArgs,
				expectedError, expectedContinuationValue);

			// Specific validation
			sinon.assert.calledOnce(workStartEventSpy);
			sinon.assert.calledWithExactly(workStartEventSpy, expectedEventResource);
			sinon.assert.calledOnce(workErrorEventSpy);
			sinon.assert.calledWithExactly(workErrorEventSpy, expectedEventResource, expectedError);
		});
	});
	describe('#logic()', function() {
		it('should throw an exception', function() {
			// Validation
			expect(function() {
				ResourceWorker.prototype.logic();
			}).to.throw(Error, 'cannot call abstract method');
		});
	});
});