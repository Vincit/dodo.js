var expect = require('chai').expect;

var log = require('../../lib/logger');
var MockHandler = require('../../lib/logger/mock-handler');

describe.skip('logging system', function () {
  describe('when using logger without setting it up', function () {
    it('should have ConsoleLogHandler for info, warning and error levels', function () {
    });

    it('should have DevNullHandlers for debug and trace levels', function () {
    });
  });

  describe('set handlers before getting logger', function () {
    beforeEach(function () {
    });

    it('should take the latest added handler', function () {
    });

    it('should allow different handlers for different log levels', function () {
    });
  });

  describe('set handlers after getting the logger', function () {
    beforeEach(function () {
    });

    it('should override earlier logger if new matching handler is added', function () {
    });
  });

  describe('getting multiple loggers and route info to separate handlers and other streams to third shared handler', function () {
    beforeEach(function () {
    });

    it('should write info to different mock handlers', function () {
    });

    it('should debug to the same mock handler', function () {
    });

    describe('overriding all log to new handler with always matching pattern', function () {
      beforeEach(function () {
      });

      it('should pass all logs to new handler', function () {
      });

      describe('clear all handlers', function () {
        beforeEach(function () {
        });

        it('should call no log handlers to any log levels nor logger', function () {
        });
      });
    });
  });

  describe('using different logger APIs', function () {
    it('should call function passed as first parameter', function () {
    });

    it('should call function when passed as second parameter', function () {
      // log.info(obj|function returning object, util.format.str + params|function returning string)
      // log.info(util.format.str + params|function returning string)
    });

    it('should call both functions when passed as first and second parameter', function () {
    });

    it('should not call any function passed to logger if using DevNullHandler', function () {
    });
  });
});
