/**
 * Mock handler which just records log calls and provide API to check
 * make log calls and flush them.
 */
module.exports = MockHandler;

var evaluateLogRowArgs = require('./evaluate-log-row-args');

// es6 module compatibility
MockHandler.default = MockHandler;

function MockHandler() {
  this.logs = [];
}

MockHandler.prototype.log = function () {
  var evaluatedArgs = evaluateLogRowArgs(arguments);
  this.logs.push(evaluatedArgs);
};

MockHandler.prototype.flush = function () {
  this.logs.splice(0, this.logs.length);
};
