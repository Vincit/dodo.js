var _ = require('lodash');
var specialKeys = ['$addFeaturePaths', 'featurePaths', 'features'];
var log = require('../logger').getLogger('dodo.core.utils.merge-config');

/**
 * Helper for merging configuration files.
 *
 * Best documentation at the moment is the test suite.
 *
 * ```js
 * var mergeConfig = require('dodo/lib/utils/merge-config');
 * var baseConfig = require('path/to/base/config');
 *
 * module.exports = mergeConfig(baseConfig, {
 *  port: 9123,
 *
 *  database: {
 *    port: 5600,
 *    database: 'different_database'
 *  },
 *
 *  $addFeaturePaths: [
 *    'feature/path/to/add'
 *  ],
 *
 *  features: [
 *    {
 *      $addBefore: 'some-feature-id-in-base-config',
 *      feature: 'feature-name',
 *      config: {
 *        some: 'value'
 *      }
 *    },
 *    {
 *      $addBefore: 'some-feature-id-in-base-config',
 *      feature: 'another-feature-name',
 *      config: {
 *        some: 'value'
 *      }
 *    },
 *    {
 *      $remove: 'some-feature-id-to-remove'
 *    },
 *    {
 *      feature: 'existing-feature',
 *      config: {
 *        these: 'values',
 *        will: 'be',
 *        merged: {
 *          recursively: true
 *        }
 *      }
 *    }
 *  ]
 * });
 *
 * ```
 *
 * @param {Object} config
 * @param {Object} merge
 * @param {Object=} options
 * @param {Boolean} options.debug
 *    If true, the resulting config is pretty-printed using log.info
 */
module.exports = function (config, merge, options) {
  config = config || {};
  merge = merge || {};
  options = options || {};

  config = _.cloneDeep(config, function (value) {
    // Don't try to clone functions.
    if (_.isFunction(value)) {
      return value;
    }
  });

  var configWithoutSpecial = _.omit(config, specialKeys);
  var mergeWithoutSpecial = _.omit(merge, specialKeys);

  // Do basic deep merge for everything but the special keys.
  deepMerge(configWithoutSpecial, mergeWithoutSpecial);

  configWithoutSpecial.featurePaths = merge.featurePaths || config.featurePaths || [];

  // Handle $addFeaturePaths.
  _.each(merge.$addFeaturePaths, function (path) {
    configWithoutSpecial.featurePaths.push(path);
  });

  configWithoutSpecial.features = _.clone(config.features) || [];

  // Handle features.
  _.each(merge.features, function (feature) {

    if (feature.$remove) {
      feature.feature = feature.$remove;
    }

    if (!feature.feature) {
      throw new Error('Feature must have key: "feature" set: ' + JSON.stringify(feature, null, 2));
    }

    var featureName = feature.feature;
    var $featureId = feature.$featureId || featureName;

    function getFeatureIndex(featureRef) {

      if (!_.isString(featureRef)) {
        throw new Error("Invalid feature reference, must be string: " + featureRef);
      }

      var matchingIds   = _.filter(configWithoutSpecial.features, { $featureId: featureRef });
      var matchingNames = _.filter(configWithoutSpecial.features, { feature: featureRef });
      if (matchingNames.length > 1 || matchingIds.length > 1) {
        throw new Error("Multiple features with same feature reference found:" + featureRef);
      }

      return _.findIndex(configWithoutSpecial.features, function (feature) {
        var featureId = feature.$featureId || feature.feature;
        return featureId === featureRef;
      });
    }

    var existingIndex = getFeatureIndex($featureId);
    var index;

    if (feature.$remove) {
      index = getFeatureIndex(feature.$remove);

      if (index === -1) {
        throw new Error('$remove: ' + feature.$remove + ' could not be found')
      }

      configWithoutSpecial.features.splice(existingIndex, 1);
      return;
    }

    if (feature.$addBefore) {
      index = getFeatureIndex(feature.$addBefore);

      if (index === -1) {
        throw new Error('$addBefore: ' + feature.$addBefore + ' could not be found')
      }

      configWithoutSpecial.features.splice(index, 0, feature);
      return;
    }

    if (feature.$addAfter) {
      index = getFeatureIndex(feature.$addAfter);

      if (index === -1) {
        throw new Error('$addAfter: ' + feature.$addAfter + ' could not be found')
      }

      configWithoutSpecial.features.splice(index + 1, 0, feature);
      return;
    }

    if (existingIndex === -1) {
      configWithoutSpecial.features.push(feature);
    } else {
      configWithoutSpecial.features[existingIndex] = deepMerge(configWithoutSpecial.features[existingIndex], feature);
    }
  });

  if (options.debug) {
    log.info(configWithoutSpecial);
  }

  return configWithoutSpecial;
};

function deepMerge(source, merge) {
  return _.merge(source, merge, function (src, mrg) {
    // Dont merge functions. Just return the new value.
    if (_.isFunction(src)) {
      return mrg;
    }
  });
}
