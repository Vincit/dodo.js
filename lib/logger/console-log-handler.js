/**
 * Passes logs directly to console.log.
 */
var util = require('util');

var evaluateLogRowArgs = require('./evaluate-log-row-args');

function ConsoleLogHandler() {}

ConsoleLogHandler.prototype.log = function () {
  var evaluatedArgs = evaluateLogRowArgs(arguments);
  // TODO: add colors and stuff here to make these logs pretty
  var message = evaluatedArgs.message || '';
  var metadataAsString = (evaluatedArgs.metadata ? ' ' + util.inspect(evaluatedArgs.metadata, { color: true, depth: null }) : '');
  console.log(new Date().toISOString(), evaluatedArgs.name, evaluatedArgs.level.toLocaleUpperCase(), message + metadataAsString);
};

module.exports = {
  ConsoleLogHandler: ConsoleLogHandler
};
