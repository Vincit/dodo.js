var fs = require('fs')
  , fsExtra = require('fs-extra')
  , Promise = require('bluebird')
  , glob = require('glob')
  , mv = require('mv');

module.exports = {
  /**
   * @param {String} filePath
   * @returns {Promise}
   */
  exists: function(filePath) {
    return new Promise(function(resolve) {
      fs.exists(filePath, function (exists) {
        resolve(exists);
      });
    });
  },

  /**
   * @param {String} filePath
   * @returns {Promise}
   */
  stat: function(filePath) {
    return new Promise(function(resolve, reject) {
      fs.stat(filePath, function (err, stat) {
        if (err) {
          reject(err);
        } else {
          resolve(stat);
        }
      });
    });
  },

  /**
   * Equal to unix command `mkdir -p dirPath`.
   *
   * @param {String} dirPath
   * @returns {Promise}
   */
  createDir: function(dirPath) {
    return new Promise(function(resolve, reject) {
      fsExtra.mkdirs(dirPath, function (err) {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  },

  /**
   * @param {String} filePath
   * @returns {Promise}
   */
  readFile: function(filePath) {
    return new Promise(function(resolve, reject) {
      fs.readFile(filePath, function (err, data) {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    });
  },

  /**
   * @param {String} filePath
   * @param {String|Buffer=} data
   * @returns {Promise}
   */
  writeFile: function(filePath, data) {
    return new Promise(function(resolve, reject) {
      fs.writeFile(filePath, data || '', function (err) {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  },

  /**
   * @param {String} dirPath
   * @returns {Promise}
   */
  readDir: function(dirPath) {
    return new Promise(function(resolve, reject) {
      fs.readdir(dirPath, function (err, files) {
        // 'ENOENT' means that the directory doesn't exist.
        if (err && err.code !== 'ENOENT') {
          reject(err);
        } else {
          resolve(files || []);
        }
      });
    });
  },

  /**
   * @param {String} source
   * @param {String} destination
   * @returns {Promise}
   */
  moveFile: function(source, destination) {
    return new Promise(function(resolve, reject) {
      mv(source, destination, {mkdirp: true}, function (err) {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  },

  /**
   * Equal to unix command `rm -rf path`.
   *
   * @param {String} path
   * @returns {Promise}
   */
  remove: function(path) {
    return new Promise(function (resolve, reject) {
      fsExtra.remove(path, function (err) {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  },

  /**
   * Equal to unix command `cp -r source destination`.
   *
   * @param {String} source
   * @param {String} destination
   * @returns {Promise}
   */
  copy: function(source, destination) {
    return new Promise(function(resolve, reject) {
      fsExtra.copy(source, destination, function (err) {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  },

  /**
   * Promisified node-glob
   *
   * https://github.com/isaacs/node-glob
   */
  glob: function (pattern, options) {
    return new Promise(function (resolve, reject) {
      glob(pattern, options, function (err, results) {
        if (err) {
          reject(err);
        } else {
          resolve(results);
        }
      });
    });
  }
};
