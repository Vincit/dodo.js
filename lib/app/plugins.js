'use strict';

var _ = require('lodash')
  , fs = require('fs')
  , path = require('path')
  , color = require('cli-color')
  , util = require('util')
  , logger = require('../logger').LogHub
  , log = logger.getLogger('dodo.core.app.plugins');

/**
 * @private
 */
function logInitializingFeature(featureDef, logLevel)  {
  log[logLevel](color.white('initializing feature ') + color.cyan(featureDef.feature));
}

module.exports = {
  /**
   * Load features of configuration to get plugin tasks etc.
   */
  loadFeatures: function (config) {
    return _.map(config.features, function(featureDef) {
      var feature = null
        , featurePath = null;

      var featureId = featureDef.$featureId || featureDef.feature;

      // Try to require the feature from each path listed in `config.featurePaths`.
      for (var i = 0; i < config.featurePaths.length; ++i) {
        featurePath = path.join(config.featurePaths[i], featureDef.feature);
        if (fs.existsSync(featurePath) || fs.existsSync(featurePath + '.js')) {
          feature = require(featurePath);
          break;
        }
      }

      if (!feature) {
        var errorMsg =
          'Cannot find feature: ' + util.inspect(featureDef.feature) +
          ' from featurePaths: ' + util.inspect(config.featurePaths);
        throw new Error(errorMsg);
      }

      var featureTasks = _.get(feature, 'tasks', []);

      return {
        featureId: featureId,
        featureDef: featureDef,
        featureConstructor : feature,
        tasks: featureTasks
      };
    });
  },

  initFeatures: function (app) {
    var config = app.config
      , testing = config.profile === 'testing'
      , featureInstances = {};

    app.feature = function (featureName) {
      if (!_.has(featureInstances, featureName)) {
        throw new Error('this service doesn\'t have the feature "' + featureName + '"');
      }
      return featureInstances[featureName];
    };

    var features = this.loadFeatures(config);

    _.each(features, function(feature) {
      if (_.has(featureInstances, feature.featureId)) {
        throw new Error('feature ' + feature.featureId + ' has already been initialized');
      }

      // Check dependencies.
      var unmetDependencies = _.compact(_.map(feature.featureConstructor.dependencies, function(dep) {
        var found = _.some(dep.split('|'), function(depPart) {
          return _.has(featureInstances, depPart.trim());
        });
        if (!found) {
          return dep;
        }
      }));

      if (unmetDependencies.length != 0) {
        throw new Error('Feature '
          + util.inspect(feature.featureDef.feature)
          + ' has unmet dependencies: '
          + util.inspect(unmetDependencies));
      }

      logInitializingFeature(feature.featureDef, testing ? logger.level.trace : logger.level.info);

      featureInstances[feature.featureId] = new feature.featureConstructor(app, feature.featureDef.config);
      featureInstances[feature.featureId].featureConfig = feature.featureDef.config;
    });

    return app;
  }
};
