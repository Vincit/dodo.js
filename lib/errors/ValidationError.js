"use strict";

var HTTPError = require('./HTTPError')
  , classUtils = require('../utils/class-utils');

/**
 * Error of this class is thrown when a request data validation fails.
 *
 * @param {Object.<string, string>} errors
 *    A hash of 'attribute' : 'Error message' pairs. If 'username' failed validation there should be a
 *   'username' : 'Invalid username ...' pair in the hash.
 *
 * @extends HTTPError
 * @constructor
 */
function ValidationError(errors) {
  HTTPError.call(this, 400, errors);
}

classUtils.inherits(ValidationError, HTTPError);

module.exports = ValidationError;
