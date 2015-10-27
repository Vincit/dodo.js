var _ = require('lodash')
  , os = require('os')
  , fs = require('fs')
  , expect = require('chai').expect
  , express = require('express')
  , Promise = require('bluebird')
  , request = require('../../lib/http/request')
  , receiveFile = require('../../lib/file/receive-file')
  , sentFile = os.tmpdir() + 'sent'
  , receivedFile = os.tmpdir() + 'received';

// Create a file filled with random characters.
function createFile(filePath, size) {
  var buf = new Buffer(size);
  var str = 'abcdefghijklmnopqrstuvxyz';
  for (var i = 0; i < size; ++i) {
    buf[i] = str.charAt(Math.round(Math.random() * (str.length - 1)));
  }
  fs.writeFileSync(filePath, buf);
}

// Compare contents of two files.
function compareFiles(filePath1, filePath2) {
  var file1 = fs.readFileSync(filePath1).toString();
  var file2 = fs.readFileSync(filePath2).toString();
  return file1 === file2;
}

describe('receive-file', function() {
  var app = null;
  var sizeLimit;
  var fileReceived;
  var filesEqual;

  before(function (done) {
    app = express();

    app.post('/test', function(req, res) {
      receiveFile(req)
        .sizeLimit(sizeLimit)
        .path(receivedFile)
        .then(function(result) {
          fileReceived = fs.existsSync(receivedFile);

          // Don't move this code to the tests. We need to test that the file exists
          // and equals the sent file here in the `then` method of receiveFile.
          if (fileReceived) {
            filesEqual = compareFiles(sentFile, receivedFile);
          } else {
            filesEqual = false;
          }

          res.status(200).json(result);
        })
        .catch(function(error) {
          fileReceived = fs.existsSync(receivedFile);
          res.status(400).json(error);
        });
    });

    app.server = require('http').createServer(app);
    app.server.listen(8088, void 0, void 0, function () {
      done();
    });
  });

  after(function(done) {
    app.server.close(done);
  });

  beforeEach(function() {
    if (fs.existsSync(sentFile)) {
      fs.unlinkSync(sentFile);
    }

    if (fs.existsSync(receivedFile)) {
      fs.unlinkSync(receivedFile);
    }

    fileReceived = null;
    filesEqual = null;
    sizeLimit = 1024 * 1024 * 10;
  });

  it('should receive the sent file', function(done) {
    createFile(sentFile, 1024);
    request
      .post('http://localhost:8088/test')
      .multipartFile('file', sentFile)
      .then(function(res) {
        expect(res.statusCode).to.equal(200);
        expect(fileReceived).to.equal(true);
        expect(filesEqual).to.equal(true);
        done();
      })
      .catch(done);
  });

  it('should receive the sent file and additional fields', function() {
    createFile(sentFile, 1024);
    return request
      .post('http://localhost:8088/test')
      .multipart('someField', 'someValue')
      .multipart('someOtherField', 'someOtherValue')
      .multipartFile('file', sentFile)
      .then(function(res) {
        expect(res.statusCode).to.equal(200);
        expect(fileReceived).to.equal(true);
        expect(filesEqual).to.equal(true);
        expect(res.body.fields).to.eql({someField: 'someValue', someOtherField: 'someOtherValue'});
        expect(res.body.path).to.eql(receivedFile);
      });
  });

  it('should fail if the sent file is too large', function() {
    sizeLimit = 1000;
    createFile(sentFile, 1024);
    return request
      .post('http://localhost:8088/test')
      .multipartFile('file', sentFile)
      .then(function(res) {
        expect(res.statusCode).to.equal(400);
        expect(fileReceived).to.equal(false);
      });
  });

  it('should fail with multiple files', function() {
    createFile(sentFile, 1024);
    return request
      .post('http://localhost:8088/test')
      .multipartFile('file1', sentFile)
      .multipartFile('file2', sentFile)
      .then(function(res) {
        expect(res.statusCode).to.equal(400);
        expect(fileReceived).to.equal(false);
      });
  });

  it('should fail if there is no file (1)', function() {
    createFile(sentFile, 10 * 1024);
    return request
      .post('http://localhost:8088/test')
      .then(function(res) {
        expect(res.statusCode).to.equal(400);
        expect(fileReceived).to.equal(false);
      });
  });

  it('should fail if there is no file (2)', function() {
    createFile(sentFile, 10 * 1024);
    return request
      .post('http://localhost:8088/test')
      .multipart('someField', 'someValue')
      .then(function(res) {
        expect(res.statusCode).to.equal(400);
        expect(fileReceived).to.equal(false);
      });
  });
});
