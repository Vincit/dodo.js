
var Promise = require('bluebird');

var _ = require('lodash');
var buildHelpers = require('../../lib/build/build-helpers');
var expect = require('chai').expect;
var path = require('path');
var shelljs = require('shelljs');

describe('build-helpers.js', function () {
  it('should not find any services if no service paths with config directory', function () {
    var services = buildHelpers.scanServices(__dirname, 'development');
    expect(services).to.have.length(0);
  });

  describe('reading valid service path and configuration', function () {
    var services;
    before(function () {
      // this is run just once... dont mess wiht the result when checking stuff...
      services = buildHelpers.scanServices(path.join(__dirname, 'test-service-path'), 'realdeal');
    });

    it('should find dummy path', function () {
      expect(services).to.have.length(1);
      expect(services[0].name).to.equal('dummy');
    });

    it('should have core tasks registered', function () {
      expect(services[0].tasks).to.have.length(1);
      expect(_.find(services[0].tasks, { name: 'serve' })).to.be.truthy;
    });

    it('should have configuration', function () {
      expect(services[0].config).to.be.not.null;
    });
  });

  describe('reading invalid service configuration', function () {
    var services;
    before(function () {
      // this is run just once... dont mess wiht the result when checking stuff...
      services = buildHelpers.scanServices(path.join(__dirname, 'test-service-path'), 'invalid');
    });

    it('should find dummy path', function () {
      expect(services).to.have.length(1);
      expect(services[0].name).to.equal('dummy');
    });

    it('should have no tasks registered', function () {
      expect(services[0].tasks).to.have.length(0);
    });

    it('should not have configuration', function () {
      expect(services[0].config).to.be.null;
    });
  });

  it('should find dummy with unexisting configuration', function () {
    var services = buildHelpers.scanServices(path.join(__dirname, 'test-service-path'), 'notfound');
    expect(services).to.have.length(1);
    expect(services[0].name).to.equal('dummy');
    expect(services[0].config).to.be.null;
    expect(services[0].tasks).to.have.length(0);
  });

  it('should create service directory if doesnt exist', function () {
    var newServicePath = path.join(__dirname, 'created-service-path');
    shelljs.exec('rmdir ' + newServicePath);
    expect(shelljs.test('-d', newServicePath)).to.be.false;
    var services = buildHelpers.scanServices(newServicePath, 'development');
    expect(shelljs.test('-d', newServicePath)).to.be.true;
  });

  it('should pass context with servicePath if configuration is function (ctx)', function () {
    var services = buildHelpers.scanServices(path.join(__dirname, 'test-service-path'), 'passing-service-dir');
    expect(services[0].config.servicePath).to.contain('test-service-path/dummy');
  });

  it('should register tasks of the features', function () {
    var services = buildHelpers.scanServices(path.join(__dirname, 'test-service-path'), 'feature-with-tasks');
    expect(services).to.have.length(1);
    expect(services[0].tasks).to.have.length(2);
    expect(services[0].tasks[1].name).to.equal('feature-task');
    expect(services[0].tasks[1].description).to.equal('Does pretty much nothing');
    expect(services[0].tasks[1].run().config.port).to.equal(9001);
    expect(services[0].tasks[1].run().featureConfig.shouldPassFeatureConfigToo).to.equal(true);
  });

  it('should run serve task', function () {
    var services = buildHelpers.scanServices(path.join(__dirname, 'test-service-path'), 'realdeal');
    expect(services).to.have.length(1);
    expect(services[0].tasks).to.have.length(1);
    return services[0].tasks[0].run().then(function (app) {
      expect(app.config).to.be.ok;
      return new Promise(function (resolve) {
        app.server.close(resolve);
      });
    });
  });

});
