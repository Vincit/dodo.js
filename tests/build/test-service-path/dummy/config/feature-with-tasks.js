'use strict';
var path = require('path');

module.exports = {
  port: 9001,
  featurePaths: [path.join(__dirname, '..', '..', '..', 'feature-path')],
  features: [
    {
      feature: 'task-feature',
      config: {
        shouldPassFeatureConfigToo: true
      }
    }
  ]
};
