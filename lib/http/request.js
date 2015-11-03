var _ = require('lodash')
  , fs = require('fs')
  , URL = require('url')
  , zlib = require('zlib')
  , http = require('http')
  , https = require('https')
  , Promise = require('bluebird')
  , FormData = require('form-data')
  , queryString = require('querystring');

/**
 * Promisified HTTP/HTTPS request.
 *
 * There are two ways to use this module. First one is to use the `.get`, `.put`, `.post` etc.
 * method found in this module's root:
 *
 * ```js
 * var request = require('dodo/lib/http/request');
 *
 * request
 *   .post('http://www.something.com/some/resource')
 *   .body({some: 'json object'})
 *   .then(function (res) {
 *     console.log(res.body);
 *   });
 * ```
 *
 * The second way to use this module is to use is as a function. The function is given an URL string
 * and it returns an object that has the same `.get`, `.put`, `.post` etc. methods as the module's
 * root. The returned object is bound to the given URL:
 *
 * ```js
 * var request = require('dodo/lib/http/request');
 *
 * // Create a request object that is bound to an URL.
 * var somethingDotCom = request('http://www.something.com/');
 *
 * // The following creates a POST request to http://www.something.com/some/resource.
 * somethingDotCom
 *   .post('some/resource')
 *   .body({some: 'json object'})
 *   .then(function (res) {
 *     console.log(res.body);
 *   });
 * ```
 */
module.exports = function (urlStart) {
  urlStart = urlStart || '';

  /**
   * @param {String=} url
   * @returns {PromisifiedRequest}
   */
  return {
    /**
     * @param {String=} url
     * @returns {PromisifiedRequest}
     */
    get: function (url) {
      return new PromisifiedRequest('GET', urlStart + url);
    },

    /**
     * @param {String=} url
     * @returns {PromisifiedRequest}
     */
    put: function (url) {
      return new PromisifiedRequest('PUT', urlStart + url);
    },

    /**
     * @param {String=} url
     * @returns {PromisifiedRequest}
     */
    patch: function (url) {
      return new PromisifiedRequest('PATCH', urlStart + url);
    },

    /**
     * @param {String=} url
     * @returns {PromisifiedRequest}
     */
    post: function (url) {
      return new PromisifiedRequest('POST', urlStart + url);
    },

    /**
     * @param {String=} url
     * @returns {PromisifiedRequest}
     */
    delete: function (url) {
      return new PromisifiedRequest('DELETE', urlStart + url);
    }
  };
};

/**
 * Promisified GET request.
 *
 * Examples:
 *
 * ```js
 * // GET request with one query parameter and one custom header.
 * request
 *   .get('http://www.something.com/some/resource')
 *   .query('search', 'some search text')
 *   .header('x-auth-token', authToken)
 *   .then(function (res) {
 *     console.log(res.body);
 *   });
 *
 * // Response is written to a file.
 * request
 *   .get('http://www.something.com/image.jpg')
 *   .toFile('/some/file/path/image.jpg')
 *   .then(function (res) {
 *     console.log(res.statusCode);
 *   });
 * ```
 *
 * @param {String=} url
 * @returns {PromisifiedRequest}
 */
module.exports.get = function (url) {
  return new PromisifiedRequest('GET', url);
};

/**
 * Promisified PUT request.
 *
 * Examples:
 *
 * ```js
 * // PUT request with one query parameter. Body is read from file and response
 * // is written to a file.
 * request
 *   .put('http://www.something.com/resizeImage')
 *   .query('resizeWidth', 80)
 *   .fromFile('/some/file/path/image.jpg')
 *   .toFile('/some/file/path/thumb.jpg')
 *   .then(function (res) {
 *     console.log(res.statusCode);
 *   });
 *
 * // PUT request with multipart/form-data body.
 * request
 *   .put('http://www.something.com/resizeImage')
 *   .multipart('resizeWidth', 80)
 *   .multipartFile('file', '/some/file/path/image.jpg')
 *   .then(function (res) {
 *     console.log(res.statusCode);
 *     console.log(res.body);
 *   });
 * ```
 *
 * @param {String=} url
 * @returns {PromisifiedRequest}
 */
module.exports.put = function (url) {
  return new PromisifiedRequest('PUT', url);
};

/**
 * Promisified PATCH request.
 *
 * Examples:
 *
 * ```js
 * // PATCH request with one query parameter. Content-Type is set automatically.
 * request
 *   .patch('http://www.something.com/some/path')
 *   .query('someParam', 'foo')
 *   .body({some: 'data'})
 *   .then(function (res) {
 *     console.log(res.statusCode);
 *   });
 * ```
 *
 * @param {String=} url
 * @returns {PromisifiedRequest}
 */
module.exports.patch = function (url) {
  return new PromisifiedRequest('PATCH', url);
};

/**
 * Promisified POST request.
 *
 * Examples:
 *
 * ```js
 * // POST request with JSON body. Content-Type is set automatically.
 * request
 *   .post('https://www.something.com/somePath')
 *   .body({some: 'data'})
 *   .then(function (res) {
 *     console.log(res.body);
 *   });
 *
 * // POST request with multipart/form-data body. Save response to a file.
 * request
 *   .post('http://www.something.com/makeThumb')
 *   .multipartFile('file', '/some/file/path/image.jpg')
 *   .toFile('/some/file/path/thumb.jpg')
 *   .then(function (res) {
 *     console.log(res.statusCode);
 *   });
 * ```
 *
 * @param {String=} url
 * @returns {PromisifiedRequest}
 */
module.exports.post = function (url) {
  return new PromisifiedRequest('POST', url);
};

/**
 * Promisified DELETE request.
 *
 * Examples:
 *
 * ```js
 * request
 *   .delete('https://www.something.com/some/resource/14')
 *   .then(function (res) {
 *     console.log(res.statusCode);
 *   });
 * ```
 *
 * @param {String=} url
 * @returns {PromisifiedRequest}
 */
module.exports.delete = function (url) {
  return new PromisifiedRequest('DELETE', url);
};

/**
 * @param {String} method
 * @param {String} url
 * @constructor
 */
function PromisifiedRequest (method, url) {
  this.method_ = method;
  this.url_ = null;
  this.timeout_ = null;
  this.headers_ = {};
  this.body_ = null;
  this.toFilePath_ = null;
  this.fromFilePath_ = null;
  this.toStream_ = null;
  this.fromStream_ = null;
  this.agent_ = null;
  this.formValues_ = {};
  this.formFiles_ = {};
  this.onBeforeExecute_ = [];
  this.onResponse_ = [];

  // Properties used only after the request is executed.
  this.responseBody_ = [];
  this.executed_ = false;
  this.form_ = null;

  this.url(url);
  this.header('Accept', 'application/json');
}

/**
 * @returns {PromisifiedRequest}
 */
PromisifiedRequest.prototype.clone = function () {
  if (this.toStream_ || this.fromStream_ || !_.all(this.formFiles_, _.isString)) {
    throw new Error('cannot clone a PromisifiedRequest that has streams attached to it');
  }

  if (this.executed_) {
    throw new Error('cannot clone an executed PromisifiedRequest');
  }

  var clone = new PromisifiedRequest(this.method_, '');

  clone.url_ = _.cloneDeep(this.url_);
  clone.timeout_ = this.timeout_;
  clone.headers_ = _.cloneDeep(this.headers_);
  clone.body_ = this.body_;
  clone.toFilePath_ = this.toFilePath_;
  clone.fromFilePath_ = this.fromFilePath_;
  clone.agent_ = this.agent_;
  clone.formValues_ = _.cloneDeep(this.formValues_);
  clone.formFiles_ = _.cloneDeep(this.formFiles_);
  clone.onResponse_ = _.clone(this.onResponse_);
  clone.onBeforeExecute_ = _.clone(this.onBeforeExecute_);

  return clone;
};

/**
 * @param {String} url
 * @returns {PromisifiedRequest}
 */
PromisifiedRequest.prototype.url = function (url) {
  this.url_ = URL.parse(url || '');
  return this;
};

/**
 * @param {String} protocol
 * @returns {PromisifiedRequest}
 */
PromisifiedRequest.prototype.protocol = function (protocol) {
  this.url_.protocol = protocol;

  if (_.last(protocol) !== ':') {
    this.url_.protocol += ':';
  }

  return this;
};

/**
 * @param {String} hostname
 * @returns {PromisifiedRequest}
 */
PromisifiedRequest.prototype.hostname = function (hostname) {
  this.url_.hostname = hostname;
  return this;
};

/**
 * @param {Number} port
 * @returns {PromisifiedRequest}
 */
PromisifiedRequest.prototype.port = function (port) {
  this.url_.port = port;
  return this;
};

/**
 * @param {String} path
 * @returns {PromisifiedRequest}
 */
PromisifiedRequest.prototype.path = function (path) {
  this.url_.path = path;
  return this;
};

/**
 * @param {String|Object} key
 * @param {String|Number|Array.<String>|Array.<Number>=} value
 * @returns {PromisifiedRequest}
 */
PromisifiedRequest.prototype.query = function (key, value) {
  if (_.isObject(key) && _.isUndefined(value)) {
    this.url_.query = key;
  } else {
    this.url_.query = this.url_.query || {};
    this.url_.query[key] = this.url_.query[key] || [];

    if (_.isArray(value)) {
      this.url_.query[key] = this.url_.query[key].concat(value);
    } else {
      this.url_.query[key].push(value);
    }
  }
  return this;
};

/**
 * @param {Number} timeout
 * @returns {PromisifiedRequest}
 */
PromisifiedRequest.prototype.timeout = function (timeout) {
  this.timeout_ = timeout;
  return this;
};

/**
 * @param {Agent} agent
 * @returns {PromisifiedRequest}
 */
PromisifiedRequest.prototype.agent = function (agent) {
  this.agent_ = agent;
  return this;
};

/**
 * @param {Object} headers
 * @returns {PromisifiedRequest}
 */
PromisifiedRequest.prototype.headers = function (headers) {
  this.headers_ = _.mapKeys(headers, function (value, key) {
    return trainCase(key);
  });
  return this;
};

/**
 * @param {String} key
 * @param {String} value
 * @returns {PromisifiedRequest}
 */
PromisifiedRequest.prototype.header = function (key, value) {
  this.headers_[trainCase(key)] = value;
  return this;
};

/**
 * @param {String} contentType
 * @returns {PromisifiedRequest}
 */
PromisifiedRequest.prototype.contentType = function (contentType) {
  return this.header('Content-Type', contentType);
};

/**
 * @param {Object|String|Buffer} body
 * @returns {PromisifiedRequest}
 */
PromisifiedRequest.prototype.body = function (body) {
  if (body instanceof Buffer) {
    this.body_ = body;
    this.contentType('application/octet-stream; charset=utf-8');
  } else if (_.isObject(body)) {
    this.body_ = JSON.stringify(body);
    this.contentType('application/json; charset=utf-8');
  } else {
    this.body_ = body;
    this.contentType('text/plain; charset=utf-8');
  }
  return this;
};

/**
 * @param {String} toFilePath
 * @returns {PromisifiedRequest}
 */
PromisifiedRequest.prototype.toFile = function (toFilePath) {
  this.toFilePath_ = toFilePath;
  return this;
};

/**
 * @param {String} fromFilePath
 * @returns {PromisifiedRequest}
 */
PromisifiedRequest.prototype.fromFile = function (fromFilePath) {
  this.fromFilePath_ = fromFilePath;
  this.contentType('application/octet-stream');
  return this;
};

/**
 * @param {Stream} toStream
 * @returns {PromisifiedRequest}
 */
PromisifiedRequest.prototype.toStream = function (toStream) {
  this.toStream_ = toStream;
  return this;
};

/**
 * @param {Stream} fromStream
 * @returns {PromisifiedRequest}
 */
PromisifiedRequest.prototype.fromStream = function (fromStream) {
  this.fromStream_ = fromStream;
  return this;
};

/**
 * @param {String} key
 * @param {String|Buffer} value
 * @returns {PromisifiedRequest}
 */
PromisifiedRequest.prototype.multipart = function (key, value) {
  this.formValues_[key] = value;
  return this;
};

/**
 * @param {String} key
 * @param {String|Readable} filePathOrStream
 * @returns {PromisifiedRequest}
 */
PromisifiedRequest.prototype.multipartFile = function (key, filePathOrStream) {
  this.formFiles_[key] = filePathOrStream;
  return this;
};

/**
 * @param {Function} cb
 * @returns {PromisifiedRequest}
 */
PromisifiedRequest.prototype.onBeforeExecute = function (cb) {
  this.onBeforeExecute_.push(cb);
  return this;
};

/**
 * @param {Function} cb
 * @returns {PromisifiedRequest}
 */
PromisifiedRequest.prototype.onResponse = function (cb) {
  this.onResponse_.push(cb);
  return this;
};

/**
 * @param {Function} callback
 * @param {Function=} errorCallback
 * @returns {Promise}
 */
PromisifiedRequest.prototype.then = function (callback, errorCallback) {
  var self = this;
  var promise = Promise.resolve();

  _.each(this.onBeforeExecute_, function (cb) {
    promise = promise.then(function () {
      return cb(self);
    });
  });

  promise = promise.then(function () {
    return self.execute_();
  });

  _.each(this.onResponse_, function (cb) {
    promise = promise.then(cb);
  });

  return promise.then(callback, errorCallback);
};

/**
 * @private
 */
PromisifiedRequest.prototype.execute_ = function () {
  var self = this;

  return new Promise(function (resolve, reject) {
    if (self.executed_) {
      // Can only execute once.
      return reject(new Error('request ' + URL.format(self.url_) + ' has already been executed'));
    }

    self.executed_ = true;
    var httpModule = (self.url_.protocol === 'http:') ? http : https;

    self.configureStreamsIfNeeded_(function (err) {
      if (err) return self.onError_(err, reject);
      var opt = self.requestOptions_();

      var req = httpModule.request(opt, function (res) {
        var stream = self.createResponseStream_(res);

        stream.on('data', function (chunk) {
          self.onData_(chunk);
        });

        stream.on('end', function () {
          self.onEnd_(res, resolve);
        });

        res.on('error', function (err) {
          self.onError_(err, reject);
        });

        stream.on('error', function (err) {
          self.onError_(err, reject);
        });
      });

      req.on('error', function (err) {
        self.onError_(err, reject);
      });

      self.configureRequest_(req);
      self.writeRequestBody_(req);
    });
  }).catch(function (err) {
      self.cleanupOnError_();
      throw err;
    });
};

/**
 * @private
 */
PromisifiedRequest.prototype.configureStreamsIfNeeded_ = function (callback) {
  var self = this;

  if (this.toFilePath_) {
    this.toStream_ = fs.createWriteStream(this.toFilePath_);
  }

  if (this.fromFilePath_) {
    this.fromStream_ = fs.createReadStream(this.fromFilePath_);

    // Read file size.
    fs.stat(this.fromFilePath_, function (err, stat) {
      if (err) return callback(err);
      self.header('Content-Length', stat.size);
      callback();
    });

  } else if (!_.isEmpty(this.formFiles_) || !_.isEmpty(this.formValues_)) {
    this.form_ = new FormData();

    _.each(this.formValues_, function (value, key) {
      self.form_.append(key, value);
    });

    _.each(this.formFiles_, function (filePathOrStream, key) {
      var stream = _.isString(filePathOrStream)
        ? fs.createReadStream(filePathOrStream)
        : filePathOrStream;

      self.form_.append(key, stream);
    });

    this.fromStream_ = this.form_;
    process.nextTick(callback);
  } else {
    process.nextTick(callback);
  }
};

/**
 * @private
 */
PromisifiedRequest.prototype.requestOptions_ = function () {
  var options = {
    method: this.method_,
    hostname: this.url_.hostname,
    port: this.url_.port,
    path: this.url_.path
  };

  if (this.url_.query) {
    options.path += '?' + queryString.stringify(this.url_.query);
  }

  if (this.agent_) {
    options.agent = this.agent_;
  }

  return options;
};

/**
 * @private
 */
PromisifiedRequest.prototype.configureRequest_ = function (req) {
  if (this.timeout_) {
    req.setTimeout(this.timeout_);
  }

  _.each(this.headers_, function (value, key) {
    req.setHeader(key, value);
  });

  if (this.form_) {
    _.each(this.form_.getHeaders(), function (value, key) {
      req.setHeader(trainCase(key), value);
    });
  }

  req.setHeader('Accept-Encoding', 'gzip');
};

/**
 * @private
 */
PromisifiedRequest.prototype.createResponseStream_ = function (res) {
  var encoding = res.headers['content-encoding'];
  var stream = res;

  if (_.isString(encoding) && encoding.trim().toLowerCase() === 'gzip') {
    stream = zlib.createGunzip();
    res.pipe(stream);
  }

  return stream;
};

/**
 * @private
 */
PromisifiedRequest.prototype.writeRequestBody_ = function (req) {
  if (this.fromStream_) {
    this.fromStream_.pipe(req);
  } else {
    if (this.body_) {
      req.write(this.body_);
    }
    req.end();
  }
};

/**
 * @private
 */
PromisifiedRequest.prototype.onData_ = function (chunk) {
  if (this.toStream_) {
    this.toStream_.write(chunk);
  } else {
    this.responseBody_.push(chunk);
  }
};

/**
 * @private
 */
PromisifiedRequest.prototype.onError_ = function (err, reject) {
  this.cleanupOnError_(function () {
    reject(err);
  });
};

/**
 * @private
 */
PromisifiedRequest.prototype.onEnd_ = function (res, resolve) {
  if (this.toStream_) {
    this.toStream_.end(function () {
      resolve(res);
    });
  } else {
    var buffer = Buffer.concat(this.responseBody_);
    var body = buffer;

    if (buffer.length > 0) {
      // World is full of shitty API:s and we cannot trust the 'content-type' header to
      // reflect the actual content type of the request. Therefore we try to convert
      // everything to JSON and if it fails, we just return the raw data as Buffer.
      try {
        body = JSON.parse(buffer.toString());
      } catch (err) {
        // Do nothing.
      }
    }

    res.body = body;
    resolve(res);
  }
};

/**
 * @private
 */
PromisifiedRequest.prototype.cleanupOnError_ = function (callback) {
  callback = callback || _.noop;
  var self = this;

  if (this.toStream_) {
    // If we are writing the response to a stream, end the stream.
    this.toStream_.end(function () {
      if (self.toFilePath_) {
        // If we are writing the response to a file, delete the partial file.
        fs.unlink(self.toFilePath_, function () {
          callback();
        });
      } else {
        callback();
      }
    });

    // This line is important. Because of this the stream is ended only once
    // even if cleanupOnError_ is called multiple times.
    this.toStream_ = null;
  } else {
    process.nextTick(callback);
  }
};

function trainCase(header) {
  return _.startCase(header.toLowerCase()).replace(/ /g, '-');
}
