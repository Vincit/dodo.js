var _ = require('lodash')
  , util = require('util');

module.exports = {
  /**
   * Makes the `Constructor` inherit `SuperConstructor`.
   *
   * Calls node.js `util.inherits` but also copies the "static" properties from
   * `SuperConstructor` to `Constructor`.
   *
   * @param {function} Constructor
   * @param {function} SuperConstructor
   */
  inherits: function(Constructor, SuperConstructor) {
    var keys = Object.keys(SuperConstructor);
    for (var i = 0, l = keys.length; i < l; ++i) {
      var key = keys[i];
      Constructor[key] = SuperConstructor[key];
    }
    util.inherits(Constructor, SuperConstructor);
    Constructor.super_ = SuperConstructor;
  },

  /**
   * Tests if a constructor function inherits another constructor function.
   *
   * @ignore
   * @param {Object} Constructor
   * @param {Object} SuperConstructor
   * @returns {boolean}
   */
  isSubclassOf: function(Constructor, SuperConstructor) {
    if (!_.isFunction(SuperConstructor)) {
      return false;
    }

    while (_.isFunction(Constructor)) {
      if (Constructor === SuperConstructor) return true;
      var proto = Constructor.prototype.__proto__;
      Constructor = proto && proto.constructor;
    }

    return false;
  }
};
