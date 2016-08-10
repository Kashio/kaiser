/**
 * Created by Roy on 21/05/2016.
 */

'use strict';

// npm modules
var sinon          = require('sinon');

// lib modules
var specHelper     = require('./spec_helper'),
    ResourceWorker = require('../lib/resource_worker');

module.exports = {
	beforeEach: function() {
		this.sinon.spy(ResourceWorker, 'init');
	}
};