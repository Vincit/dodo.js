var _ = require('lodash')
  , uuid = require('node-uuid')
  , fs = require('fs')
  , expect = require('chai').expect
  , Promise = require('bluebird')
  , os = require('os')
  , path = require('path')
  , fileUtils = require('../../lib/file/file-utils')
  , FileOperationQueue = require('../../lib/file/FileOperationQueue');

Promise.longStackTraces();

var tmpDir = os.tmpdir();
var queueDir = path.join(tmpDir, 'file_operation_queue');

describe('FileOperationQueue', function () {

  beforeEach(function () {
    return fileUtils.remove(queueDir);
  });

  it('should fail if dirPath not given', function () {
    expect(function () {
      new FileOperationQueue({}, function (filePath, metadata, progress) {
      });
    }).to.throw(/options.dirPath needed/);
  });

  it('should fail if operation not given', function () {
    expect(function () {
      new FileOperationQueue({ dirPath: queueDir });
    }).to.throw(/operation must be given/);
  });


  it('should create the directory', function () {
    var queue = new FileOperationQueue({dirPath: queueDir}, function (filePath, metadata, progress) {});

    return queue.initializePromise
      .then(function () {
        return fileUtils.exists(queueDir);
      })
      .then(function (exists) {
        expect(exists).to.be.true;
        return queue.stop();
      });
  });

  it('should pass the file name to the operation', function () {
    var file = path.join(tmpDir, uuid.v4());
    fs.writeFileSync(file, 'test file content');

    var correctFilePassed = false;
    var queue = new FileOperationQueue({dirPath: queueDir}, function (filePath) {
      correctFilePassed = (fs.readFileSync(filePath).toString() === 'test file content');
    });

    return queue
      .enqueueFile(file, {some: 'metadata 1'})
      .then(function () {
        return queue.stop();
      })
      .then(function () {
        expect(correctFilePassed).to.be.true;
      });
  });

  it('should move queued files to the queue directory', function () {
    var file = path.join(tmpDir, uuid.v4());
    var file2 = path.join(tmpDir, uuid.v4());

    fs.writeFileSync(file, 'test1');
    fs.writeFileSync(file2, 'test2');

    var opMeta = [];
    var queue = new FileOperationQueue({dirPath: queueDir}, function (filePath, metadata) {
      opMeta.push(metadata);
      return Promise.delay(100);
    });

    return Promise.join(
      queue.enqueueFile(file, {some: 'metadata 1'}),
      queue.enqueueFile(file2, {some: 'metadata 2'})
    ).then(function () {
      expect(fs.existsSync(file)).to.be.false;
      expect(fs.existsSync(file2)).to.be.false;
      // Two files per file (meta and the actual file).
      expect(fs.readdirSync(queueDir)).to.have.length(4);
      expect(_.where(opMeta, {some: 'metadata 1'})).to.have.length(1);
      expect(_.where(opMeta, {some: 'metadata 2'})).to.have.length(1);
      return queue.stop();
    });
  });

  it('should remove file after successful operation (promise)', function () {
    var file = path.join(tmpDir, uuid.v4());
    fs.writeFileSync(file, 'test1');

    var opMeta = [];
    var queue = new FileOperationQueue({dirPath: queueDir}, function (filePath, metadata) {
      opMeta.push(metadata);
      return Promise.resolve();
    });

    return queue
      .enqueueFile(file, {some: 'metadata 1'})
      .then(function () {
        return queue.stop();
      })
      .then(function () {
        expect(fs.existsSync(file)).to.be.false;
        expect(fs.readdirSync(queueDir)).to.have.length(0);
        expect(opMeta[0]).to.eql({some: 'metadata 1'});
      });
  });

  it('should remove file after successful operation (value)', function () {
    var file = path.join(tmpDir, uuid.v4());
    fs.writeFileSync(file, 'test1');

    var opMeta = [];
    var queue = new FileOperationQueue({dirPath: queueDir}, function (filePath, metadata) {
      opMeta.push(metadata);
    });

    return queue
      .enqueueFile(file, {some: 'metadata 1'})
      .then(function () {
        return queue.stop()
      })
      .then(function () {
        expect(fs.existsSync(file)).to.be.false;
        expect(fs.readdirSync(queueDir)).to.have.length(0);
        expect(opMeta[0]).to.eql({some: 'metadata 1'});
      });
  });

  it('should not remove file after failed operation', function () {
    var file = path.join(tmpDir, uuid.v4());
    fs.writeFileSync(file, 'test1');

    var opMeta = [];
    var queue = new FileOperationQueue({dirPath: queueDir, retryAfter: 100}, function (filePath, metadata) {
      opMeta.push(metadata);
      return Promise.reject();
    });

    return queue
      .enqueueFile(file, {some: 'metadata 1'})
      .then(function () {
        return Promise.delay(450);
      })
      .then(function () {
        expect(fs.existsSync(file)).to.be.false;
        expect(fs.readdirSync(queueDir)).to.have.length(2);
        // There should have been 5 retries because of retryAfter.
        expect(opMeta).to.have.length(5);
      });
  });

  it('should only run options.concurrency operations at a time', function () {
    var files = [];
    // Create ten test files.
    for (var i = 0; i < 10; ++i) {
      files.push(path.join(tmpDir, uuid.v4()));
      fs.writeFileSync(files[i], 'test' + i);
    }

    var opMeta = [];
    var queue = new FileOperationQueue({dirPath: queueDir, concurrency: 3}, function (filePath, metadata) {
      opMeta.push(metadata);
      return Promise.delay(100);
    });

    return Promise
      .all(_.map(files, function (file, idx) {
        return queue.enqueueFile(file, {some: 'metadata ' + idx})
      }))
      .delay(150)
      .then(function () {
        // In 150 milliseconds 3 100 millisecond operations should have finished
        // leading to 6 files being removed.
        expect(fs.readdirSync(queueDir)).to.have.length(14);
      })
      .delay(100)
      .then(function () {
        // In 250 milliseconds 6 100 millisecond operations should have finished
        // leading to 12 files being removed.
        expect(fs.readdirSync(queueDir)).to.have.length(8);
      })
      .delay(100)
      .then(function () {
        // In 350 milliseconds 9 100 millisecond operations should have finished
        // leading to 18 files being removed.
        expect(fs.readdirSync(queueDir)).to.have.length(2);
      })
      .delay(100)
      .then(function () {
        // In 450 milliseconds 12 100 millisecond operations should have finished
        // leading to all files being removed.
        expect(fs.readdirSync(queueDir)).to.have.length(0);
        _.each(files, function (file, idx) {
          expect(_.where(opMeta, {some: 'metadata ' + idx})).to.have.length(1);
        });
        return queue.stop();
      });
  });

  it('should update progress', function () {
    var file = path.join(tmpDir, uuid.v4());
    fs.writeFileSync(file, 'test1');

    var opMeta = [];
    var queue = new FileOperationQueue({dirPath: queueDir, concurrency: 3}, function (filePath, metadata, progress) {
      opMeta.push(metadata);
      return Promise
        .delay(100)
        .then(function () {
          progress(0.33);
        })
        .delay(100)
        .then(function () {
          progress(0.66);
        })
        .delay(100)
        .then(function () {
          progress(0.99);
        })
        .delay(100);
    });

    return queue
      .enqueueFile(file, {some: 'metadata 1'})
      .then(function () {
        expect(queue.progressWhere({some: 'metadata 1'})).to.equal(0.0);
      })
      .delay(150)
      .then(function () {
        expect(queue.progressWhere({some: 'metadata 1'})).to.equal(0.33);
      })
      .delay(100)
      .then(function () {
        expect(queue.progressWhere({some: 'metadata 1'})).to.equal(0.66);
      })
      .delay(100)
      .then(function () {
        expect(queue.progressWhere({some: 'metadata 1'})).to.equal(0.99);
      })
      .delay(100)
      .then(function () {
        expect(queue.progressWhere({some: 'metadata 1'})).to.equal(1.00);
        return queue.stop();
      });
  });

  it('should continue when restarted', function () {
    var file = path.join(tmpDir, uuid.v4());
    var file2 = path.join(tmpDir, uuid.v4());
    var file3 = path.join(tmpDir, uuid.v4());

    fs.writeFileSync(file, 'test1');
    fs.writeFileSync(file2, 'test2');
    fs.writeFileSync(file3, 'test3');

    var queue = new FileOperationQueue({dirPath: queueDir, concurrency: 3}, function (filePath, metadata, progress) {
    });
    // Stop so that the operations don't start yet.
    queue.stop();

    var opMeta = [];
    return Promise
      .join(queue.enqueueFile(file, {test: 1}), queue.enqueueFile(file2, {test: 2}))
      .then(function () {
        // Create new queue. It should find the files added through the original queue.
        queue = new FileOperationQueue({dirPath: queueDir, concurrency: 3}, function (filePath, metadata) {
          opMeta.push(metadata);
        });
        return queue.enqueueFile(file3, {test: 3});
      })
      .then(function () {
        expect(_.where(opMeta, {test: 1})).to.have.length(1);
        expect(_.where(opMeta, {test: 2})).to.have.length(1);
        expect(_.where(opMeta, {test: 3})).to.have.length(1);
      });
  });

});
