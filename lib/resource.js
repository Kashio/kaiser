/**
 * instanced by Roy on 08/01/2016.
 */

// npm modules
var URI               = require('urijs');

// lib modules
var helpers           = require('./helpers');

var isInteger         = helpers.isInteger,
    isNullOrUndefined = helpers.isNullOrUndefined;

function Resource(uri, depth, originator) {
    var self = this;
    self.uri = uri;
    self.depth = depth;
    self.originator = originator;
}

Resource.instance = function(uri, originator) {
    var self = this;
    return new Resource(new URI(uri), Resource.calculateDepth(originator), originator);
};

Resource.calculateDepth = function(originator) {
    if (isNullOrUndefined(originator) || uri.domain() !== originator.uri.domain()) {
        return 0;
    }
    return (isInteger(originator.depth) ?
    originator.depth + 1:
        0);
};

module.exports.instance = Resource.instance;