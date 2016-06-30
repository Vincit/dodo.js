/**
 * Passes logs directly to console.log.
 */
module.exports = ConsoleLogHandler;

var evaluateLogRowArgs = require('./evaluate-log-row-args');

var util = require('util');

// es6 module compatibility
ConsoleLogHandler.default = ConsoleLogHandler;

function ConsoleLogHandler() {}

ConsoleLogHandler.prototype.log = function () {
  var evaluatedArgs = evaluateLogRowArgs(arguments);
  // TODO: add colors and stuff here to make these logs pretty
  var metadataAsString = (evaluatedArgs.metadata ? ' ' + util.inspect(evaluatedArgs.metadata, { color: true, depth: null }) : '');
  console.log(evaluatedArgs.level.toLocaleUpperCase(), evaluatedArgs.message + metadataAsString);
};
