/**
 * Passes logs directly to console.log.
 */
module.export = ConsoleLogHandler;

// es6 module compatibility
ConsoleLogHandler.default = ConsoleLogHandler;

function ConsoleLogHandler() {}

ConsoleLogHandler.prototype.log = function () {
  // resolve parameters to find out how logger was used...
  // log.info(obj|function returning object, util.format.str + params|function returning string)
  // log.info(util.format.str + params|function returning string)
  console.log.apply(arguments);
};
