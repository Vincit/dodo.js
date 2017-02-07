"use strict";

var HTTPError = require('./http-error').HTTPError
  , classUtils = require('../utils/class-utils');

/**
 * Error of this class is thrown when a conflict error happens in the database.
 *
 * @param {Object.<String, String>} conflicts
 *    Hash of conflict errors. One for each conflict.
 *
 * @extends HTTPError
 * @constructor
 */
function ConflictError(conflicts) {
  HTTPError.call(this, 409, conflicts);
}

classUtils.inherits(ConflictError, HTTPError);

module.exports = {
  ConflictError: ConflictError
};
