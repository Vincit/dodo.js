var expect = require('chai').expect;
var sinon = require('sinon')

var logger = require('../../lib/logger');
var MockHandler = require('../../lib/logger/mock-handler');
var ConsoleLogHandler = require('../../lib/logger/console-log-handler');
var DevNullHandler = require('../../lib/logger/dev-null-handler');

describe('logging system', function () {
  after(function () {
    logger.resetToDefaultLogHandlers();
  });

  describe('when using logger without setting it up', function () {
    var log = logger.getLogger('test.no.setup');

    it('should have ConsoleLogHandler for info, warning and error levels', function () {
      expect(log._getHandler(logger.level.info)).to.be.instanceof(ConsoleLogHandler);
      expect(log._getHandler(logger.level.warning)).to.be.instanceof(ConsoleLogHandler);
      expect(log._getHandler(logger.level.error)).to.be.instanceof(ConsoleLogHandler);
      log.info({ imsometa: true }, 'This should still interpolate %s', 'me')
    });

    it('should have DevNullHandlers for debug and trace levels', function () {
      expect(log._getHandler(logger.level.trace)).to.be.instanceof(DevNullHandler);
      expect(log._getHandler(logger.level.debug)).to.be.instanceof(DevNullHandler);
    });
  });

  describe('set handlers before getting logger', function () {
    var infoHandler = new MockHandler();
    var warningHandler = new MockHandler();
    var log;

    beforeEach(function () {
      logger.setHandler([logger.level.info], 'test.mock.stream', infoHandler);
      logger.setHandler([logger.level.warning], 'test.mock.stream', warningHandler);
      log = logger.getLogger('test.mock.stream');
    });

    afterEach(function () {
      infoHandler.flush();
      warningHandler.flush();
    });

    it('should take the latest added handler', function () {
      log.info('info goes to one logger');
      expect(infoHandler.logs.length).to.equal(1);
      expect(warningHandler.logs.length).to.equal(0);
    });

    it('should allow different handlers for different log levels', function () {
      log.debug('this goes to dev null handler...');
      log.warning('warning goes to logger');
      expect(infoHandler.logs.length).to.equal(0);
      expect(warningHandler.logs.length).to.equal(1);
    });
  });

  describe('set handlers after getting the logger', function () {
    var infoHandler = new MockHandler();
    var log;

    beforeEach(function () {
      log = logger.getLogger('test.mock.stream');
      logger.setHandler([logger.level.info], 'test.mock.stream', infoHandler);
    });

    it('should override earlier logger if new matching handler is added', function () {
      log.info('testing testing');
      expect(infoHandler.logs.length).to.equal(1);
    });
  });

  describe('getting multiple loggers and route info to separate handlers and other streams to third shared handler', function () {
    var log1InfoHandler = new MockHandler();
    var log2InfoHandler = new MockHandler();
    var allDebugHandler = new MockHandler();

    var log1 = logger.getLogger('log1');
    var log2 = logger.getLogger('log2');

    beforeEach(function () {
      logger.setHandler([logger.level.info], 'log1', log1InfoHandler);
      logger.setHandler([logger.level.info], 'log2', log2InfoHandler);
      logger.setHandler([logger.level.debug], /^log/, allDebugHandler);
    });

    it('should write info to different mock handlers', function () {
      var log1Str = 'tada1';
      var log2Str = 'tada2';
      log1.info(log1Str);
      log2.info(log2Str);
      expect(log1InfoHandler.logs[0].message).to.equal(log1Str);
      expect(log2InfoHandler.logs[0].message).to.equal(log2Str);
    });

    it('should debug to the same mock handler', function () {
      log1.debug('one');
      log2.debug('two');
      expect([
        allDebugHandler.logs[0].message,
        allDebugHandler.logs[1].message
      ]).to.deep.equal(['one', 'two']);
    });

    describe('overriding all debugs to new handler with always matching pattern', function () {
      var newHandler = new MockHandler();

      beforeEach(function () {
        logger.setHandler([
          logger.level.trace,
          logger.level.debug,
          logger.level.info,
          logger.level.warning,
          logger.level.error
        ], '', newHandler);
      });

      it('should pass all logs to new handler', function () {
        log1.trace('log1 trace');
        log1.debug('log1 debug');
        log1.info('log1 info');
        log1.warning('log1 warning');
        log1.error('log1 error');
        log2.trace('log2 trace');
        log2.debug('log2 debug');
        log2.info('log2 info');
        log2.warning('log2 warning');
        log2.error('log2 error');
        expect(newHandler.logs.length).to.equal(10);
      });

      describe('clear all handlers', function () {
        var allHandlers = [];

        beforeEach(function () {
          logger.clearHandlers();
          newHandler.flush();
        });

        it('should resolve all loggers to dev null handlers', function () {
          expect(log1._getHandler(logger.level.trace)).to.be.instanceof(DevNullHandler);
          expect(log1._getHandler(logger.level.debug)).to.be.instanceof(DevNullHandler);
          expect(log1._getHandler(logger.level.info)).to.be.instanceof(DevNullHandler);
          expect(log1._getHandler(logger.level.warning)).to.be.instanceof(DevNullHandler);
          expect(log1._getHandler(logger.level.error)).to.be.instanceof(DevNullHandler);
          expect(log2._getHandler(logger.level.trace)).to.be.instanceof(DevNullHandler);
          expect(log2._getHandler(logger.level.debug)).to.be.instanceof(DevNullHandler);
          expect(log2._getHandler(logger.level.info)).to.be.instanceof(DevNullHandler);
          expect(log2._getHandler(logger.level.warning)).to.be.instanceof(DevNullHandler);
          expect(log2._getHandler(logger.level.error)).to.be.instanceof(DevNullHandler);
        });
      });
    });
  });

  describe('using different logger APIs', function () {
    var log = logger.getLogger('one.more.logger.for.testing');
    var logHandler = new MockHandler();

    beforeEach(function () {
      logHandler.flush();
      logger.clearHandlers();
      logger.setHandler([logger.level.info], /.*/, logHandler);
    });

    it('should understand if two strings are passed to logger to unite strings like util.format does', function () {
      log.info('wat', 'wat');
      expect(logHandler.logs[0].message).to.equal('wat wat');
    });

    it('should call function passed as first parameter', function () {
      var objCallback = sinon.spy(function () { return { metadata: 1 }; });
      log.info(objCallback);
      expect(objCallback.callCount).to.equal(1);
    });

    it('should call function when passed as second parameter', function () {
      var strCallback = sinon.spy(function () { return 'Im string!'; });
      log.info({}, strCallback);
      expect(strCallback.callCount).to.equal(1);
    });

    it('should call both functions when passed as first and second parameter', function () {
      var objCallback = sinon.spy(function () { return { metadata: 1 }; });
      var strCallback = sinon.spy(function () { return 'Im string!'; });
      log.info(objCallback, strCallback);
      expect(objCallback.callCount).to.equal(1);
      expect(strCallback.callCount).to.equal(1);
    });

    it('should not call any function passed to logger if using DevNullHandler', function () {
      logger.clearHandlers();
      var objCallback = sinon.spy(function () { return { metadata: 1 }; });
      var strCallback = sinon.spy(function () { return 'Im string!'; });
      log.info(objCallback, strCallback);
      expect(objCallback.callCount).to.equal(0);
      expect(strCallback.callCount).to.equal(0);
    });

    it('should allow passing function returning string as first arg', function () {
      var magicString = 'Im string!';
      var strCallback = sinon.spy(function () { return magicString; });
      log.info(strCallback);
      expect(strCallback.callCount).to.equal(1);
      expect(logHandler.logs[0].message).to.equal(magicString);
      expect(logHandler.logs[0].level).to.equal('info');
      expect(logHandler.logs[0].name).to.equal('one.more.logger.for.testing');
    });

    it('should fail to log if no parameters given', function () {
      expect(function () {
        log.info();
      }).to.throw(/Invalid logArgs./);
    });

    it('should setHandlers should fail if invalid log levels', function () {
      expect(function () {
        logger.setHandler(['fake'], /.*/, logHandler);
      }).to.throw(/Invalid log level/);
    });

    it('should setHandlers should fail if log levels not given', function () {
      expect(function () {
        logger.setHandler([], /.*/, logHandler);
      }).to.throw(/No log levels given to handler/);
    });

    it('should setHandlers should fail if invalid handler', function () {
      expect(function () {
        logger.setHandler([logger.level.info], /.*/, function () {});
      }).to.throw(/Handler object must have .log method/);
    });
  });
});
