var _ = require('lodash')
  , expect = require('chai').expect;

module.exports = {
  /**
   * Expect that `result` contains all attributes of `partial` and their values equal.
   *
   * Example:
   *
   * ```js
   * // doesn't throw.
   * expectPartialEqual({a: 1, b: 2}, {a: 1});
   * // doesn't throw.
   * expectPartialEqual([{a: 1, b: 2}, {a: 2, b: 4}], [{a: 1}, {b: 4}]);
   * // Throws
   * expectPartialEqual({a: 1}, {b: 1});
   * // Throws
   * expectPartialEqual({a: 1}, {a: 2});
   * ```
   */
  expectPartialEqual: function expectPartialEqual(result, partial) {
    if (_.isArray(result) && _.isArray(partial)) {
      expect(result).to.have.length(partial.length);
      _.each(result, function (value, idx) {
        expectPartialEqual(result[idx], partial[idx]);
      });
    } else if (_.isObject(result) && !_.isArray(partial) && _.isObject(partial) && !_.isArray(result)) {
      var partialKeys = _.keys(partial);
      expect(_.pick(result, partialKeys)).to.eql(partial);
    } else {
      throw new Error('result and partial must both be arrays or objects');
    }
  }
};
