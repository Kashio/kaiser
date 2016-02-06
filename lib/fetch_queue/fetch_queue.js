/**
 * Created by Roy on 06/02/2016.
 */

'use strict';

function FetchQueue() {
    throw new Error('cannot instantiate FetchQueue because it\'s an abstract class');
}

FetchQueue.prototype.queue = function(resources, callback) {
    throw new Error('cannot call abstract method');
};

FetchQueue.prototype.exists = function(uri) {
    throw new Error('cannot call abstract method');
};

module.exports = FetchQueue;