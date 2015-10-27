var _ = require('lodash')
  , util = require('util')
  , path = require('path')
  , Promise = require('bluebird')
  , EventEmitter = require('events').EventEmitter
  , fileUtils = require('./file-utils')
  , fileIndex = 0;

/**
 * Job queue for files.
 *
 * You can enqueue files to one of these and the specified operation will be performed on the files
 * later. Useful for slow operations that you don't want to perform as a part of a request.
 *
 * Example:
 *
 * ```js
 * var options = {dirPath: '/some/dir/path', concurrency: 30};
 * var queue = new FileOperationQueue(options, function (filePath, metadata, progress) {
 *   return someHeavyFileOperation(filePath)
 *    .then(function() {
 *      progress(0.33);
 *      return someOtherOperation(filePath);
 *    })
 *    .then(function() {
 *      progress(0.66);
 *      return sendFileToCloud(filePath);
 *    })
 *    .then(function() {
 *      progress(1.0);
 *    });
 * });
 *
 * queue.enqueueFile('/path/to/my/file.jpg', {some: 'metadata', someMode: 'stuff'});
 * console.log(queue.progressWhere({some: 'metadata'}));
 * ```
 *
 * Note that you can just return a promise from the operation function. If an operation fails for a file
 * it will be attempted again later until it is finished successfully. If the operation is successful
 * the file will be removed from the queue and deleted.
 *
 * @param {function(String, Object, function):Promise} operation
 *    The operation to perform for the files.
 *
 * @param {Object} options
 *    Options object.
 *
 * @param {String} options.dirPath
 *    Path to the queue dir.
 *
 * @param {Number} options.concurrency
 *    How many operations are run in parallel.
 *
 * @param {Number} options.retryAfter
 *    How many milliseconds to wait until retry after failed operation.
 *
 * @constructor
 */
function FileOperationQueue(options, operation) {
  EventEmitter.call(this);

  options = options || {};
  options.concurrency = options.concurrency || 10;
  options.retryAfter = options.retryAfter || 1000;

  if (!options.dirPath) {
    throw new Error('options.dirPath needed');
  }

  if (!operation || !_.isFunction(operation)) {
    throw new Error('operation must be given');
  }

  /** @type {{dirPath:String, concurrency:Number, retryAfter:Number}} */
  this.options = options;

  /** @type {function(String, Object, Function(Number)):Promise} */
  this.operation = operation;

  /** @type {Object.<String, Promise>} */
  this.running = {};

  /** @type {Array.<File>} */
  this.queue = [];

  /** @type {Boolean} */
  this.stopped = false;

  /** @type {Promise} */
  this.initializePromise = this.initialize_();
}

util.inherits(FileOperationQueue, EventEmitter);

/**
 * Enqueue a file.
 *
 * @param {String} inputFilePath
 * @param {*} metadata
 * @returns {Promise}
 */
FileOperationQueue.prototype.enqueueFile = function (inputFilePath, metadata) {
  var self = this
    , dirPath = this.options.dirPath
    , file = new File(Date.now(), fileIndex++, metadata)
    , filePath = file.filePath(dirPath);

  return this.initializePromise
    .then(function () {
      return file.writeMetaFile(dirPath);
    })
    .then(function () {
      return fileUtils.moveFile(inputFilePath, filePath);
    })
    .then(function () {
      self.queue.push(file);
    })
    .then(function () {
      self.runOperations_();
    })
    .catch(function (error) {
      self.removeFile_(file).throw(error);
    });
};

/**
 * Get operation progress for operation whose metadata matches the `where` query.
 *
 * Example:
 *
 * ```js
 * queue.enqueueFile(filePath, {a:1, b:2, c:3});
 * queue.enqueueFile(filePath, {a:4, b:5, c:6});
 *
 * // Gets the progress of the first file.
 * queue.progressWhere({a:1});
 * queue.progressWhere({b:2, c:3});
 *
 * // Gets the progress of the second file.
 * queue.progressWhere({c:6});
 * queue.progressWhere({a:4, b:5, c:6});
 * ```
 *
 * @param {Object} where
 * @returns {Number}
 */
FileOperationQueue.prototype.progressWhere = function (where) {
  var file = _.find(this.queue, function (file) {
    var ok = true;
    _.each(where, function (value, key) {
      if (file.metadata[key] != value) {
        ok = false;
      }
    });
    return ok;
  });
  if (!file) {
    return 1.0;
  } else {
    return file.progress;
  }
};

/**
 * Stops the queue.
 *
 * No new operations are run after this method is called.
 *
 * @returns {Promise}
 *    This promise is resolved after all currently running operations have finished.
 */
FileOperationQueue.prototype.stop = function () {
  this.stopped = true;
  return Promise.settle(_.values(this.running));
};

/**
 * @returns {Promise}
 * @private
 */
FileOperationQueue.prototype.initialize_ = function () {
  var self = this
    , dirPath = self.options.dirPath;

  return fileUtils
    .exists(dirPath)
    .then(function (exists) {
      if (exists) {
        return;
      }
      return fileUtils.createDir(dirPath);
    })
    .then(function () {
      return fileUtils.readDir(dirPath);
    })
    .filter(function (fileName) {
      return File.isMetaFileName(fileName);
    })
    .map(function (fileName) {
      return File.fromFile(path.join(dirPath, fileName));
    }, {concurrency: 512})
    .then(function (files) {
      return _.sortBy(files, ['time', 'index']);
    })
    .map(function (file) {
      self.queue.push(file);
    })
    .then(function () {
      self.runOperations_();
    });
};

/**
 * @private
 */
FileOperationQueue.prototype.runOperations_ = function () {
  if (this.stopped) {
    return;
  }

  var self = this
    , start = []
    , numRunning = _.size(this.running)
    , numToStart = this.options.concurrency - numRunning;

  _.each(this.queue, function (file) {
    if (start.length >= numToStart) {
      return false;
    }
    if (!self.running[file.fileName()]) {
      start.push(file);
    }
  });

  _.each(start, function (file) {
    self.runOperationForFile_(file);
  });
};

/**
 * @private
 */
FileOperationQueue.prototype.runOperationForFile_ = function (file) {
  var self = this
    , dirPath = self.options.dirPath
    , fileName = file.fileName();

  this.running[fileName] = this.initializePromise
    .then(function () {
      return self.operation(path.join(dirPath, fileName), file.metadata, function (progress) {
        self.operationProgress_(file, progress);
      });
    })
    .then(function () {
      return self.removeFile_(file);
    })
    .then(function () {
      _.remove(self.queue, {time: file.time, index: file.index});
    })
    .catch(function () {
      file.progress = 0;
      return Promise.delay(self.options.retryAfter);
    })
    .finally(function () {
      delete self.running[fileName];
      self.runOperations_();
    });
};

/**
 * @private
 */
FileOperationQueue.prototype.operationProgress_ = function (file, progress) {
  file = _.find(this.queue, {time: file.time, index: file.index});
  file.progress = progress;
};

/**
 * @private
 * @returns {Promise}
 */
FileOperationQueue.prototype.removeFile_ = function (file) {
  var filePath = file.filePath(this.options.dirPath);
  var metaPath = file.metaFilePath(this.options.dirPath);
  return Promise.join(fileUtils.remove(filePath), fileUtils.remove(metaPath));
};

/**
 * @private
 * @constructor
 */
function File (time, index, metadata) {
  this.time = time;
  this.index = index;
  this.metadata = metadata;
  this.progress = 0;
}

/**
 * @returns {Promise}
 */
File.fromFile = function (filePath) {
  return fileUtils.readFile(filePath).then(function (data) {
    var json = JSON.parse(data.toString());
    return new File(json.time, json.index, json.metadata);
  });
};

/**
 * @returns {Boolean}
 */
File.isMetaFileName = function (fileName) {
  return /([0-9]+)_([0-9]+)_(meta)/.test(fileName);
};

/**
 * @returns {Promise}
 */
File.prototype.writeMetaFile = function (dirPath) {
  return fileUtils.writeFile(this.metaFilePath(dirPath), JSON.stringify(this));
};

/**
 * @returns {String}
 */
File.prototype.prefix = function () {
  return this.time + '_' + this.index + '_';
};

/**
 * @returns {String}
 */
File.prototype.fileName = function () {
  return this.prefix() + 'file';
};

/**
 * @returns {String}
 */
File.prototype.filePath = function (dirPath) {
  return path.join(dirPath, this.fileName());
};

/**
 * @returns {String}
 */
File.prototype.metaFileName = function () {
  return this.prefix() + 'meta';
};

/**
 * @returns {String}
 */
File.prototype.metaFilePath = function (dirPath) {
  return path.join(dirPath, this.metaFileName());
};

/**
 * @returns {{time: Number, index: Number, metadata: *}}
 */
File.prototype.toJSON = function () {
  return {
    time: this.time,
    index: this.index,
    metadata: this.metadata
  };
};

module.exports = FileOperationQueue;
