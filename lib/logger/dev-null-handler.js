/**
 * Ignores logs.
 */
module.export = DevNullHandler;

// es6 module compatibility
DevNullHandler.default = DevNullHandler;

function DevNullHandler() {}

DevNullHandler.prototype.log = function () {};
