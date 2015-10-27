var _ = require('lodash')
  , jsonUtils = require('./json-utils');

module.exports = {
  /**
   * Splits an array into arrays of length `len`.
   *
   * @param {Array} arr
   * @param {Number} len
   * @returns {Array.<Array>}
   */
  chunked: function (arr, len) {
    var chunks = []
      , i = 0
      , n = arr.length;

    if (n <= len) {
      return [arr];
    }

    while (i < n) {
      chunks.push(arr.slice(i, i += len));
    }

    return chunks;
  },
  /**
   * Calculates what should be created, updated and deleted to get from `currentValues` to `newValues`.
   *
   * Assumes that objects in the input arrays have `.id` identifier property.
   *
   * Example:
   *
   * ```js
   * arrayUtils.differences([{id: 1}, {id: 2}, {id: 3}], [{id: 1}, {id: 4}]);
   * --> {
   *   create: [{id: 4}],
   *   update: [{id: 1}],
   *   delete: [{id: 2}, {id: 3}]
   * }
   * ```
   *
   * @param {Array.<Object>} currentValues
   * @param {Array.<Object>} newValues
   * @param {Object=} options
   * @param {Boolean=} options.testEquality
   * @param {String=} options.idAttr
   * @returns {{create:Array.<Object>, update:Array.<Object>, delete:Array.<Object>}}
   */
  differences: function (currentValues, newValues, options) {
    options = options || {};
    options.idAttr = options.idAttr || 'id';
    options.testEquality = options.testEquality || false;

    var diff = {create: [], update: [], delete: []}
      , idAttr = options.idAttr
      , currentById = {}
      , newById = {};

    _.each(currentValues, function (value) {
      currentById[value[idAttr]] = value;
    });

    _.each(newValues, function (value) {
      if (value[idAttr]) {
        newById[value[idAttr]] = value;
      } else {
        diff.create.push(value);
      }
    });

    _.each(newById, function (value) {
      if (currentById[value[idAttr]]) {
        if (!options.testEquality || !jsonUtils.isEqual(value, currentById[value[idAttr]])) {
          diff.update.push(value);
        }
      } else {
        diff.create.push(value);
      }
    });

    _.each(currentById, function (value) {
      if (!newById[value[idAttr]]) {
        diff.delete.push(value);
      }
    });

    return diff;
  }
};
