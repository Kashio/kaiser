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

Resource.RootOriginatorDomain = undefined;

Resource.instance = function(uri, originator) {
    var self = this;
    uri = new URI(uri);
    if (isNullOrUndefined(originator)) {
        Resource.RootOriginatorDomain = uri.domain();
    }
    return new Resource(uri, Resource.calculateDepth(uri, originator), originator);
};

Resource.calculateDepth = function(uri, originator) {
    if (!isNullOrUndefined(originator)) {
        if (originator.uri.domain() === Resource.RootOriginatorDomain && uri.domain() !== originator.uri.domain()) {
            return 0;
        }
        return (isInteger(originator.depth) ?
        originator.depth + 1 :
            0);
    }
    return 0;
};

module.exports = Resource;