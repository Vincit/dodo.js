var _ = require('lodash')
  , fs = require('fs')
  , path = require('path')
  , color = require('cli-color')
  , express = require('express')
  , Promise = require('bluebird')
  , plugins = require('../plugins')
  , log = require('../../logger').getLogger('dodo.core.app');

/**
 * Creates and starts the server with the given config.
 *
 * @param {Object} config
 *    The config object for a service. See README.md for documentation about config files.
 *
 * @returns {Promise}
 */
module.exports.start = function(config) {
  var app = null;
  try {
    app = module.exports.createApp(config);
  } catch (err) {
    // wrap also synchronous error to promise to have consistent API for catching all errors
    return Promise.reject(err);
  }
  return module.exports.startApp(app);
};

/**
 * Starts the given app.
 *
 * @param {Object} app
 *    An app instance created using `createApp`.
 *
 * @returns {Promise}
 */
module.exports.startApp = function(app) {
  var config = app.config;
  var testing = config.profile === 'testing';
  var starterPromise = startServer(app).then(logStartup);
  if (!testing) {
    starterPromise = starterPromise.catch(logError);
  }
  return starterPromise;
};

/**
 * Creates an *express.js* application with given config but doesn't start it.
 *
 * @param {Object} config
 *    The config object for a service. See README.md for documentation about config files.
 *
 * @returns {Object}
 *    Express application instance.
 */
module.exports.createApp = function(config) {
  var app = express();

  app.config = config;

  app.use(function(req, res, next) {
    // express.js seems to store the app in req.app already but it isn't
    // documented anywhere. Just to make sure we do it also.
    req.app = app;
    next();
  });

  log.trace("Initializing features");
  app = plugins.initFeatures(app);
  log.trace("Triggering appReady event");
  app.emit('appReady', app);

  return app;
};

/**
 * @private
 * @returns {Promise}
 */
function startServer(app) {
  return new Promise(function(resolve, reject) {
    try {
      var callback = function (err) {
        log.trace("Server is listening. Triggering serverStart event.");
        app.emit('serverStart', app);
        if (err) {
          reject(err);
        } else {
          resolve(app);
        }
      };
      if (app.config.protocol === 'https') {
        startHttpsServer(app, callback);
      } else {
        startHttpServer(app, callback);
      }
    } catch(err) {
      reject(err);
    }
  }).catch(function (err) {
    log.trace({ error: err }, "Failed staring the server.");
    throw err;
  });
}

/**
 * @private
 */
function startHttpsServer(app, callback) {
  if (!app.config.ssl || !app.config.ssl.key || !app.config.ssl.cert) {
    callback(new Error("Https requires ssl configuration with key and cert"));
  }
  var sslOptions = {
    key: fs.readFileSync(app.config.ssl.key, 'utf8'),
    cert: fs.readFileSync(app.config.ssl.cert, 'utf8'),
    passphrase: app.config.ssl.passphrase
  };
  app.server = require('https').createServer(sslOptions, app);
  app.server.on('error', callback);
  app.server.listen(app.config.port, void 0, void 0, callback);
}

/**
 * @private
 */
function startHttpServer(app, callback) {
  app.server = require('http').createServer(app);
  app.server.on('error', callback);
  app.server.listen(app.config.port, void 0, void 0, callback);
}

/**
 * @private
 */
function logStartup(app) {
  var config = app.config;
  var testing = config.profile === 'testing';
  var packageJson = null;
  if (!testing) {
    try {
      packageJson = require('./package.json');
    } catch(err) {
      packageJson = {name: 'unknown', version: 'unknown'};
    }
    console.log(color.white('Running ')
      + color.cyan(packageJson.name + ' ')
      + color.cyan(packageJson.version + ' ')
      + color.white('on port ')
      + color.cyan(config.port)
      + color.white(' (profile ')
      + color.magenta(config.profile)
      + color.white(')'));
  }
  return app;
}

/**
 * @private
 */
function logError(err) {
  console.error(err.stack);
  throw err;
}

