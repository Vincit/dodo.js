'use strict';

module.exports = function (featureId, dependencies) {
  var generatedFeature = function (app, config) {
    this.featureId = featureId;
  };
  generatedFeature.dependencies = dependencies || [];
  return generatedFeature;
};
