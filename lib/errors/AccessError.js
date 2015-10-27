"use strict";

var HTTPError = require('./HTTPError')
  , classUtils = require('../utils/class-utils');

/**
 * Error of this class is thrown when a user does not have sufficient access to a resource.
 *
 * @param {String} error Error message string.
 *
 * @extends HTTPError
 * @constructor
 */
function AccessError(error) {
  HTTPError.call(this, 403, { reason: error });
}

classUtils.inherits(AccessError, HTTPError);

module.exports = AccessError;
