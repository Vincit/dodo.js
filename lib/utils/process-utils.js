var _ = require('lodash')
  , Promise = require('bluebird')
  , childProcess = require('child_process');

module.exports = {
  /**
   * Kill process and all its descendant processes.
   *
   * @param {Number} pid
   *    Process identifier.
   *
   * @returns {Promise}
   */
  killTree: function (pid) {
    if (/^win/.test(process.platform)) {
      return killTreeWin(pid);
    } else {
      return killTreeUnix(pid);
    }
  },
  /**
   * Promisified shell command execution.
   *
   * @param {String} command
   *    The command to execute.
   *
   * @param {Array.<*>} params
   *    Command parameters.
   *
   * @param {Object} options
   *    node.js child_process.spawn() options object.
   *
   * @returns {Promise}
   */
  exec: function(command, params, options) {
    return new Promise(function (resolve, reject) {
      childProcess.exec([command].concat(params).join(' '), options || {}, function (err, stdout, stderr) {
        if (err) {
          reject(err);
        } else {
          resolve({
            stdout: stdout,
            stderr: stderr
          });
        }
      });
    });
  }
};

function killTreeWin(pid) {
  return module.exports.exec('taskkill', ['/PID', pid, '/T', '/F']).return(undefined);
}

function killTreeUnix(pid) {
  pid = parseInt(pid, 10);

  return module.exports.exec('ps', ['-o', 'ppid,pid']).then(function (output) {
    var children = {};

    _.each(output.stdout.split('\n'), function (row) {
      var parts = /(\d+)\s*(\d+)/.exec(row);
      if (parts) {
        var parentPid = parseInt(parts[1], 10);
        var childPid = parseInt(parts[2], 10);
        if (!_.isNaN(parentPid) && !_.isNaN(childPid)) {
          children[parentPid] = children[parentPid] || [];
          children[parentPid].push(childPid);
        }
      }
    });

    function kill(pid) {
      _.each(children[pid], function (child) {
        kill(child);
      });
      try {
        process.kill(pid, 'SIGTERM');
      } catch (err) {
        // Ignore 'process not found' error.
        if (err.code !== 'ESRCH') {
          throw err;
        }
      }
    }

    kill(pid);
  });
}
