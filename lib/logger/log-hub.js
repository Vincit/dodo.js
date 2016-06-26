/**
 * Dodo plugins and packages require common logger to be able to handle
 * and route log messages to e.g. some logging service. Common logger
 * makes it easier to handle logging in all separate dodo components
 * (every external module will be compatible).
 *
 * Main features:
 *
 * - Get logger anywhere in your code without need to get application context
 * - Route destination where each log stream should be written also after
 *   logger has already been created without need to have access to created
 *   logger instance
 * - Allow to pass hooks for handling log messages (logger can use any existing
 *   logger as a backend for processing log messages)
 *
 * Logger allows to dynamically change where logs are written independently
 * when logger instance has been required to library, so this way one can
 * just get logger anywhere in program, start to log and leave the main
 * application to decide what to do with them.
 *
 * Loger interface is inspired from Winston and Bunyan to enable most
 * common use cases of the both loggers to be available.
 */

// TODO: WRITE OFFICIAL DOCUMENTATION FROM THESE COMMENTS

// Dodo uses 5 log levels
// trace, debug, info, warn, error

// log.info(obj|function returning object, util.format.str + params|function returning string)
// log.info(util.format.str + params|function returning string)

// one can setup per logger mappers for different object types (usually
// you shouldn't touch mappers of logger which is not yours)...

// If e.g. creating data for debug log requires expensive computation one might
// use lazily evaluated functions to create the log string or object instead of
// using util.format compatible string / parameters.


// static global instance keeping track all the logs flowing through
// the system (as much as I hate global data this is an exception)
function LogHub() {}

var loggerInstances = {};
var logHandlers = [];

// Each logger has its log handler and if handler is not assigned,
// it finds and cache it. When new handlers are registered to system
// all cacahed handlers will be flushed and when stream tries to write next
// log it will also resolve correct handler for it.

// Basic use case how loggers are configured is that you write some
// default handler e.g. for '*' which will be default handler for all logs.
// Then you might like to direct all 'dodo.core.*' logs to other file.
// Latter definition will take the precedence and then all
// 'dodo.core.*' logs will be put only to latest matching handler, not
// to both of them.

// By default Loggers are already setup for logging levels:
// info, warning, error

/**
 * You should be using some hierarchical logger naming for your library
 *
 * <npm-package>.<module>.<file>
 *
 * e.g. for build system helpers it could be 'dodo.build.helpers'
 */
LogHub.getLogger = function (loggerNameString) {
  var logger = loggerInstances[loggerNameString];
  if (!logger) {
    logger = new Logger();
    loggerInstances[loggerNameString] = logger;
    // Here we could check that number of loggers is not unreasonably large.
    // If there are tens of thousands different logger names, probably
    // some of the libraries using the logger is using it wrong.
  }
  return logger;
};

/**
 * This allow application to setup where logs should be written.
 *
 * By default trace, and debug are passed to DevNullHandler and
 * info, warning and error are passed to ConsoleLogHandler.
 *
 * @param {Array} logLevels .
 * @param pattern is passed to string.match to match the stream.
 * @param handlerInstance Some class or object which has
 *        instance.log(level, ...<log function parameters>).
 */
LogHub.setHandler = function (logLevels, pattern, handlerInstance) {
};

/**
 * Remove all registered handlers and clear cached handler instances.
 */
LogHub.clearHandlers = function () {
};

/**
 * Actual instance which provides logging APIs
 */
function Logger() {
}

Logger.levels = {
  trace: 'trace',
  debug: 'debug',
  info: 'info',
  warning: 'warning',
  error: 'error'
};

Logger.prototype.trace = createLoggerFunction('trace');
Logger.prototype.debug = createLoggerFunction('debug');
Logger.prototype.info  = createLoggerFunction('info');
Logger.prototype.warning  = createLoggerFunction('warning');
Logger.prototype.error = createLoggerFunction('error');

function createLoggerFunction(level) {
  return function () {
    console.log("Level", level);
  };
}
