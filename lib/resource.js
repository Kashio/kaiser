/**
 * Created by Roy on 08/01/2016.
 */

// npm modules
var URI               = require('urijs');

// lib modules
var helpers           = require('./helpers');

var isInteger         = helpers.isInteger,
    isNullOrUndefined = helpers.isNullOrUndefined;

function Resource(uri, depth) {
    var self = this;

    self.uri = uri;
    self.depth = depth;
}

Resource.Create = function(uri, originator) {
    var self = this;
    uri = new URI(uri);
    var depth;
    if (isNullOrUndefined(originator) || uri.domain() !== originator.uri.domain()) {
        depth = 0;
    } else {
        depth = isInteger(originator.depth) ?
        originator.depth + 1:
            0;
    }
    return new Resource(uri, depth);
};

module.exports.Create = Resource.Create;