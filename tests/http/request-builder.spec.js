var _ = require('lodash')
  , methods = require('methods')
  , expect = require('chai').expect
  , requestBuilder = require('../../lib/http').requestBuilder;

describe('request builder', function () {

  it('should call use for each plugin when creating request', function () {
    var agent = {
      args: {}
    };

    agent.get = function (url) {
      agent.args.get = url;
      return agent;
    }

    agent.use = function (plugin) {
      agent.args.use = plugin;
      return agent;
    }

    var request = requestBuilder(agent)
      .use('foo')
      .get('http://example.com');

    expect(agent.args.use).to.equal('foo');
    expect(agent.args.get).to.equal('http://example.com');
  });

});