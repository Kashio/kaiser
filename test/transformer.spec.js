/**
 * Created by Roy on 14/05/2016.
 */

// npm modules
var sinon                    = require('sinon'),
    expect                   = require('chai').expect;

// lib modules
var kaiser                   = require('../index'),
	ResourceWorker           = require('../lib/resource_worker'),
	resourceWorkerSpecHelper = require('./resource_worker_spec_helper');

var Transformer              = kaiser.Transformer;

describe('Transformer', function() {
	describe('Transformer()', function() {
		it('should throw an exception', function() {
			// Validation
			expect(function() {
				new Transformer();
			}).to.throw(Error, 'cannot instantiate Transformer because it\'s an abstract class');
		});
	});
	describe('.init()', function() {
		before(function() {
			this.validate = function(crawler) {
				Transformer.init(crawler);
				sinon.assert.calledOnce(ResourceWorker.init);
				sinon.assert.calledWithExactly(ResourceWorker.init, crawler, 'transform');
			};
		});
		beforeEach(resourceWorkerSpecHelper.beforeEach);
		it('should call ResourceWorker.init()', function() {
			// Validation
			this.validate('crawler');
		});
	});
	describe('#canTransform()', function() {
		it('should throw an exception', function() {
			// Validation
			expect(function() {
				Transformer.prototype.canTransform();
			}).to.throw(Error, 'cannot call abstract method');
		});
	});
});