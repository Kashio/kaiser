/**
 * Created by Roy on 14/05/2016.
 */

// npm modules
var sinon         = require('sinon'),
    URI           = require('urijs');

// lib modules
require('./spec_helper');

var kaiser        = require('../index'),
	Resource      = require('../lib/resource');

var Composer      = kaiser.Composer,
	BasicComposer = kaiser.BasicComposer;

describe('BasicComposer', function() {
	describe('constructor', function() {
		it('should call BasicComposer.init() function', function() {
			var basicComposerInitSpy = sinon.spy(BasicComposer, 'init');
			new BasicComposer('crawler');
			sinon.assert.calledOnce(basicComposerInitSpy);
			sinon.assert.calledWithExactly(basicComposerInitSpy, 'crawler');
		});
	});
	describe('.init()', function() {
		it('should call Composer.init() function', function() {
			var composerInitSpy = sinon.spy(Composer, 'init');
			BasicComposer.init('crawler');
			sinon.assert.calledOnce(composerInitSpy);
			sinon.assert.calledWithExactly(composerInitSpy, 'crawler');
		});
	});
	describe('#logic()', function() {
		it ('should compose resources from array', function() {
			var basicComposer = new BasicComposer();
			const originator = Resource.instance('https://www.google.com', null);
			var logicDoneSpy = sinon.spy();
			const uris = [[
				'https://en.wikipedia.org/wiki/Main_Page',
				'https://www.youtube.com/',
				'https://www.npmjs.com/',
				'https://www.google.com/doodles',
				532,
				{
					url: 'https://nodejs.org/en/'
				},
				[],
				/test/i
			]];
			const resultResources = [
				new Resource(new URI('https://en.wikipedia.org/wiki/Main_Page'), 0, originator),
				new Resource(new URI('https://www.youtube.com/'), 0, originator),
				new Resource(new URI('https://www.npmjs.com/'), 0, originator),
				new Resource(new URI('https://www.google.com/doodles'), 1, originator)
			];
			basicComposer.logic(originator, logicDoneSpy, uris);
			sinon.assert.calledOnce(logicDoneSpy, 'BasicComposer#logic() should call its done() callback once');
			sinon.assert.calledWithExactly(logicDoneSpy, null, resultResources);
		});
	});
});