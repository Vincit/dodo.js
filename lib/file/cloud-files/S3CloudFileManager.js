var _ = require('lodash')
  , fs = require('fs')
  , aws = require('aws-sdk')
  , Promise = require('bluebird')
  , CloudFileManager = require('./CloudFileManager')
  , Container = require('./Container')
  , File = require('./File')
  , classUtils = require('../../class-utils');

/**
 * @extends CloudFileManager
 * @constructor
 */
function S3CloudFileManager() {
  CloudFileManager.apply(this, arguments);
  this.config.region = this.config.region || 'us-west-2';
  this.config.timeout = this.config.timeout || 60 * 1000;
  this.s3 = new aws.S3({
    accessKeyId: this.config.accessKey,
    secretAccessKey: this.config.secretKey,
    region: this.config.region,
    httpOptions: {
      timeout: this.config.timeout
    }
  });
}

classUtils.inherits(S3CloudFileManager, CloudFileManager);

/**
 * @override
 * @return {Promise}
 */
S3CloudFileManager.prototype.getPublicUrl = function(containerName, fileName) {
  return Promise.resolve('https://s3-'
    + this.config.region + '.amazonaws.com/'
    + encodeURIComponent(containerName) + '/'
    + encodeURIComponent(fileName));
};

/**
 * @override
 * @return {Promise}
 */
S3CloudFileManager.prototype.getContainers = function() {
  var self = this;
  return new Promise(function(resolve, reject) {
    self.s3.listBuckets(function(err, response) {
      if (err) {
        reject(err);
      } else {
        resolve(_.map(response.Buckets, function(bucket) {
          return new Container(bucket.Name);
        }));
      }
    });
  });
};

/**
 * @override
 * @return {Promise}
 */
S3CloudFileManager.prototype.createContainer = function(containerName) {
  var self = this;
  return new Promise(function(resolve, reject) {
    self.s3.createBucket({Bucket: containerName}, function(err) {
      // It is not an error if we create a bucket that already exists.
      if (err && err.code !== 'BucketAlreadyOwnedByYou') {
        reject(err);
      } else {
        return resolve(new Container(containerName));
      }
    });
  });
};

/**
 * @override
 * @return {Promise}
 */
S3CloudFileManager.prototype.deleteContainer = function(containerName) {
  var self = this;
  return new Promise(function(resolve, reject) {
    self.s3.deleteBucket({Bucket: containerName}, function(err) {
      if (err && err.statusCode !== 404) {
        reject(err);
      } else {
        return resolve();
      }
    });
  });
};

/**
 * @return {Promise}
 */
S3CloudFileManager.prototype.getFiles = function(containerName) {
  var self = this;
  var allFiles = [];

  function getNext(firstFileName) {
    return getStartingFrom(firstFileName).then(function(result) {
      _.each(result.Contents, function(object) {
        allFiles.push(new File(object.Key));
      });
      if (result.IsTruncated) {
        return getNext(result.NextMarker);
      } else {
        return allFiles;
      }
    });
  }

  function getStartingFrom(firstFileName) {
    return new Promise(function(resolve, reject) {
      var options = {
        Bucket: containerName
      };
      if (firstFileName) {
        options.Marker = firstFileName;
      }
      self.s3.listObjects(options, function(err, response) {
        if (err) {
          reject(err);
        } else {
          resolve(response);
        }
      });
    });
  }

  return getNext();
};

/**
 * @override
 * @return {Promise}
 */
S3CloudFileManager.prototype.uploadFile = function(filePath, containerName, fileName) {
  var self = this;
  return new Promise(function(resolve, reject) {
    self.s3.putObject({
      Bucket: containerName,
      Key: fileName,
      Body: fs.createReadStream(filePath),
      ACL: self.config.private ? 'private' : 'public-read'
    }, function(err) {
      if (err) {
        reject(err);
      } else {
        return resolve(new File(fileName));
      }
    });
  });
};

/**
 * @override
 * @return {Promise}
 */
S3CloudFileManager.prototype.uploadData = function(data, containerName, fileName) {
  var self = this;
  return new Promise(function(resolve, reject) {
    self.s3.putObject({
      Bucket: containerName,
      Key: fileName,
      Body: data,
      ACL: self.config.private ? 'private' : 'public-read'
    }, function(err) {
      if (err) {
        reject(err);
      } else {
        return resolve(new File(fileName));
      }
    });
  });
};

/**
 * @override
 * @return {Promise}
 */
S3CloudFileManager.prototype.deleteFile = function(containerName, fileName) {
  var self = this;
  return new Promise(function(resolve, reject) {
    self.s3.deleteObject({Bucket: containerName, Key: fileName}, function(err) {
      if (err && err.statusCode !== 404) {
        reject(err);
      } else {
        return resolve();
      }
    });
  });
};

module.exports = S3CloudFileManager;
