"use strict";

var classUtils = require('../utils/class-utils')
  , http = require('http');

/**
 * Base class for errors.
 *
 * @param {Number} statusCode
 *    HTTP status code.
 *
 * @param {*=} data
 *    Any additional data.
 *
 * @extends Error
 * @constructor
 */
function HTTPError(statusCode, data) {
  Error.call(this);
  Error.captureStackTrace(this, this.constructor);

  /**
   * Human-readable error name.
   *
   * @type {String}
   */
  this.name = http.STATUS_CODES[statusCode];

  /**
   * HTTP status code.
   *
   * @type {Number}
   */
  this.statusCode = statusCode;

  /**
   * Any additional data.
   *
   * @type {*}
   */
  this.data = data;

  if (data) {
    // Property of Error.
    this.message = JSON.stringify(data);
  }
}

classUtils.inherits(HTTPError, Error);

HTTPError.prototype.toJSON = function() {
  return {
    name: this.name,
    statusCode: this.statusCode,
    data: this.data
  };
};

module.exports = HTTPError;
