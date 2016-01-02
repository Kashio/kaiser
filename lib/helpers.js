/**
 * Created by Roy on 01/01/2016.
 */

'use strict';

// npm modules
var URI        = require('urijs');

function normalizeUri(uri) {
    if (!uri.hostname) {
        throw new Error('uri must provide a hostname');
    }
    uri.protocol = uri.protocol || uri.port === 443 ? 'https' : 'http';
    return new URI(URI.build(uri)).normalize();
}

exports.normalizeUri = normalizeUri;