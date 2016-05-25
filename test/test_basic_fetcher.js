/**
 * Created by Roy on 14/05/2016.
 */

// core modules
var fs            = require('fs'),
	util          = require('util');

// npm modules
var chai          = require('chai'),
	chai_things   = require('chai-things'),
	sinon         = require('sinon'),
    stripBom      = require('strip-bom');

// lib modules
var kaiser        = require('../index'),
	server        = require('./server'),
	Resource      = require('../lib/resource'),
	PolicyChecker = require('../lib/policy_checker');

var Fetcher       = kaiser.Fetcher,
	BasicFetcher  = kaiser.BasicFetcher,
	should        = chai.should();

chai.use(chai_things);

describe('BasicFetcher', function() {
	describe('constructor', function() {
		it('call BasicFetcher.init() function', function() {
			var basicFetcherInitSpy = sinon.spy(BasicFetcher, 'init');
			new BasicFetcher('crawler', 'options', 'requestSettings');
			sinon.assert.calledOnce(basicFetcherInitSpy);
			sinon.assert.calledWithExactly(basicFetcherInitSpy, 'crawler', 'options', 'requestSettings');
		});
	});
	describe('.init()', function() {
		it('call Fetcher.init() function', function() {
			var basicFetcher = {};
			var fetcherInitSpy = sinon.spy(Fetcher, 'init');
			BasicFetcher.init.call(basicFetcher, 'crawler', 'options', 'requestSettings');
			sinon.assert.calledOnce(fetcherInitSpy);
			sinon.assert.calledWithExactly(fetcherInitSpy, 'crawler');
			basicFetcher.should.have.property('policyChecker').and.to.be.instanceof(PolicyChecker);
			basicFetcher.should.have.property('maxAttempts').and.to.equal(10);
			basicFetcher.should.have.property('retryDelay').and.to.equal(5000);
			basicFetcher.should.have.property('maxConcurrentRequests').and.to.equal(100);
			basicFetcher.should.have.property('fetchedUris').and.to.be.instanceof(Array).and.to.be.empty;
			basicFetcher.should.have.property('pendingRequests').and.to.be.instanceof(Array).and.to.be.empty;
			basicFetcher.should.have.property('activeRequests').and.to.equal(0);
			basicFetcher.should.have.property('totalBytesFetched').and.to.equal(0);
		});
	});
	describe('#logic()', function() {
		it ('fetch a resource', function() {

		});
	});
});