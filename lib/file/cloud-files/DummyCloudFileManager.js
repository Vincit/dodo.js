"use strict";

var _ = require('lodash')
  , path = require('path')
  , Promise = require('bluebird')
  , File = require('./File')
  , Container = require('./Container')
  , fileUtils = require('../file-utils')
  , classUtils = require('../../class-utils')
  , CloudFileManager = require('./CloudFileManager');

/**
 * Dummy manager that stores files to local directories under `config.dummyFolder`.
 *
 * @param {Object} config
 * @param {String} config.dummyFolder
 *    Absolute path to the folder to which the files are stored.
 *
 * @param {String} config.dummyPublicUrl
 *    If given the public URL returned by getPublicUrl() method has the following
 *    format: `<config.dummyPublicUrl>/<container name>/<file name>`. Otherwise the
 *    URLs have the format: `<config.dummyFolder>/<container name>/<file name>`.
 *
 * @constructor
 * @extends CloudFileManager
 */
function DummyCloudFileManager(config) {
  CloudFileManager.call(this, config);
}

classUtils.inherits(DummyCloudFileManager, CloudFileManager);

/**
 * @override
 * @return {Promise}
 */
DummyCloudFileManager.prototype.getPublicUrl = function(containerName, fileName) {
  if (!!this.config.dummyPublicUrl) {
    return Promise.resolve(this.config.dummyPublicUrl + '/' + containerName + '/' + fileName);
  } else {
    return Promise.resolve(this.filePath_(containerName, fileName));
  }
};

/**
 * @override
 * @return {Promise}
 */
DummyCloudFileManager.prototype.getContainers = function() {
  return fileUtils.readDir(this.config.dummyFolder).map(function (name) {
    return new Container(name);
  });
};

/**
 * @override
 * @return {Promise}
 */
DummyCloudFileManager.prototype.createContainer = function(containerName) {
  return fileUtils.createDir(this.containerDir_(containerName)).then(function () {
    return new Container(containerName);
  });
};

/**
 * @override
 * @return {Promise}
 */
DummyCloudFileManager.prototype.deleteContainer = function(containerName) {
  return fileUtils.remove(this.containerDir_(containerName)).then(function () {
    return null;
  });
};

/**
 * @override
 * @return {Promise}
 */
DummyCloudFileManager.prototype.getFiles = function(containerName) {
  return fileUtils.readDir(this.containerDir_(containerName)).map(function (name) {
    return new File(name);
  });
};

/**
 * @override
 * @return {Promise}
 */
DummyCloudFileManager.prototype.uploadFile = function(filePath, containerName, fileName) {
  return fileUtils.copy(filePath, this.filePath_(containerName, fileName)).then(function () {
    return new File(fileName);
  });
};

/**
 * @override
 * @return {Promise}
 */
DummyCloudFileManager.prototype.uploadData = function(data, containerName, fileName) {
  return fileUtils.writeFile(this.filePath_(containerName, fileName), data).then(function () {
    return new File(fileName);
  });
};

/**
 * @override
 * @return {Promise}
 */
DummyCloudFileManager.prototype.deleteFile = function(containerName, fileName) {
  return fileUtils.remove(this.filePath_(containerName, fileName)).then(function () {
    return null;
  });
};

/**
 * @private
 */
DummyCloudFileManager.prototype.containerDir_ = function (containerName) {
  return path.join(this.config.dummyFolder, containerName);
};

/**
 * @private
 */
DummyCloudFileManager.prototype.filePath_ = function (containerName, fileName) {
  return path.join(this.containerDir_(containerName), fileName);
};

module.exports = DummyCloudFileManager;
