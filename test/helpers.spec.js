/**
 * Created by Roy on 09/09/2016.
 */

// npm modules
var chai                     = require('chai'),
	expect                   = require('chai').expect,
	sinon                    = require('sinon'),
	URI                      = require('urijs'),
	nrtvhe                   = require('nrtv-he'),
	fspvr                    = require('fspvr');

// lib modules
require('./spec_helper');

var helpers                  = require('../lib/helpers');

chai.should();

describe('helpers', function() {
	describe('isNullOrUndefined()', function() {
		before(function() {
			this.validate = function(variable, expectedReturnValue) {
				helpers.isNullOrUndefined(variable);

				sinon.assert.calledOnce(helpers.isNullOrUndefined);
				sinon.assert.calledWithExactly(helpers.isNullOrUndefined, variable);
				helpers.isNullOrUndefined.returned(expectedReturnValue).should.be.true;
			};
		});
		beforeEach(function() {
			this.sinon.spy(helpers, 'isNullOrUndefined');
		});
		it('should check if variable is null or undefined successfully', function() {
			// Input arguments
			var variable = 5;

			// Expected arguments to be returned by isNullOrUndefined()
			const expectedReturnValue = false;

			// Validation
			this.validate(variable, expectedReturnValue);
		});
	});
	describe('isInteger()', function() {
		before(function() {
			this.validate = function(value, expectedReturnValue) {
				helpers.isInteger(value);

				sinon.assert.calledOnce(helpers.isInteger);
				sinon.assert.calledWithExactly(helpers.isInteger, value);
				helpers.isInteger.returned(expectedReturnValue).should.be.true;
			};
		});
		beforeEach(function() {
			this.sinon.spy(helpers, 'isInteger');
		});
		it('should check a number value successfully', function() {
			// Input arguments
			var value = 5;

			// Expected arguments to be returned by isInteger()
			const expectedReturnValue = true;

			// Validation
			this.validate(value, expectedReturnValue);
		});
		it('should check a non number value successfully', function() {
			// Input arguments
			var value = 'oops';

			// Expected arguments to be returned by isInteger()
			const expectedReturnValue = false;

			// Validation
			this.validate(value, expectedReturnValue);
		});
	});
	describe('normalizeUri()', function() {
		before(function() {
			this.validate = function(uri, expectedReturnUri) {
				helpers.normalizeUri(uri);

				sinon.assert.calledOnce(helpers.normalizeUri);
				sinon.assert.calledWithExactly(helpers.normalizeUri, uri);
				helpers.normalizeUri.returned(expectedReturnUri).should.be.true;
			};
		});
		beforeEach(function() {
			this.sinon.spy(helpers, 'normalizeUri');
		});
		it('should normalize a valid uri with `www` subdomain and no protocol successfully', function() {
			// Input arguments
			var uri = URI.parse('https://www.google.com:443');
			uri.protocol = null;

			// Expected arguments to be returned by normalizeUri()
			const expectedReturnUri = new URI('https://google.com/');

			// Spies, Stubs, Mocks
			this.sinon.stub(helpers, 'isNullOrUndefined').returns(true);

			// Validation
			this.validate(uri, expectedReturnUri);
		});
		it('should normalize a valid uri without `www` subdomain and no protocol successfully', function() {
			// Input arguments
			var uri = URI.parse('http://google.com');
			uri.protocol = undefined;

			// Expected arguments to be returned by normalizeUri()
			const expectedReturnUri = new URI('http://google.com/');

			// Spies, Stubs, Mocks
			this.sinon.stub(helpers, 'isNullOrUndefined').returns(true);

			// Validation
			this.validate(uri, expectedReturnUri);
		});
		it('should normalize a valid uri with `www` subdomain and fail to normalize it successfully', function() {
			// Input arguments
			var uri = URI.parse('https://google.com');

			// Expected arguments to be returned by normalizeUri()
			var expectedReturnUri = new URI('');
			expectedReturnUri.toString(); // build expectedResource.__proto__._string property

			// Spies, Stubs, Mocks
			this.sinon.stub(helpers, 'isNullOrUndefined').returns(true);
			this.sinon.stub(URI.prototype, 'normalize').throws();

			// Validation
			this.validate(uri, expectedReturnUri);
		});
		it('should throw an exception because uri doesn\'t have a hostname', function() {
			// Input arguments
			var uri = {};

			// Specific validation
			expect(helpers.normalizeUri.bind(null, uri)).to.throw(Error, 'uri must provide a hostname');
		});
		it('should throw an exception because uri hostname is not of type string', function() {
			// Input arguments
			var uri = { hostname: 5 };

			// Specific validation
			expect(helpers.normalizeUri.bind(null, uri)).to.throw(TypeError, 'hostname must be of type string');
		});
		it('should throw an exception because uri protocol is not of type string', function() {
			// Input arguments
			var uri = {
				hostname: 'www.google.com',
				protocol: 5
			};

			// Spies, Stubs, Mocks
			this.sinon.stub(helpers, 'isNullOrUndefined').returns(false);

			// Specific validation
			expect(helpers.normalizeUri.bind(null, uri)).to.throw(TypeError, 'protocol must be of type string');
		});
		it('should throw an exception because uri username is not of type string', function() {
			// Input arguments
			var uri = {
				hostname: 'www.google.com',
				protocol: '80',
				username: 5
			};

			// Spies, Stubs, Mocks
			this.sinon.stub(helpers, 'isNullOrUndefined').returns(false);

			// Specific validation
			expect(helpers.normalizeUri.bind(null, uri)).to.throw(TypeError, 'username must be of type string');
		});
		it('should throw an exception because uri password is not of type string', function() {
			// Input arguments
			var uri = {
				hostname: 'www.google.com',
				protocol: '80',
				username: 'admin',
				password: 5
			};

			// Spies, Stubs, Mocks
			this.sinon.stub(helpers, 'isNullOrUndefined').returns(false);

			// Specific validation
			expect(helpers.normalizeUri.bind(null, uri)).to.throw(TypeError, 'password must be of type string');
		});
		it('should throw an exception because uri port is not of type string', function() {
			var u = URI.parse('http://www.google.com:443');
			// Input arguments
			var uri = {
				hostname: 'www.google.com',
				protocol: '80',
				username: 'admin',
				password: '1234',
				port: 5
			};

			// Spies, Stubs, Mocks
			this.sinon.stub(helpers, 'isNullOrUndefined').returns(false);

			// Specific validation
			expect(helpers.normalizeUri.bind(null, uri)).to.throw(TypeError, 'port must be of type string');
		});
		it('should throw an exception because uri cannot be decoded', function() {
			// Input arguments
			var uri = URI.parse('https://www.google.com:443');

			// Spies, Stubs, Mocks
			this.sinon.stub(URI, 'decode').throws(new Error('oops'));

			// Specific validation
			expect(helpers.normalizeUri.bind(null, uri)).to.throw(Error, 'oops');
		});
	});
	describe('isEmpty()', function() {
		before(function() {
			this.validate = function(str, expectedReturnValue) {
				helpers.isEmpty(str);

				sinon.assert.calledOnce(helpers.isEmpty);
				sinon.assert.calledWithExactly(helpers.isEmpty, str);
				helpers.isEmpty.returned(expectedReturnValue).should.be.true;
			};
		});
		beforeEach(function() {
			this.sinon.spy(helpers, 'isEmpty');
		});
		it('should check if str is empty successfully', function() {
			// Input arguments
			var str = 'abc';

			// Expected arguments to be returned by isEmpty()
			const expectedReturnValue = false;

			// Validation
			this.validate(str, expectedReturnValue);
		});
		it('should fail to check if str is empty because str is not of type string', function() {
			// Input arguments
			var str = 5;

			// Specific validation
			expect(helpers.isEmpty.bind(null, str)).to.throw(TypeError, 'str must be of type string');
		});
	});
	describe('customEscapeStringRegexp()', function() {
		before(function() {
			this.validate = function(str, expectedReturnValue) {
				helpers.customEscapeStringRegexp(str);

				sinon.assert.calledOnce(helpers.customEscapeStringRegexp);
				sinon.assert.calledWithExactly(helpers.customEscapeStringRegexp, str);
				helpers.customEscapeStringRegexp.returned(expectedReturnValue).should.be.true;
			};
		});
		beforeEach(function() {
			this.sinon.spy(helpers, 'customEscapeStringRegexp');
		});
		it('should check escape str successfully', function() {
			// Input arguments
			var str = 'abc/$';

			// Expected arguments to be returned by customEscapeStringRegexp()
			const expectedReturnValue = 'abc\\/\\$';

			// Validation
			this.validate(str, expectedReturnValue);
		});
	});
	describe('htmlUriDecode()', function() {
		before(function() {
			this.validate = function(uri, expectedReturnValue) {
				helpers.htmlUriDecode(uri);

				sinon.assert.calledOnce(helpers.htmlUriDecode);
				sinon.assert.calledWithExactly(helpers.htmlUriDecode, uri);
				helpers.htmlUriDecode.returned(expectedReturnValue).should.be.true;
			};
		});
		beforeEach(function() {
			this.sinon.spy(helpers, 'htmlUriDecode');
		});
		it('should uri decode successfully', function() {
			// Input arguments
			var uri = 'Hello%20World';

			// Expected arguments to be returned by htmlUriDecode()
			const expectedReturnValue = 'Hello World';

			// Spies, Stubs, Mocks
			this.sinon.stub(nrtvhe, 'decode').returns('Hello World');

			// Validation
			this.validate(uri, expectedReturnValue);
		});
	});
	describe('makeFileNameFromUri()', function() {
		before(function() {
			this.validate = function(uri, expectedReturnValue) {
				helpers.makeFileNameFromUri(uri);

				sinon.assert.calledOnce(helpers.makeFileNameFromUri);
				sinon.assert.calledWithExactly(helpers.makeFileNameFromUri, uri);
				helpers.makeFileNameFromUri.returned(expectedReturnValue).should.be.true;
			};
		});
		beforeEach(function() {
			this.sinon.spy(helpers, 'makeFileNameFromUri');
		});
		it('should make file name from uri without a file name and without a query in it successfully', function() {
			// Input arguments
			var uri = new URI('https://www.google.com');

			// Expected arguments to be returned by makeFileNameFromUri()
			const expectedReturnValue = 'index.html';

			// Spies, Stubs, Mocks
			this.sinon.stub(fspvr, 'reformatSegment').returns('index.html');

			// Validation
			this.validate(uri, expectedReturnValue);
		});
		it('should make file name from uri without a file name and with a query in it successfully', function() {
			// Input arguments
			var uri = new URI('https://www.google.com?var=val');

			// Expected arguments to be returned by makeFileNameFromUri()
			const expectedReturnValue = 'index.html-var=val';

			// Spies, Stubs, Mocks
			this.sinon.stub(helpers, 'htmlUriDecode').returns('var=val');
			this.sinon.stub(fspvr, 'reformatSegment').returns('index.html-var=val');

			// Validation
			this.validate(uri, expectedReturnValue);
		});
		it('should make file name from uri with a file name and without an extension in it successfully', function() {
			// Input arguments
			var uri = new URI('https://www.google.com/file.txt');

			// Expected arguments to be returned by makeFileNameFromUri()
			const expectedReturnValue = 'file.txt';

			// Spies, Stubs, Mocks
			this.sinon.stub(fspvr, 'reformatSegment').returns('file.txt');

			// Validation
			this.validate(uri, expectedReturnValue);
		});
		it('should make file name from uri with a file name and with an extension and without a query in it successfully', function() {
			// Input arguments
			var uri = new URI('https://www.google.com/file');

			// Expected arguments to be returned by makeFileNameFromUri()
			const expectedReturnValue = 'file';

			// Spies, Stubs, Mocks
			this.sinon.stub(fspvr, 'reformatSegment').returns('file');

			// Validation
			this.validate(uri, expectedReturnValue);
		});
		it('should make file name from uri with a file name and with an extension and with a query in it successfully', function() {
			// Input arguments
			var uri = new URI('https://www.google.com/file?var=val');

			// Expected arguments to be returned by makeFileNameFromUri()
			const expectedReturnValue = 'file-var=val';

			// Spies, Stubs, Mocks
			this.sinon.stub(helpers, 'htmlUriDecode').returns('var=val');
			this.sinon.stub(fspvr, 'reformatSegment').returns('file-var=val');

			// Validation
			this.validate(uri, expectedReturnValue);
		});
	});
});