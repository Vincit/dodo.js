var _ = require('lodash');
var expect = require('chai').expect;
var message = 'foo';

describe('Test exposed API', function () {

  it('should be able to import everything', function () {
    var app = require('../app');
    var build = require('../build');
    var errors = require('../errors');
    var http = require('../http');
    var logger = require('../logger');
    var utils = require('../utils');

    function testCreatingError(constructor, expectation) {
      return function testerFunc() {
        var error = new constructor(message);
        if (expectation) {
          expect(error.message).to.equal(expectation);
        } else {
          console.log(error.message)
        }
      }
    }

    expect(testCreatingError(errors.AccessError, JSON.stringify({ reason: message }))).to.not.throw();
    expect(testCreatingError(errors.ConflictError, JSON.stringify(message))).to.not.throw();
    expect(testCreatingError(errors.HTTPError)).to.not.throw();
    expect(testCreatingError(errors.NotFoundError, JSON.stringify({ reason: message }))).to.not.throw();
    expect(testCreatingError(errors.UniqueViolationError, JSON.stringify(message))).to.not.throw();
    expect(testCreatingError(errors.ValidationError, JSON.stringify(message))).to.not.throw();

    expect(app.express.main).to.be.ok;
    expect(app.plugins).to.be.ok;

    expect(build.buildHelpers).to.be.ok;
    expect(build.gulpBase).to.be.ok;

    expect(http.RangeParser).to.be.ok;
    expect(http.request).to.be.ok;

    expect(logger.ConsoleLogHandler).to.be.ok;
    expect(logger.DevNullHandler).to.be.ok;
    expect(logger.MockHandler).to.be.ok;
    expect(logger.getLogger).to.be.ok;
    expect(logger.evaluateLogRowArgs).to.be.ok;
    expect(logger.LogHub).to.be.ok;

    expect(utils.classUtils).to.be.ok;
    expect(utils.mergeConfig).to.be.ok;
    expect(utils.multiRequire).to.be.ok;
    expect(utils.runCommandInPromise).to.be.ok;
    expect(utils.TestHelper).to.be.ok;
  });
});

