'use strict';

var _ = require('lodash')
  , fs = require('fs')
  , path = require('path')
  , color = require('cli-color')
  , util = require('util');

/**
 * Load features of configuration to get plugin tasks etc.
 */
module.exports.loadFeatures = function (config) {
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
      throw new Error(
        'Cannot find feature: ' + util.inspect(featureDef.feature) +
        ' from featurePaths: ' + util.inspect(config.featurePaths)
      );
    }

    var featureTasks = _.get(feature, 'tasks', []);

    return {
      featureId: featureId,
      featureDef: featureDef,
      featureConstructor : feature,
      tasks: featureTasks
    };
  });
};

module.exports.initFeatures = function (app) {
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

    if (!testing) {
      logInitializingFeature(feature.featureDef);
    }

    featureInstances[feature.featureId] = new feature.featureConstructor(app, feature.featureDef.config);
    featureInstances[feature.featureId].featureConfig = feature.featureDef.config;
  });

  return app;
};

/**
 * @private
 */
function logInitializingFeature(featureDef)  {
  console.log(color.white('initializing feature ')
    + color.cyan(featureDef.feature));
}
