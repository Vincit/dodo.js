'use strict';

function TaskTestFeature(app, featureConfig) {
}

TaskTestFeature.tasks = [
  {
    name: 'feature-task',
    run: function (featureConfig, serviceConfig) {
      return {
        config: serviceConfig,
        featureConfig: featureConfig
      };
    },
    description: 'Does pretty much nothing'
  }
];

module.exports = TaskTestFeature;
