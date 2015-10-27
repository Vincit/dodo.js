var _ = require('lodash')
  , Promise = require('bluebird')
  , path = require('path')
  , fileUtils = require('../file/file-utils')
  , glob = require('glob');

/**
 * Helper function for compiling and copying the service template into a new service.
 */
module.exports = function(servicesDir, serviceName, database, createExampleFiles) {
  var templatesDir = __dirname + '/../service-template';
  var serviceDir = path.join(servicesDir, serviceName);

  return fileUtils
    .exists(path.join(servicesDir, serviceName))
    .then(function(exists) {
      if (exists) {
        throw new Error('service ' + serviceName + ' already exists');
      }
      return fileUtils.createDir(serviceDir);
    })
    .then(function() {
      return fileUtils.copy(templatesDir, serviceDir);
    })
    .then(function() {
      var allFiles = glob.sync(serviceDir + '/**/*.js*.tpl');
      if (!createExampleFiles) {
        var keep = _.filter(allFiles, function(filePath) {
          return filePath.toLowerCase().indexOf('example') === -1;
        });
        var remove = _.filter(allFiles, function(filePath) {
          return filePath.toLowerCase().indexOf('example') !== -1;
        });
        return Promise.all(_.map(remove, function(file) {
          return fileUtils.remove(file);
        })).return(keep);
      } else {
        return allFiles;
      }
    })
    .then(function(files) {
      return Promise.all(_.map(files, function(file) {
        return fileUtils.readFile(file).then(function(fileData) {
          var fileStr = fileData.toString();
          fileStr = _.template(fileStr)({
            serviceName: serviceName,
            database: database || serviceName
          });
          // Remove the template file and write the non-template file.
          return Promise.all([
            fileUtils.remove(file),
            fileUtils.writeFile(file.substring(0, file.length - '.tpl'.length), fileStr)
          ]);
        });
      }));
    });
};
