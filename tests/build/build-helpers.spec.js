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
      expect(services[0].tasks).to.have.length(2);
      expect(_.find(services[0].tasks, { name: 'serve' })).to.be.truthy;
      expect(_.find(services[0].tasks, { name: 'test' })).to.be.truthy;
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
});
