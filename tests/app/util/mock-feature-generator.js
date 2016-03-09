'use strict';

var featureInitializationEvents = [];

module.exports = function (featureId, dependencies) {
  var generatedFeature = function (app, config) {
    // reset global feature collecting when initializing first feature of an app
    if (!app.features) {
      featureInitializationEvents.splice(0, featureInitializationEvents.length);
    }

    var events = this.events = featureInitializationEvents;
    events.push({
      featureId: featureId,
      event: 'featureInitializeStart'
    });

    this.featureId = featureId;

    // log events for testing
    if (app.on) {
      app.on('appReady', function (app) {
        events.push({featureId: featureId, event: 'appReady'});
      });
      app.on('serverStart', function (app) {
        events.push({featureId: featureId, event: 'serverStart'});
      });
    }

    events.push({
      featureId: featureId,
      event: 'featureInitializeEnd'
    });
  };
  generatedFeature.dependencies = dependencies || [];
  return generatedFeature;
};
