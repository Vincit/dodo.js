var spawn = require('child_process').spawn;
var Promise = require('bluebird');
var _ = require('lodash');

// Run the command in a bourne-compatible shell to get shebang lines interpreted correctly
// Note: child_process.exec almost does what we want, but would use sucky cmd.exe in windows
var SHELL = 'sh';

function runCommandInPromise(command, parameters, spawnOptions, options) {
  if (options && !options.silent) {
    console.log("Running:", command, JSON.stringify(parameters), JSON.stringify(spawnOptions));
  }
  return new Promise(function (resolve, reject) {
    var child = spawn(SHELL, ['-c', command + ' ' + parameters.join(' ')], spawnOptions);
    child.on('close', function (code) {
      if (code === 0) {
        resolve(child);
      } else {
        reject(new Error('process exited with failure status ' + code));
      }
    });
    child.on('error', function (err) {
      reject(err);
      child.removeAllListeners();
      child.on('error', _.noop); // avoid crashes from further uncaught errors
    });
  });
}

module.exports = runCommandInPromise;
