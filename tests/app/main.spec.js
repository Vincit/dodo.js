'use strict';

var expect = require('chai').expect;
var main = require('../../lib/app/express/main');

var path = require('path');
var featurePath1 = path.join(__dirname, 'feature-path1');
var featurePath2 = path.join(__dirname, 'feature-path2');

describe('main.js app create / start', function () {
  var okConfig = null;
  var failConfig = null;

  beforeEach(function () {
    okConfig = {
      features : [
        {
          feature : 'feature-in-path',
          config: {
            featureConfigParameter: true
          }
        }
      ],
      featurePaths: [ featurePath1, featurePath2 ],
      profile: 'testing'
    };

    failConfig = {
      features : [
        { feature: 'fail-on-init' }
      ],
      featurePaths: [ featurePath1 ],
      profile: 'testing'
    };
  });

  describe('start(config)', function () {
    it('should create and start app', function () {
      return main.start(okConfig).then(function (app) {
        expect(app).to.contain.any.of.keys('server');
      });
    });

    it('should get error from failure during init', function () {
      return main.start(failConfig).then(function () {
        throw new Error("Should have failed in start()!");
      }).catch(function (err) {
        expect(err.message).to.equal('Critical aborting failure error!');
      });
    });

    it('should fail if starting twice at same port', function () {
      okConfig.port = 45932;
      return Promise.all([
        main.start(okConfig),
        main.start(okConfig)
      ]).then(function () {
        throw new Error("Should have failed in start() and pass error to catch!");
      }).catch(function (err) {
        expect(err.message).to.equal('listen EADDRINUSE :::45932');
      });
    });

    it('should have req.app added to request got from express', function () {
    });
  });

  describe('createApp(app)', function () {
    it('should init features', function () {
    });

    it('should emit appReady event after features are initialized', function () {
    });
  });

  describe('startServer(app)', function () {
    it('should create http server', function () {
    });

    it('should create https server if config.protocol == https', function () {
    });

    it('should emit serverStart event after server is started', function () {
    });
  });

});
