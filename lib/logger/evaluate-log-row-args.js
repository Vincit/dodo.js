var _ = require('lodash');
var util = require('util');

/**
 * Helper for log handlers to evaluate / interpolate logger arguments.
 *
 * @return {{ level: string, metadata: object, message: string }}
 */
function evaluateLogRowArgs(logArgs) {
  var name = logArgs[0];
  var logLevel = logArgs[1];
  var message = null;
  var obj = null;

  var firstArg = logArgs[2];

  if (!firstArg) {
    throw new Error('Invalid logArgs. At least one argument to log must be given.');
  }

  // resolve first argument if it is message or metadata
  if (_.isString(firstArg)) {
    message = util.format.apply(util.format, _.slice(logArgs, 2, logArgs.length));
  } else if (_.isFunction(firstArg)) {
    var firstArgFunctionResult = firstArg();
    if (_.isString(firstArgFunctionResult)) {
      message = firstArgFunctionResult;
    } else {
      obj = firstArgFunctionResult;
    }
  } else {
    obj = firstArg;
  }

  // if first argument was object, second argument defines the message
  // and if second argument is function it evaluates to message or params
  // are passed to util.format
  var secondArg = logArgs[3];

  if (!message && secondArg) {
    if (_.isFunction(secondArg)) {
      message = secondArg();
    } else {
      message = util.format.apply(util.format, _.slice(logArgs, 3, logArgs.length));
    }
  }

  return {
    name: name,
    level: logLevel,
    metadata: obj,
    message: message
  };
}

module.exports = {
  evaluateLogRowArgs: evaluateLogRowArgs
};
