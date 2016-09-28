'use strict';

var main = require('../app/express/main')
  , superagent = require('superagent')
  , requestBuilder = require('../http').requestBuilder
  , path = require('path')
  , _ = require('lodash');

/**
 * `TestHelper` provides methods for writing tests.
 *
 * Use `TestHelper.getHelper` utility method to return shared TestHelper
 * instance for test run.
 *
 * Instantiating TestHelper creates bindings to mocha's lifecycle methods for starting
 * and stopping the application instance.
 *
 * @param {object} config
 *    The configuration object of the service we are testing.
 */
function TestHelper(config) {
  this.serverUrl = getAppAddress(config);
  this.app = main.createApp(config);

  var self = this;

  this.request = requestBuilder(superagent)
    .use(function (req) {
      req.url = self.serverUrl + req.url;
    });

  before(function () {
    return main.startApp(self.app);
  });

  after(function () {
    self.app.server.close();
  });
}

TestHelper.instances = {};

TestHelper.getHelper = function (config) {
  // Check if helper is already instantiated for this service (identified by address)
  var serviceIdentifier = getAppAddress(config);
  var instance = TestHelper.instances[serviceIdentifier];
  if (!instance) {
    instance = new TestHelper(config);
    TestHelper.instances[serviceIdentifier] = instance;
  }

  return instance;
}

/**
 * @private
 */
function getAppAddress(config) {
  return config.protocol + '://localhost:' + config.port;
}

module.exports = {
  TestHelper: TestHelper
};
