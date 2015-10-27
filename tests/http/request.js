var _ = require('lodash')
  , os = require('os')
  , fs = require('fs')
  , path = require('path')
  , expect = require('chai').expect
  , express = require('express')
  , Promise = require('bluebird')
  , bodyParser = require('body-parser')
  , compression = require('compression')
  , request = require('../../lib/http/request')
  , outFilePath = path.join(os.tmpdir(), 'out')
  , inFilePath = path.join(os.tmpdir(), 'in');

Promise.longStackTraces();

describe('request', function() {
  var app;
  var responseData;
  var headers;
  var queryString;
  var body;
  var calledMethod;

  _.each([false, true], function(useGzip) {

    describe(useGzip ? "with gzip" : "without gzip", function() {

      before(function (done) {
        app = express();
        app.use(bodyParser.json());

        if (useGzip) {
          app.use(compression({threshold: 0}));
        }

        var handler = function (method) {
          return function(req, res) {
            calledMethod = method;
            body = req.body;
            headers = req.headers;
            queryString = req.query;
            res.send(responseData);
          }
        };

        app.get('/test', handler('get'));
        app.put('/test', handler('put'));
        app.post('/test', handler('post'));
        app.delete('/test', handler('delete'));
        app.patch('/test', handler('patch'));

        app.server = require('http').createServer(app);
        app.server.listen(8088, void 0, void 0, function () {
          done();
        });
      });

      after(function(done) {
        app.server.close(function() {
          done();
        });
      });

      beforeEach(function() {
        if (fs.existsSync(inFilePath)) {
          fs.unlinkSync(inFilePath);
        }

        if (fs.existsSync(outFilePath)) {
          fs.unlinkSync(outFilePath);
        }

        responseData = {test: 1};
        headers = null;
        body = null;
        calledMethod = null;
        queryString = null;
      });

      _.each(['get', 'put', 'post', 'patch', 'delete'], function(method) {

        it(method.toUpperCase() + ' should be able to build URL from pieces', function (done) {
          request[method]()
            .hostname('localhost')
            .protocol('http')
            .port(8088)
            .path('/test')
            .then(function(res) {
              expect(res.body).to.eql(responseData);
              expect(calledMethod).to.equal(method);
              done();
            })
            .catch(done);
        });

        it(method.toUpperCase() + ' should get body as json', function (done) {
          request[method]('http://localhost:8088/test')
            .then(function(res) {
              expect(res.body).to.eql(responseData);
              expect(calledMethod).to.equal(method);
              done();
            })
            .catch(done);
        });

        it(method.toUpperCase() + ' should get body as buffer', function (done) {
          responseData = 'this is not json';
          request[method]('http://localhost:8088/test')
            .then(function(res) {
              expect(res.body).to.be.an.instanceof(Buffer);
              expect(res.body.toString()).to.equal('this is not json');
              expect(calledMethod).to.equal(method);
              done();
            })
            .catch(done);
        });

        it(method.toUpperCase() + ' should write response to a file', function (done) {
          request[method]('http://localhost:8088/test')
            .toFile(outFilePath)
            .then(function(res) {
              expect(res).to.not.have.property('body');
              expect(calledMethod).to.equal(method);
              expect(fs.readFileSync(outFilePath).toString()).to.equal(JSON.stringify(responseData));
              done();
            })
            .catch(done);
        });

        it(method.toUpperCase() + ' should write response to a stream', function (done) {
          request[method]('http://localhost:8088/test')
            .toStream(fs.createWriteStream(outFilePath))
            .then(function(res) {
              expect(res).to.not.have.property('body');
              expect(calledMethod).to.equal(method);
              expect(fs.readFileSync(outFilePath).toString()).to.equal(JSON.stringify(responseData));
              done();
            })
            .catch(done);
        });

        it(method.toUpperCase() + ' should send custom headers (individual)', function (done) {
          request[method]('http://localhost:8088/test')
            .header('X-Custom-Header', 'jeah')
            .header('X-Another-Custom-Header', 'woohoo')
            .then(function(res) {
              expect(res.body).to.eql(responseData);
              expect(calledMethod).to.equal(method);
              expect(headers['x-custom-header']).to.equal('jeah');
              expect(headers['x-another-custom-header']).to.equal('woohoo');
              done();
            })
            .catch(done);
        });

        it(method.toUpperCase() + ' should send custom headers (object)', function (done) {
          request[method]('http://localhost:8088/test')
            .headers({'X-Custom-Header': 'jeah', 'X-Another-Custom-Header': 'woohoo'})
            .then(function(res) {
              expect(res.body).to.eql(responseData);
              expect(calledMethod).to.equal(method);
              expect(headers['x-custom-header']).to.equal('jeah');
              expect(headers['x-another-custom-header']).to.equal('woohoo');
              done();
            })
            .catch(done);
        });

        it(method.toUpperCase() + ' should send query parameters (individual)', function (done) {
          request[method]('http://localhost:8088/test')
            .query('a', 1)
            .query('a', 2)
            .query('b', 'tässä on välejä ja äääkkösiä')
            .then(function(res) {
              expect(res.body).to.eql(responseData);
              expect(calledMethod).to.equal(method);
              expect(queryString.a).to.eql(['1', '2']);
              expect(queryString.b).to.equal('tässä on välejä ja äääkkösiä');
              done();
            })
            .catch(done);
        });

        it(method.toUpperCase() + ' should send query parameters (object)', function (done) {
          request[method]('http://localhost:8088/test')
            .query({a: [1, 2], b:'tässä on välejä ja äääkkösiä'})
            .then(function(res) {
              expect(res.body).to.eql(responseData);
              expect(calledMethod).to.equal(method);
              expect(queryString.a).to.eql(['1', '2']);
              expect(queryString.b).to.equal('tässä on välejä ja äääkkösiä');
              done();
            })
            .catch(done);
        });

      });

      _.each(['put', 'post', 'patch'], function(method) {

        it(method.toUpperCase() + ' should send body as json', function (done) {
          request[method]('http://localhost:8088/test')
            .body({putTest: 'test'})
            .then(function (res) {
              expect(res.body).to.eql(responseData);
              expect(calledMethod).to.equal(method);
              expect(body).to.eql({putTest: 'test'});
              expect(headers['content-type']).to.equal('application/json; charset=utf-8');
              done();
            })
            .catch(done);
        });

        it(method.toUpperCase() + ' should send body as buffer', function (done) {
          request[method]('http://localhost:8088/test')
            .body(new Buffer('this is a test string'))
            .then(function (res) {
              expect(res.body).to.eql(responseData);
              expect(calledMethod).to.equal(method);
              expect(headers['content-type']).to.equal('application/octet-stream; charset=utf-8');
              done();
            })
            .catch(done);
        });

        it(method.toUpperCase() + ' should send body from file', function (done) {
          fs.writeFileSync(inFilePath, JSON.stringify({a:1, b:2}));
          return request[method]('http://localhost:8088/test')
            .fromFile(inFilePath)
            .contentType('application/json')
            .then(function (res) {
              expect(res.body).to.eql(responseData);
              expect(calledMethod).to.equal(method);
              expect(headers['content-type']).to.equal('application/json');
              expect(body).to.eql({a:1, b:2});
              done();
            })
            .catch(done);
        });

        it(method.toUpperCase() + ' should send body from a stream', function (done) {
          fs.writeFileSync(inFilePath, JSON.stringify({a:1, b:2}));
          request[method]('http://localhost:8088/test')
            .fromStream(fs.createReadStream(inFilePath))
            .contentType('application/json')
            .then(function (res) {
              expect(res.body).to.eql(responseData);
              expect(calledMethod).to.equal(method);
              expect(headers['content-type']).to.equal('application/json');
              expect(body).to.eql({a:1, b:2});
              done();
            })
            .catch(done);
        });

        it(method.toUpperCase() + ' should call methods registered via onResponse', function (done) {
          request[method]('http://localhost:8088/test')
            .onResponse(function (res) {
              return Promise.delay(1).then(function () {
                return res.body;
              });
            })
            .onResponse(function (body) {
              return {
                booty: body
              };
            })
            .then(function(wot) {
              expect(wot.booty).to.eql(responseData);
              done();
            })
            .catch(done);
        });

        it(method.toUpperCase() + ' should call methods registered via onBeforeExecute', function (done) {
          request[method]('http://localhost:8088/test')
            .onBeforeExecute(function (req) {
              return Promise.delay(1).then(function () {
                req.query('test 1', 1);
              });
            })
            .onBeforeExecute(function (req) {
              req.query('test 2', 2);
            })
            .then(function() {
              expect(queryString['test 1']).to.equal('1');
              expect(queryString['test 2']).to.equal('2');
              done();
            })
            .catch(done);
        });

        it(method.toUpperCase() + ' should be able to resend a cloned request', function (done) {
          var req = request[method]('http://localhost:8088/test')
            .body({some: 'data'})
            .header('x-my-header', 42)
            .query('wot', 'you heard me')
            .onBeforeExecute(function (req) {
              return Promise.delay(10).then(function () {
                req.query('yeah', 'test');
              });
            })
            .onResponse(function (res) {
              return res.body;
            });

          var clone = req.clone();

          return req
            .then(function (resBody) {
              expect(resBody).to.eql(responseData);
              expect(body).to.eql({some: 'data'});
              expect(headers['x-my-header']).to.equal('42');
              expect(queryString['wot']).to.equal('you heard me');
              expect(queryString['yeah']).to.equal('test');

              body = null;
              headers = null;
              queryString = null;

              return clone.clone();
            })
            .then(function (resBody) {
              expect(resBody).to.deep.equal(responseData);
              expect(body).to.deep.equal({some: 'data'});
              expect(headers['x-my-header']).to.equal('42');
              expect(queryString['wot']).to.equal('you heard me');
              expect(queryString['yeah']).to.equal('test');

              body = null;
              headers = null;
              queryString = null;

              return clone.clone();
            })
            .then(function (resBody) {
              expect(resBody).to.deep.equal(responseData);
              expect(body).to.deep.equal({some: 'data'});
              expect(headers['x-my-header']).to.equal('42');
              expect(queryString['wot']).to.equal('you heard me');
              expect(queryString['yeah']).to.equal('test');
              done();
            })
            .catch(done);
        });

      });
    });
  });
});
