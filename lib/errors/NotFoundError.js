"use strict";

var HTTPError = require('./HTTPError')
  , classUtils = require('../utils/class-utils');

/**
 * Error of this class is thrown when a resource is not found.
 *
 * @param {String} error Error message string.
 *
 * @extends HTTPError
 * @constructor
 */
function NotFoundError(error) {
  HTTPError.call(this, 404, { reason: error });
}

classUtils.inherits(NotFoundError, HTTPError);

module.exports = NotFoundError;
