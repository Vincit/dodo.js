var _ = require('lodash')
  , util = require('util');

/**
 * Makes the `Constructor` inherit `SuperConstructor`.
 *
 * Calls node.js `util.inherits` but also copies the "static" properties from
 * `SuperConstructor` to `Constructor`.
 *
 * @param {function} Constructor
 * @param {function} SuperConstructor
 */
module.exports.inherits = function(Constructor, SuperConstructor) {
  var keys = Object.keys(SuperConstructor);
  for (var i = 0, l = keys.length; i < l; ++i) {
    var key = keys[i];
    Constructor[key] = SuperConstructor[key];
  }
  util.inherits(Constructor, SuperConstructor);
  Constructor.super_ = SuperConstructor;
};

/**
 * Tests if a constructor function inherits another constructor function.
 *
 * @param {function} Constructor
 * @param {function} SuperConstructor
 * @returns {boolean}
 */
module.exports.isSubclassOf = function(Constructor, SuperConstructor) {
  if (!_.isFunction(SuperConstructor)) {
    return false;
  }

  while (_.isFunction(Constructor)) {
    if (Constructor === SuperConstructor) return true;
    Constructor = Constructor.super_;
  }
  return false;
};
