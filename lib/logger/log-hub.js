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
 * Loger interface is inspired from Winston and Bunyan and allows to pass
 * util.format type message arguments and possibly metadata object.
 */

// TODO: WRITE OFFICIAL DOCUMENTATION FROM THESE COMMENTS

// When new handler is added, all old handler bindings are invalidated for active
// log instances.

// When log doesn't have any handler assigned to it, it runs handler resolver
// to know where to pass logs.

// To keep things simple and usage conventions of log levels as consistent as
// possible library introduces only 5 log levels.
// trace, debug, info, warn, error

// Basic use case how loggers are configured is that you write some
// default handler e.g. for '*' which will be default handler for all logs.
// Then you might like to direct all 'dodo.core.*' logs to other file.
// Latter definition will take the precedence and then all
// 'dodo.core.*' logs will be put only to latest matching handler, not
// to both of them.

// By default Loggers are already setup for passing log-levels:
// info, warning and error to ConsoleLogHandler

// Logger functions has few different signatures...
// log.info(obj|function returning object, util.format.str + params|function returning string)
// log.info(util.format.str + params|function returning string)

// Function parameters might be useful for e.g. debug log level which may require
// expensive computation. By passing functions to logger the parameters are evaluated
// only if logs are actually going to be passed forward and not just ignored.

var _ = require('lodash');

var ConsoleLogHandler = require('./console-log-handler');
var DevNullHandler = require('./dev-null-handler');

module.exports = LogHub;

/**
 * Static global instance keeping track all the logs flowing throug
 * the system (as much as I hate global data this is an exception)
 *
 * LogHub keeps track of active logs and log handlers and makes sure
 * that when new handlers are introduced, log instances will be updated
 * to change where logs are routed accordingly.
 */
function LogHub() {}

var level = LogHub.level = {
  trace: 'trace',
  debug: 'debug',
  info: 'info',
  warning: 'warning',
  error: 'error'
};

// expose loggerInstances to allow porgram to e.g. list all logging streams
// of application
var loggerInstances = LogHub.loggerInstances = {};
var logHandlers = [];

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
    logger = new Logger(loggerNameString);
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
 * @param {Array} logLevels
 * @param pattern is passed to string.match to match the stream.
 * @param handlerInstance Some object which has
 *        instance.log(level, ...<log function parameters>).
 */
LogHub.setHandler = function (logLevels, pattern, handlerInstance) {
  if (_.isEmpty(logLevels)) {
    throw new Error('No log levels given to handler');
  }

  if (!handlerInstance || !_.isFunction(handlerInstance.log)) {
    throw new Error('Handler object must have .log method');
  }

  _.each(logLevels, function (level) {
    if (!LogHub.level[level]) {
      throw new Error('Invalid log level "' + level + '"');
    }
  });

  logHandlers.unshift({
    levels: logLevels,
    pattern: pattern,
    handler: handlerInstance
  });

  LogHub._clearCaches();
};

/**
 * Remove all registered handlers and clear cached handler instances.
 */
LogHub.clearHandlers = function () {
  LogHub._clearCaches();
  logHandlers.splice(0, logHandlers.length);
};

/**
 * Clear logger instance caches to make sure that new handlers are assigned
 * to matching loggers.
 */
LogHub._clearCaches = function () {
  _.each(loggerInstances, function (logger) {
    logger.clearCachedLoggers();
  });
};

/**
 * Reset LogHub to use default handlers.
 */
LogHub.resetToDefaultLogHandlers = function () {
  LogHub.clearHandlers();
  var defaultLogger = new ConsoleLogHandler();
  LogHub.setHandler([level.info, level.warning, level.error], /.*/, defaultLogger);
  // TODO: maybe some environment variable to allow to change default log level...
  //       DODO_LOGGER_DEFAULT_LEVEL=trace
  // LogHub.setHandler([level.trace, level.debug, level.info, level.warning, level.error], /.*/, defaultLogger);
}

/**
 * Actual instance which provides logging APIs
 */
function Logger(name) {
  this.name = name;
  // cached handlers where different error levels are written
  this._handlers = {};
}

/**
 * Resolves and caches which handler to use for writing logs.
 */
Logger.prototype._getHandler = function (level) {
  var self = this;

  function findHandler(level) {
    var handlerObj = _.find(logHandlers, function (handler) {
      var correctLevel = _.includes(handler.levels, level);
      return correctLevel && !_.isNull(self.name.match(handler.pattern));
    });

    if (handlerObj) {
      self._handlers[level] = handlerObj.handler;
      return handlerObj.handler;
    }

    return;
  }

  // if there is nothing that matches, just use dev null handler
  return this._handlers[level] || findHandler(level) || new DevNullHandler();
};

/**
 * Clears any cached log handlers. Will resolve / cache new log
 * handler on next .info any other log method call.
 */
Logger.prototype.clearCachedLoggers = function () {
  this._handlers = {};
};

Logger.prototype.trace = createLoggerFunction('trace');
Logger.prototype.debug = createLoggerFunction('debug');
Logger.prototype.info  = createLoggerFunction('info');
Logger.prototype.warning  = createLoggerFunction('warning');
Logger.prototype.error = createLoggerFunction('error');

function createLoggerFunction(level) {
  return function () {
    var name = this.name;
    var handler = this._getHandler(level);
    var argumentsWithLevel = [name, level].concat(_.values(arguments));
    handler.log.apply(handler, argumentsWithLevel);
  };
}

LogHub.resetToDefaultLogHandlers();
