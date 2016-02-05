/**
 * Created by Roy on 05/02/2016.
 */

'use strict';

function Composer() {
    throw new Error('cannot instantiate Composer because it\'s an abstract class');
}

Composer.prototype.compose = function(uris, originator, callback) {
    throw new Error('cannot call abstract method');
};

module.exports = Composer;