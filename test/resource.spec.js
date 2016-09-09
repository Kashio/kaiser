/**
 * Created by Roy on 03/09/2016.
 */

// npm modules
var chai                     = require('chai'),
	sinon                    = require('sinon'),
	URI                      = require('urijs');

// lib modules
require('./spec_helper');

var Resource                 = require('../lib/resource'),
	helpers                  = require('../lib/helpers');

chai.should();

describe('Resource', function() {
	describe('Resource()', function() {
		before(function() {
			this.validate = function(uri, depth, originator,
			                         expectedUri, expectedDepth, expectedOriginator) {
				var resource = new Resource(uri, depth, originator);

				resource.uri.should.be.deep.equal(expectedUri);
				resource.depth.should.be.equal(expectedDepth);
				if (originator) {
					resource.originator.should.be.deep.equal(expectedOriginator);
				}
			};
		});
		it('should construct a Reosurce instance successfully', function() {
			// Object set-up
			var uri = 'www.google.com';
			var depth = 0;
			var originator = null;

			// Expected values
			const expectedUri = 'www.google.com';
			const expectedDepth = 0;
			const expectedOriginator = null;

			// Validation
			this.validate(uri, depth, originator,
				expectedUri, expectedDepth, expectedOriginator);
		});
	});
	describe('.instance()', function() {
		before(function() {
			this.validate = function(uri, originator,
			                         expectedUri, expectedDepth, expectedOriginator) {
				var resource = Resource.instance(uri, originator);

				sinon.assert.calledOnce(Resource.instance);
				sinon.assert.calledWithExactly(Resource.instance, uri, originator);
				resource.uri.should.be.deep.equal(expectedUri);
				resource.depth.should.be.equal(expectedDepth);
				if (originator) {
					resource.originator.should.be.deep.equal(expectedOriginator);
				}
			};
		});
		beforeEach(function() {
			this.sinon.spy(Resource, 'instance');
			this.resourceCalculateDepth = this.sinon.stub(Resource, 'calculateDepth');
		});
		it('create a resource instance with a null originator successfully', function() {
			// Input arguments
			var uri = 'www.google.com';
			var originator = null;

			// Expected values
			const expectedUri = new URI('www.google.com');
			const expectedDepth = 0;
			const expectedOriginator = null;

			// Spies, Stubs, Mocks
			this.sinon.stub(helpers, 'isNullOrUndefined').returns(true);
			this.sinon.stub(URI.prototype, 'domain').returns('google.com');
			this.resourceCalculateDepth.returns(0);

			// Validation
			this.validate(uri, originator,
				expectedUri, expectedDepth, expectedOriginator);

			// Specific validation
			Resource.RootOriginatorDomain.should.be.equal('google.com');
		});
		it('create a resource instance with an originator successfully', function() {
			// Input arguments
			var uri = 'www.google.com/robots.txt';
			var originator = new Resource('www.google.com', 0, null);

			// Expected values
			const expectedUri = new URI('www.google.com/robots.txt');
			const expectedDepth = 1;
			const expectedOriginator = new Resource('www.google.com', 0, null);

			// Spies, Stubs, Mocks
			this.sinon.stub(helpers, 'isNullOrUndefined').returns(false);
			this.resourceCalculateDepth.returns(1);

			// Validation
			this.validate(uri, originator,
				expectedUri, expectedDepth, expectedOriginator);
		});
	});
	describe('.calculateDepth()', function() {
		before(function() {
			this.validate = function(uri, originator, expectedDepth) {
				var depth = Resource.calculateDepth(uri, originator);

				sinon.assert.calledOnce(Resource.calculateDepth);
				sinon.assert.calledWithExactly(Resource.calculateDepth, uri, originator);
				depth.should.be.equal(expectedDepth);
			};
		});
		beforeEach(function() {
			this.sinon.spy(Resource, 'calculateDepth');
			this.helpersIsIntegerStub = this.sinon.stub(helpers, 'isInteger').returns(true);
		});
		it('calculate a resource depth with null originator successfully', function() {
			// Input arguments
			var uri = new URI('www.google.com');
			var originator = null;

			// Expected values
			const expectedDepth = 0;

			// Spies, Stubs, Mocks
			this.sinon.stub(helpers, 'isNullOrUndefined').returns(true);

			// Validation
			this.validate(uri, originator, expectedDepth);
		});
		it('calculate a resource depth of different domain with a root originator successfully', function() {
			// Input arguments
			var uri = new URI('www.oops.com');
			var originator = new Resource(new URI('www.google.com'), 0, null);
			Resource.RootOriginatorDomain = 'google.com';

			// Expected values
			const expectedDepth = 0;

			// Spies, Stubs, Mocks
			this.sinon.stub(helpers, 'isNullOrUndefined').returns(false);
			this.sinon.stub(URI.prototype, 'domain')
				.onFirstCall().returns('google.com')
				.onSecondCall().returns('oops.com')
				.onThirdCall().returns('google.com');

			// Validation
			this.validate(uri, originator, expectedDepth);
		});
		it('calculate a resource depth with originator with valid depth successfully', function() {
			// Input arguments
			var uri = new URI('www.oops.com');
			var originator = new Resource(new URI('www.google.com'), 0, null);
			Resource.RootOriginatorDomain = 'root.com';

			// Expected values
			const expectedDepth = 1;

			// Spies, Stubs, Mocks
			this.sinon.stub(helpers, 'isNullOrUndefined').returns(false);
			this.sinon.stub(URI.prototype, 'domain').onFirstCall().returns('google.com');

			// Validation
			this.validate(uri, originator, expectedDepth);
		});
		it('calculate a resource depth with originator with invalid depth successfully', function() {
			// Input arguments
			var uri = new URI('www.oops.com');
			var originator = new Resource(new URI('www.google.com'), 'oops', null);
			Resource.RootOriginatorDomain = 'root.com';

			// Expected values
			const expectedDepth = 0;

			// Spies, Stubs, Mocks
			this.sinon.stub(helpers, 'isNullOrUndefined').returns(false);
			this.sinon.stub(URI.prototype, 'domain').onFirstCall().returns('google.com');
			this.helpersIsIntegerStub.returns(false);

			// Validation
			this.validate(uri, originator, expectedDepth);
		});
	});
});