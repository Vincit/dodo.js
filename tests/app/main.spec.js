'use strict';

var Promise = require('bluebird');

var expect = require('chai').expect;
var main = require('../../lib/app/express/main');
var request = require('../../lib/http/request');

var path = require('path');
var featurePath1 = path.join(__dirname, 'feature-path1');
var featurePath2 = path.join(__dirname, 'feature-path2');

var _ = require('lodash');

describe('main.js app create / start', function () {
  var okConfig = null;
  var failConfig = null;

  beforeEach(function () {
    okConfig = {
      port : 0,
      features : [
        {
          feature : 'feature-in-path',
          config: {
            featureConfigParameter: true
          }
        },
        {
          feature : 'single-file-feature'
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
      // TODO: actually we should also close the started server
      return Promise.all([
        main.start(okConfig),
        main.start(okConfig)
      ]).then(function () {
        throw new Error("Should have failed in start() and pass error to catch!");
      }).catch(function (err) {
        expect(err.message).to.contain('listen EADDRINUSE');
      });
    });
  });

  describe('createApp(app)', function () {
    it('should init features', function () {
      var app = main.createApp(okConfig);
      expect(app.feature('feature-in-path')).to.be.ok;
    });

    it('should emit appReady event after features are initialized', function () {
      var app = main.createApp(okConfig);
      var events = app.feature('feature-in-path').events;
      var firstAppReadyEvent = _(events).map('event').indexOf('appReady');
      var lastFeatureInitEvent = _(events).map('event').lastIndexOf('featureInitializeEnd');
      expect(firstAppReadyEvent > lastFeatureInitEvent, JSON.stringify(events,null,2)).to.be.ok;
    });

    it('should have req.app added to request got from express', function () {
      okConfig.port = 45933;
      var app = main.createApp(okConfig);
      app.get('/', function (req, res) {
        res.sendStatus(req.app ? 200 : 400);
      });

      return main.startApp(app)
        .then(function () {
          return request('http://localhost:' + okConfig.port)
            .get('/')
            .then(function (res) {
              expect(res.statusCode).to.equal(200);
            });
        })
        .finally(function () {
          app.server.close();
        });
    });
  });

  describe('startServer(app)', function () {
    it('should throw an error if config.protocol == https and no ssl config given', function () {
      okConfig.protocol = 'https';
      var fn = function () {
        main.createApp(okConfig);
      };
      expect(fn).to.throw("Https requires ssl configuration with key and cert");
    });

    it('should be able to create https server with key, cert and passphrase', function () {
      okConfig.protocol = 'https';
      okConfig.ssl = {
        key: path.join(__dirname, 'data', 'server.key'),
        cert: path.join(__dirname, 'data', 'server.crt'),
        passphrase: 'dodo'
      };
      var app = main.createApp(okConfig);
      return main.startApp(app)
        .then(function () {
          app.server.close();
        });
    });

    it('should be able to create https server with uncrypted key and cert', function () {
      okConfig.protocol = 'https';
      okConfig.ssl = {
        key: path.join(__dirname, 'data', 'server.unencrypted.key'),
        cert: path.join(__dirname, 'data', 'server.crt')
      };
      var app = main.createApp(okConfig);
      return main.startApp(app)
        .then(function () {
          app.server.close();
        });
    });

    it('should fail if crypted key and cert given without passphrase', function () {
      okConfig.protocol = 'https';
      okConfig.ssl = {
        key: path.join(__dirname, 'data', 'server.key'),
        cert: path.join(__dirname, 'data', 'server.crt')
      };
      var fn = function () {
        main.createApp(okConfig);
      };
      expect(fn).to.throw;
    });

    it('should emit serverStart event after server is started', function () {
      var app = main.createApp(okConfig);
      return new Promise(function (resolve, reject) {
        app.on('serverStart', resolve);
        main.startApp(app);
      });
    });

    it('should start correctly also when not in testing profile (NOTE: this will spam test run a bit)', function () {
      delete okConfig['profile'];
      var app = main.createApp(okConfig);
      return main.startApp(app);
    });

    it('should return startup error also if not in testing profile (NOTE: shows an error during tests)', function () {
      delete okConfig['profile'];
      okConfig.protocol = 'https';
      var fn = function () {
        main.createApp(okConfig);
      };
      expect(fn).to.throw("Https requires ssl configuration with key and cert");
    });
  });

});
