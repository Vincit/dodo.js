"use strict";

var _ = require('lodash');

/**
 * Base class for cloud file managers.
 *
 * @param {{provider:String, accessKey:String, secretKey:String, region:String}} config
 * @constructor
 */
function CloudFileManager(config) {
  this.config = config;
}

/**
 * Returns the public URL for a file in a container.
 *
 * The URL only works if `config.private` is false (the default).
 *
 * @return {Promise}
 */
CloudFileManager.prototype.getPublicUrl = function(containerName, fileName) {
  _.noop(containerName, fileName);
  throw new Error(this.constructor.name + '.getContainers() not implemented');
};

/**
 * Returns a list of containers.
 *
 * @return {Promise}
 */
CloudFileManager.prototype.getContainers = function() {
  throw new Error(this.constructor.name + '.getContainers() not implemented');
};

/**
 * Creates a new container.
 *
 * @return {Promise}
 */
CloudFileManager.prototype.createContainer = function(containerName) {
  _.noop(containerName);
  throw new Error(this.constructor.name + '.createContainer() not implemented');
};

/**
 * Deletes a container.
 *
 * @return {Promise}
 */
CloudFileManager.prototype.deleteContainer = function(containerName) {
  _.noop(containerName);
  throw new Error(this.constructor.name + '.deleteContainer() not implemented');
};

/**
 * Returns all the files in a container.
 *
 * @return {Promise}
 */
CloudFileManager.prototype.getFiles = function(containerName) {
  _.noop(containerName);
  throw new Error(this.constructor.name + '.getFiles() not implemented');
};

/**
 * Uploads a file to a container.
 *
 * @return {Promise}
 */
CloudFileManager.prototype.uploadFile = function(filePath, containerName, fileName) {
  _.noop(filePath, containerName, fileName);
  throw new Error(this.constructor.name + '.uploadFile() not implemented');
};

/**
 * Uploads data as a file to a container.
 *
 * @return {Promise}
 */
CloudFileManager.prototype.uploadData = function(data, containerName, fileName) {
  _.noop(data, containerName, fileName);
  throw new Error(this.constructor.name + '.uploadData() not implemented');
};

/**
 * Deletes a file from a container.
 *
 * @return {Promise}
 */
CloudFileManager.prototype.deleteFile = function(containerName, fileName) {
  _.noop(containerName, fileName);
  throw new Error(this.constructor.name + '.deleteFile() not implemented');
};

module.exports = CloudFileManager;
