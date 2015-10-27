var _ = require('lodash')
  , fs = require('fs')
  , path = require('path')
  , color = require('cli-color')
  , express = require('express')
  , Promise = require('bluebird')
  , ConfigManager = require('./utils/ConfigManager');

/**
 * Creates and starts the server with the given config.
 *
 * @param {Object} config
 *    The config object for a service. See README.md for documentation about config files.
 *
 * @returns {Promise}
 */
module.exports.start = function(config) {
  return module.exports.startApp(module.exports.createApp(config));
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
  return startServer(app)
    .then(logStartup)
    .catch(logError);
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
  app.configManager = new ConfigManager(config);

  app.use(function(req, res, next) {
    // express.js seems to store the app in req.app already but it isn't
    // documented anywhere. Just to make sure we do it also.
    req.app = app;
    next();
  });

  app = initFeatures(app);
  app.emit('appReady', app);

  return app;
};

/**
 * @private
 */
function initFeatures(app) {
  var config = app.config
    , testing = config.profile === 'testing'
    , featureInstances = {};

  app.feature = function (featureName) {
    if (!_.has(featureInstances, featureName)) {
      throw new Error('this service doesn\'t have the feature "' + featureName + '"');
    }
    return featureInstances[featureName];
  };

  _.each(config.features, function(featureDef) {
    var feature = null
      , featurePath = null
      , unmetDependencies;

    if (_.has(featureInstances, featureDef.feature)) {
      throw new Error('feature ' + featureDef.feature + ' has already been initialized');
    }

    // Try to require the feature from each path listed in `config.featurePaths`.
    for (var i = 0; i < config.featurePaths.length; ++i) {
      featurePath = path.join(config.featurePaths[i], featureDef.feature);
      if (fs.existsSync(featurePath) || fs.existsSync(featurePath + '.js')) {
        feature = require(featurePath);
        break;
      }
    }

    if (!feature) {
      throw new Error('Invalid feature', featureDef);
    }

    if (!testing) {
      logInitializingFeature(featureDef);
    }

    // Check dependencies.
    unmetDependencies = _.compact(_.map(feature.dependencies, function(dep) {
      var found = _.some(dep.split('|'), function(depPart) {
        return _.has(featureInstances, depPart.trim());
      });
      if (!found) {
        return dep;
      }
    }));

    if (unmetDependencies.length != 0) {
      throw new Error('Feature '
        + featureDef.feature
        + ' has unmet dependencies: '
        + unmetDependencies.join(', '));
    }

    featureInstances[featureDef.feature] = new feature(app, featureDef.config);
    featureInstances[featureDef.feature].featureConfig = featureDef.config;
  });

  return app;
}

/**
 * @private
 * @returns {Promise}
 */
function startServer(app) {
  return new Promise(function(resolve, reject) {
    var callback = function(err) {
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
  });
}

/**
 * @private
 */
function startHttpsServer(app, callback) {
  var sslOptions = {
    key: fs.readFileSync(app.config.ssl.key, 'utf8'),
    cert: fs.readFileSync(app.config.ssl.cert, 'utf8'),
    passphrase: app.config.ssl.passphrase
  };
  app.server = require('https').createServer(sslOptions, app);
  app.server.listen(app.config.port, void 0, void 0, callback);
}

/**
 * @private
 */
function startHttpServer(app, callback) {
  app.server = require('http').createServer(app);
  app.server.listen(app.config.port, void 0, void 0, callback);
}

/**
 * @private
 */
function logInitializingFeature(featureDef)  {
  console.log(color.white('initializing feature ')
    + color.cyan(featureDef.feature));
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
}

