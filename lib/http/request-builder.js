var methods = require('methods')
  , _ = require('lodash');

function RequestBuilder (agent) {
  this._agent = agent;
  this._plugins = [];
}

RequestBuilder.prototype.use = function (plugin) {
  this._plugins.push(plugin);
  return this;
}

// Create prototype method for each superagent request method.
// Superagent uses similar implementation to generate http request
// verb method names.
var verbs = methods.concat('del');
_.each(verbs, function (verb) {
  RequestBuilder.prototype[verb] = function () {
    var request = this._agent[verb].apply(this._agent, arguments);

    _.each(this._plugins, function (plugin) {
      request.use(plugin);
    });

    return request;
  }
});

/**
 * Superagent request builder.
 *
 * Builder allows to chain superagent plugins before calling request
 * factory method. Superagent request is created with chained plugins
 * when builder's http request factory method is called.
 *
 * Example:
 *
 * var requestBuilder = require('dodo/http').requestBuilder
 *   , superagent = require('superagent')
 *   , prefix = require('superagent-prefix');
 *
 * var request = requestBuilder(superagent)
 *   .use(prefix('http://localhost:8080'));
 *
 * request.get('/some/resource')
 *  .then(function (res) {
 *     console.log(res);
 *   });
 */
module.exports = {
  requestBuilder: function (agent) {
    return new RequestBuilder(agent);
  }
};
