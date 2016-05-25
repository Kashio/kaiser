/**
 * Created by Roy on 21/05/2016.
 */

'use strict';

// npm modules
var sinon          = require('sinon');

// lib modules
var ResourceWorker = require('../lib/resource_worker');

module.exports = {
	beforeEach: function() {
		sinon.spy(ResourceWorker, "init");
	},
	afterEach: function() {
		ResourceWorker.init.restore();
	}
};