'use strict';

var _ = require('lodash')
  , fs = require('fs')
  , path = require('path')
  , color = require('cli-color');

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

  _.each(config.features, function(featureDef) {
    var feature = null
      , featurePath = null
      , unmetDependencies;

    var featureId = featureDef.$featureId || featureDef.feature;

    if (_.has(featureInstances, featureId)) {
      throw new Error('feature ' + featureId + ' has already been initialized');
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
};

/**
 * @private
 */
function logInitializingFeature(featureDef)  {
  console.log(color.white('initializing feature ')
    + color.cyan(featureDef.feature));
}
