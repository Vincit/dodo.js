var _ = require('lodash')
  , Promise = require('bluebird')
  , CloudFileManager = require('./CloudFileManager')
  , classUtils = require('../../class-utils')
  , HTTPError = require('../../errors/HTTPError')
  , request = require('../../http/request')
  , Container = require('./Container')
  , File = require('./File');

function RackspaceCloudFileManager() {
  CloudFileManager.apply(this, arguments);
  this.config.region = this.config.region || 'DFW';
  this.config.timeout = this.config.timeout || 60 * 1000;
  this.loginPromise = null;
  this.cdnInfoPromises = {};
}

classUtils.inherits(RackspaceCloudFileManager, CloudFileManager);

/**
 * @override
 * @return {Promise}
 */
RackspaceCloudFileManager.prototype.getPublicUrl = function(containerName, fileName) {
  return this.cdnInfo_(containerName).then(function(info) {
    return info.cdnUrl + '/' + encodeURIComponent(fileName);
  });
};

/**
 * @override
 * @return {Promise}
 */
RackspaceCloudFileManager.prototype.getContainers = function() {
  return this
    .request_('get')
    .then(function(res) {
      return _.map(res.body, function(container) {
        return new Container(container.name);
      });
    });
};

/**
 * @override
 * @return {Promise}
 */
RackspaceCloudFileManager.prototype.createContainer = function(containerName) {
  var self = this;
  return this
    .request_('put', [containerName])
    .then(function() {
      return self.enableCdn_(containerName, !self.config.private);
    })
    .then(function() {
      return new Container(containerName);
    });
};

/**
 * @override
 * @return {Promise}
 */
RackspaceCloudFileManager.prototype.deleteContainer = function(containerName) {
  return this
    .request_('delete', [containerName])
    .then(function() {
      return null;
    });
};

/**
 * @override
 * @return {Promise}
 */
RackspaceCloudFileManager.prototype.getFiles = function(containerName) {
  return this.getFiles_(containerName, 10000);
};

/**
 * @override
 * @return {Promise}
 */
RackspaceCloudFileManager.prototype.uploadFile = function(filePath, containerName, fileName) {
  return this
    .request_('put', [containerName, fileName], function(req) {
      req.fromFile(filePath);
    })
    .then(function() {
      return new File(fileName);
    });
};

/**
 * @override
 * @return {Promise}
 */
RackspaceCloudFileManager.prototype.uploadData = function(data, containerName, fileName) {
  return this
    .request_('put', [containerName, fileName], function(req) {
      req.body(data);
    })
    .then(function() {
      return new File(fileName);
    });
};

/**
 * @override
 * @return {Promise}
 */
RackspaceCloudFileManager.prototype.deleteFile = function(containerName, fileName) {
  return this
    .request_('delete', [containerName, fileName])
    .then(function() {
      return null;
    });
};

/**
 * @private
 * @return {Promise}
 */
RackspaceCloudFileManager.prototype.getFiles_ = function(containerName, limit, firstFileName) {
  var allFiles = [];

  return this
    .request_('get', [containerName], function(req) {
      if (limit) {
        req.query('limit', limit);
      }
      if (firstFileName) {
        req.query('marker', firstFileName);
      }
    })
    .then(function(res) {
      _.forEach(res.body, function(file) {
        allFiles.push(new File(file.name));
      });

      if (res.body.length === limit) {
        // Got 'limit' results. There may be more.
        return self.getFiles_(containerName, limit, _.last(res.body).name);
      } else {
        return allFiles;
      }
    });
};

/**
 * @private
 * @return {Promise}
 */
RackspaceCloudFileManager.prototype.enableCdn_ = function(containerName, enable) {
  return this
    .cdnRequest_('put', [containerName], function(req) {
      req.header('X-Cdn-Enabled', enable ? 'True' : 'False');
    })
    .then(function(res) {
      return {
        cdnUrl: res.headers['x-cdn-uri'],
        cdnSslUrl: res.headers['x-cdn-ssl-uri']
      };
    });
};

/**
 * @private
 * @return {Promise}
 */
RackspaceCloudFileManager.prototype.cdnInfo_ = function(containerName) {
  var self = this;

  if (!this.cdnInfoPromises[containerName]) {
    this.cdnInfoPromises[containerName] = this
      .cdnRequest_('get')
      .then(function(res) {
        var info = _.find(res.body, {name: containerName});

        if (!info) {
          var error = new Error("Invalid response from cdnRequest.");
          error.containerName = containerName;
          error.cdnResponse = res;
          throw error;
        }

        return {
          cdnUrl: info.cdn_uri,
          cdnSslUrl: info.cdn_ssl_uri
        };
      })
      .catch(function (err) {
        self.cdnInfoPromises[containerName] = null;
        throw err;
      });
  }

  return this.cdnInfoPromises[containerName];
};

/**
 * @private
 * @return {Promise}
 */
RackspaceCloudFileManager.prototype.ensureLogin_ = function() {
  if (!this.loginPromise) {
    this.loginPromise = this.login_();
  }
  return this.loginPromise;
};

/**
 * @private
 */
RackspaceCloudFileManager.prototype.resetLogin_ = function() {
  // Don't reset a running login.
  if (this.loginPromise && !this.loginPromise.isPending()) {
    this.loginPromise = null;
  }
};

/**
 * @private
 * @return {Promise}
 */
RackspaceCloudFileManager.prototype.login_ = function() {
  var url = 'https://identity.api.rackspacecloud.com/v2.0/tokens';
  var self = this;
  var body = {
    "auth": {
      "RAX-KSKEY:apiKeyCredentials": {
        "username": this.config.accessKey,
        "apiKey": this.config.secretKey
      }
    }
  };

  return request
    .post(url)
    .body(body)
    .timeout(this.config.timeout)
    .then(function (res) {
      if (res.statusCode < 400) {
        return res;
      } else {
        throw createError_(res, 'login');
      }
    })
    .then(function (res) {
      var cloudFileServices = _.find(res.body.access.serviceCatalog, {name: 'cloudFiles'});
      var cdnCloudFileServices = _.find(res.body.access.serviceCatalog, {name: 'cloudFilesCDN'});

      var endpoint = _.find(cloudFileServices.endpoints, {region: self.config.region});
      var cdnEndpoint = _.find(cdnCloudFileServices.endpoints, {region: self.config.region});

      if (!endpoint || !cdnEndpoint) {
        throw new Error('invalid region "' + self.config.region + '"');
      }

      return {
        token: res.body.access.token.id,
        endpoint: endpoint,
        cdnEndpoint: cdnEndpoint
      };
    })
    .catch(function(err) {
      self.resetLogin_();
      throw err;
    });
};

/**
 * @private
 * @return {Promise}
 */
RackspaceCloudFileManager.prototype.request_ = function (method, path, modifyRequest) {
  return this.baseRequest_({
    path: path,
    method: method,
    endpoint: 'endpoint',
    modifyRequest: modifyRequest
  });
};

/**
 * @private
 * @return {Promise}
 */
RackspaceCloudFileManager.prototype.cdnRequest_ = function (method, path, modifyRequest) {
  return this.baseRequest_({
    path: path,
    method: method,
    endpoint: 'cdnEndpoint',
    modifyRequest: modifyRequest
  });
};

/**
 * @private
 * @return {Promise}
 */
RackspaceCloudFileManager.prototype.baseRequest_ = function (opt) {
  var self = this;

  opt.path = opt.path || [];
  opt.modifyRequest = opt.modifyRequest || _.noop;
  opt.loginAttempts = opt.loginAttempts || 0;

  return this.ensureLogin_()
    .then(function (session) {
      var url = session[opt.endpoint].publicURL + '/' + _.map(opt.path, encodeURIComponent).join('/');
      var req = request[opt.method](url).header('X-Auth-Token', session.token).timeout(self.config.timeout);
      opt.modifyRequest(req);
      return req;
    })
    .then(function (res) {
      if (res.statusCode < 400) {
        return res;
      } else {
        throw createError_(res, _.omit(opt, 'modifyRequest'));
      }
    })
    .catch(HTTPError, function (error) {
      if (error.statusCode === 401 && opt.loginAttempts < 5) {
        opt.loginAttempts += 1;
        // Reset login an attempt the same request again. baseRequest_() calls ensureLogin_()
        // which sends a new login request since we called resetLogin_().
        self.resetLogin_();
        return self.baseRequest_(opt);
      } else {
        throw error;
      }
    });
};

/**
 * @private
 * @return {HTTPError}
 */
function createError_(res, extraInfo) {
  return new HTTPError(res.statusCode, {
    body: Buffer.isBuffer(res.body) ? res.body.toString() : res.body,
    headers: res.headers,
    extraInfo: extraInfo
  });
}

module.exports = RackspaceCloudFileManager;
