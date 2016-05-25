/**
 * Created by Roy on 14/05/2016.
 */

// npm modules
var sinon          = require('sinon'),
    expect         = require('chai').expect;

// lib modules
var kaiser         = require('../index'),
	ResourceWorker = require('../lib/resource_worker'),
	specHelper     = require('./spec_helper');

var Composer       = kaiser.Composer;

describe('Composer', function() {
	describe('constructor', function() {
		it('throw an exception', function() {
			expect(function() {
				new Composer();
			}).to.throw(Error, 'cannot instantiate Composer because it\'s an abstract class');
		});
	});
	describe('.init()', function() {
		beforeEach(specHelper.beforeEach);
		afterEach(specHelper.afterEach);
		it('call ResourceWorker.init() function', function() {
			Composer.init('crawler');
			sinon.assert.calledOnce(ResourceWorker.init);
			sinon.assert.calledWithExactly(ResourceWorker.init, 'crawler', 'compose');
		});
	});
});