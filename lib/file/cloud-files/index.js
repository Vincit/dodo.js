var RackspaceCloudFileManager = require('./RackspaceCloudFileManager')
  , DummyCloudFileManager = require('./DummyCloudFileManager')
  , S3CloudFileManager = require('./S3CloudFileManager');

/**
 * Creates an object of class `CloudFileManager` that can be used to manage cloud files.
 *
 * Provides an identical interface for working with different cloud providers. Currently only rackspace and
 * amazon providers are supported. By default all uploaded files are public and can be accessed by anyone
 * through URL returned by `cloudFileManager.getPublicUrl(containerName, fileName)`. If you want the files
 * not to be public, set the `options.private` flag to `true`.
 *
 * ```js
 * var cloudFiles = require('nails/lib/file/cloud-files');
 *
 * var rackspace = cloudFiles({
 *   provider: 'rackspace',
 *   accessKey: 'rackspace access key',
 *   secretKey: 'rackspace secret key',
 *   region: 'DFW',
 *   private: false
 * });
 *
 * var amazon = cloudFiles({
 *   provider: 'amazon',
 *   accessKey: 'aws access key id',
 *   secretKey: 'aws secret key',
 *   region: 'us-west-2',
 *   private: false
 * });
 * ```
 *
 * @param {{provider:String, accessKey:String, secretKey:String, region:String}} config
 * @returns {CloudFileManager}
 */
module.exports = function(config) {
  switch (config.provider) {
    case 'dummy':
      return new DummyCloudFileManager(config);
    case 'rackspace':
      return new RackspaceCloudFileManager(config);
    case 's3':
    case 'aws':
    case 'amazon':
      return new S3CloudFileManager(config);
    default:
      throw new Error('unsupported provider "' + config.provider + '"');
  }
};
