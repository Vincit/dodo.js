/**
 * Ignores logs.
 */
module.exports = DevNullHandler;

// es6 module compatibility
DevNullHandler.default = DevNullHandler;

function DevNullHandler() {}

DevNullHandler.prototype.log = function () {};
