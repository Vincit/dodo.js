"use strict";

var HTTPError = require('./HTTPError')
  , classUtils = require('../utils/class-utils');

/**
 * Error of this class is thrown when an unique violation error happens in the database.
 *
 * @param {Object.<String, String>} violations
 *    Hash of violation errors. One for each violation.
 *
 * @extends HTTPError
 * @constructor
 * @deprecated Use ConflictError instead!
 */
function UniqueViolationError(violations) {
  HTTPError.call(this, 409, violations);
}

classUtils.inherits(UniqueViolationError, HTTPError);

module.exports = UniqueViolationError;
