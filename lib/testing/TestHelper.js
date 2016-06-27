'use strict';

var main = require('../app/express/main')
  , request = require('../http/request')
  , path = require('path')
  , _ = require('lodash');

function TestHelper(config) {
  this.serverUrl = getAppAddress(config);
  this.request = request(this.serverUrl);
  this.app = main.createApp(config);

  var self = this;
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

module.exports = TestHelper;