/**
 * Mock handler which just records log calls and provide API to check
 * make log calls and flush them.
 */
module.export = MockHandler;

// es6 module compatibility
MockHandler.default = MockHandler;

function MockHandler() {
  this.logs = [];
}

MockHandler.prototype.log = function () {
  this.logs.push(arguments);
};

MockHandler.prototype.flush = function () {
  this.logs.splice(0, this.logs.length);
};
