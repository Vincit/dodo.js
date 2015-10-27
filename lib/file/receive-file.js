"use strict";

var os = require('os')
  , fs = require('fs')
  , path = require('path')
  , uuid = require('node-uuid')
  , Busboy = require('busboy')
  , Promise = require('bluebird')
  , fileUtils = require('./file-utils')
  , ValidationError = require('../errors/ValidationError');

/**
 * Extracts a file from a multipart request and saves it to file path.
 *
 * Examples:
 *
 * ```js
 * // This receives the file to the system's temporary directory.
 * // The file's name will be an UUID.
 * receiveFile(req)
 *   .then(function (fileInfo) {
 *     console.log(fileInfo.originalName);
 *     console.log(fileInfo.mimeType);
 *     console.log(fileInfo.path);
 *     console.log(fileInfo.fields);
 *   });
 *
 * receiveFile(req)
 *   .path(someFilePath)
 *   .sizeLimit(1024 * 1024)
 *   .then(function (fileInfo) {
 *     console.log(fileInfo.originalName);
 *     console.log(fileInfo.mimeType);
 *     console.log(fileInfo.path);
 *     console.log(fileInfo.fields);
 *   });
 * ```
 *
 * @param {Request} req
 * @returns {MultipartFileReceiver}
 */
module.exports = function (req) {
  return new MultipartFileReceiver(req);
};

/**
 * @constructor
 */
function MultipartFileReceiver(req) {
  this.req_ = req;
  this.dir_ = os.tmpdir();
  this.name_ = uuid.v4();
  this.sizeLimit_ = 100 * 1024 * 1024;
}

/**
 * Sets the directory where the file will be saved.
 *
 * Default is `os.tmpdir()`.
 *
 * @param {String} dir
 * @returns {MultipartFileReceiver}
 */
MultipartFileReceiver.prototype.dir = function (dir) {
  this.dir_ = dir;
  return this;
};

/**
 * Sets the file size limit in bytes.
 *
 * Default is 100 megabytes.
 *
 * @param {Number} sizeLimit
 * @returns {MultipartFileReceiver}
 */
MultipartFileReceiver.prototype.sizeLimit = function (sizeLimit) {
  this.sizeLimit_ = sizeLimit;
  return this;
};

/**
 * Sets the name of the file to be created.
 *
 * Default is an UUID.
 *
 * @param {String} name
 * @returns {MultipartFileReceiver}
 */
MultipartFileReceiver.prototype.name = function (name) {
  this.name_ = name;
  return this;
};

/**
 * Sets the path where the file will be saved.
 *
 * Default is `path.join(os.tmpdir(), uuid.v4())`.
 *
 * @param {String} filePath
 * @returns {MultipartFileReceiver}
 */
MultipartFileReceiver.prototype.path = function (filePath) {
  this.name_ = path.basename(filePath);
  this.dir_ = path.dirname(filePath);
  return this;
};

/**
 * Starts receiving the file and returns a promise.
 *
 * The returned promise resolves to an object that is described in the `callback`'s documentation.
 * Any non-file fields received in the multipart request are stored to the `fields` property of
 * that object.
 *
 * @param {function ({path:String, originalName:String, mimeType:String, fields:object})} callback
 * @param {function (Error)=} errorCallback
 * @returns {Promise}
 */
MultipartFileReceiver.prototype.then = function (callback, errorCallback) {
  return this.receive_().then(callback, errorCallback);
};

/**
 * @returns {Promise}
 * @private
 */
MultipartFileReceiver.prototype.receive_ = function () {
  var self = this;
  var filePath = path.join(this.dir_, this.name_);
  var busboyConfig = {
    headers: this.req_.headers,
    limits: {
      fileSize: this.sizeLimit_,
      files: 1,
      fields: 50
    }
  };

  return new Promise(function (resolve, reject) {
    var busboy = new Busboy(busboyConfig);
    // The local file stream we are writing to.
    var fileStream = null;
    // Promise that is resolved after the local file has been fully written
    // and flushed to the file system.
    var filePromise = null;
    // The non-file fields in the request.
    var fields = {};
    var error = null;

    // Check content-length header against self.sizeLimit_.
    self.checkContentLength_();

    // Function that is called on success. This is the The only thing
    // that calls the promise's resolve function.
    var successHandler = function () {
      if (!filePromise) {
        errorHandler(self.noFilesError_());
      } else if (!error) {
        filePromise.then(function (fileInfo) {
          resolve(fileInfo);
        });
      }
    };

    // Function that is called on error. This is the only thing that
    // calls the promise's reject function.
    var errorHandler = function (err) {
      if (error) {
        // Error already occurred.
        return;
      }

      error = err;
      if (fileStream && fileStream.close) {
        // Make sure the local file stream is closed. `close` is not a public
        // method. That's why we checked for the existence of fileStream.close.
        fileStream.close();
      }

      // Make sure we don't leak files.
      fileUtils
        .remove(filePath)
        .catch(function (err) {
          console.error('MultipartFileReceiver.receive_: could not remove file', err.stack);
        })
        .finally(function () {
          reject(err);
        });
    };

    busboy.on('field', function (key, value) {
      fields[key] = value;
    });

    busboy.on('file', function (fieldName, file, origFileName, encoding, mimeType) {
      try {
        var fileInfo = {
          originalName: origFileName,
          mimeType: mimeType,
          path: filePath,
          fields: fields
        };

        fileStream = fs.createWriteStream(filePath);
        fileStream.on('error', errorHandler);

        filePromise = new Promise(function (resolve) {
          fileStream.on('finish', function () {
            resolve(fileInfo);
          });
        });

        file.on('error', errorHandler);
        file.on('limit', function () {
          // This event is fired if the file is larger than self.sizeLimit_ bytes. We get here
          // only if the request didn't have the content-length header.
          errorHandler(self.fileSizeError_());
        });

        file.pipe(fileStream);

      } catch (err) {
        errorHandler(err);
      }
    });

    busboy.on('finish', successHandler);
    busboy.on('error', errorHandler);
    busboy.on('filesLimit', function () {
      errorHandler(self.tooManyFilesError_());
    });

    self.req_.on('error', errorHandler);
    self.req_.pipe(busboy);
  });
};

/**
 * @private
 */
MultipartFileReceiver.prototype.checkContentLength_ = function () {
  if (this.req_.get('content-length')) {
    var contentLength = parseInt(this.req_.get('content-length'), 10);
    // This is not 100% accurate as there can be other things besides the file in the content.
    // However, there shouldn't be much more and the size limit is usually so high that this
    // kind of accuracy is not needed.
    if (contentLength > this.sizeLimit_) {
      throw this.fileSizeError_();
    }
  }
};

/**
 * @private
 */
MultipartFileReceiver.prototype.fileSizeError_ = function () {
  return new ValidationError({
    fileSize: 'The uploaded file is too big. Limit is ' + Math.round(this.sizeLimit_ / 1024) + 'kb'
  });
};

/**
 * @private
 */
MultipartFileReceiver.prototype.noFilesError_ = function () {
  return new ValidationError({
    filesLimit: 'Only one file per request is supported.'
  });
};

/**
 * @private
 */
MultipartFileReceiver.prototype.tooManyFilesError_ = function () {
  return new ValidationError({
    filesLimit: 'Only one file per request is supported.'
  });
};
