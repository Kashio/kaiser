/**
 * Created by Roy on 03/01/2016.
 */

'use strict';

function Cache() {
    throw new Error('cannot instantiate Cache because it\'s an abstract class');
}

Cache.prototype.save = function(resource, callback) {
    throw new Error('cannot call abstract method');
};

Cache.prototype.retrieve = function(uri) {
    throw new Error('cannot call abstract method');
};

module.exports = Cache;