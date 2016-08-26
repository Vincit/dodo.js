/**
 * Ignores logs.
 */
function DevNullHandler() {}

DevNullHandler.prototype.log = function () {};

module.exports = {
  DevNullHandler: DevNullHandler
};
