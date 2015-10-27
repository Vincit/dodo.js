var _ = require('lodash');
var specialKeys = ['$addFeaturePaths', 'featurePaths', 'features'];

/**
 * Helper for merging configuration files.
 *
 * Best documentation at the moment is the test suite.
 *
 * ```js
 * var mergeConfig = require('nails/lib/utils/merge-config');
 * var baseConfig = require('path/to/base/config.js');
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
 *      $addBefore: 'some-feature-in-base-config',
 *      feature: 'feature-name',
 *      config: {
 *        some: 'value'
 *      }
 *    },
 *    {
 *      $addBefore: 'some-feature-in-base-config',
 *      feature: 'another-feature-name',
 *      config: {
 *        some: 'value'
 *      }
 *    },
 *    {
 *      $remove: true,
 *      feature: 'some-feature-to-remove'
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
 *    If true, the resulting config is pretty-printed using console.log.
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
    var existingIndex = _.findIndex(configWithoutSpecial.features, {feature: feature.feature});
    var index;

    if (feature.$remove && existingIndex !== -1) {
      configWithoutSpecial.features.splice(existingIndex, 1);
      return;
    }

    if (feature.$addBefore) {
      index = _.findIndex(configWithoutSpecial.features, {feature: feature.$addBefore});

      if (index === -1) {
        throw new Error('$addBefore: ' + feature.$addBefore + ' could not be found')
      }

      configWithoutSpecial.features.splice(index, 0, feature);
      return;
    }

    if (feature.$addAfter) {
      index = _.findIndex(configWithoutSpecial.features, {feature: feature.$addAfter});

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
    console.log(JSON.stringify(configWithoutSpecial, function (key, value) {
      if (_.isFunction(value)) {
        if (value.name) {
          return '[Function ' + value.name + ']';
        } else {
          return '[Function <anonymous>]';
        }
      } else {
        return value;
      }
    }, 2));
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
