"use strict";

var ValidationError = require('../errors/ValidationError')
  , HTTPError = require('../errors/HTTPError');

/**
 * Assertions for promises that return `Model` instances.
 */
module.exports = {

  /**
   * Shortcut for `assert.attrEquals(attribute, null)`.
   *
   * @param {String} attribute
   * @returns {function(SqlModel)}
   */
  attrNull: function(attribute) {
    return module.exports.attrEquals(attribute, null);
  },

  /**
   * Shortcut for `assert.attrNotEquals(attribute, null)`.
   *
   * @param {String} attribute
   * @returns {function(SqlModel)}
   */
  attrNotNull: function(attribute) {
    return module.exports.attrNotEquals(attribute, null);
  },

  /**
   * Shortcut for `assert.attrEquals(attribute, true)`.
   *
   * @param {String} attribute
   * @returns {function(SqlModel)}
   */
  attrTrue: function(attribute) {
    return module.exports.attrEquals(attribute, true);
  },

  /**
   * Shortcut for `assert.attrEquals(attribute, false)`.
   *
   * @param {String} attribute
   * @returns {function(SqlModel)}
   */
  attrFalse: function(attribute) {
    return module.exports.attrEquals(attribute, false);
  },

  /**
   * Returns a function that throws `HTTPError(404)` if the argument is null or undefined.
   *
   * @returns {function(SqlModel)}
   */
  hasResult: function() {
    return function(result) {
      if (result === null || result === void 0) {
        throw new HTTPError(404);
      }
      return result;
    }
  },

  /**
   * Returns a function that asserts that an attribute of a `Model` instance equals `value`.
   *
   * Examples:
   *
   * ```js
   * var model1 = SomeModel.fromJson({someAttribute: null});
   * Promise
   *   .resolve(model1)
   *   .then(assert.attrEquals('someAttribute', null));
   *   .catch(function(err) {
   *     // We never get here!
   *   });
   *
   * var model2 = SomeModel.fromJson({someAttribute: 'some non-null value'});
   * Promise
   *   .resolve(model2)
   *   .then(assert.attrEquals('someAttribute', null));
   *   .catch(function(err) {
   *     // OOPS! assertion failed.
   *     console.log(err);
   *   });
   * ```
   *
   * @param {String} attribute
   * @param {*} value
   * @returns {function(SqlModel)}
   */
  attrEquals: function(attribute, value) {
    return function(result) {
      if (result[attribute] !== value) {
        var error = {};
        error[attribute] = attribute + " must equal " + value;
        throw new ValidationError(error);
      }
      return result;
    };
  },

  /**
   * Returns a function that asserts that an attribute of a `Model` instance doesn't equal `value`.
   *
   * Examples:
   *
   * ```js
   * var model1 = SomeModel.fromJson({someAttribute: null});
   * Promise
   *   .resolve(model1)
   *   .then(assert.attrNotEquals('someAttribute', null));
   *   .catch(function(err) {
   *     // OOPS! assertion failed.
   *     console.log(err);
   *   });
   *
   * var model2 = SomeModel.fromJson({someAttribute: 'some non-null value'});
   * Promise
   *   .resolve(model2)
   *   .then(assert.attrEquals('someAttribute', null));
   *   .catch(function(err) {
   *     // We never get here!
   *   });
   * ```
   *
   * @param {String} attribute
   * @param {*} value
   * @returns {function(SqlModel)}
   */
  attrNotEquals: function(attribute, value) {
    return function(result) {
      if (result[attribute] === value) {
        var error = {};
        error[attribute] = attribute + " must not equal " + value;
        throw new ValidationError(error);
      }
      return result;
    };
  }
};
