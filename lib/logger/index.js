'use strict';

var LogHub = require('./log-hub')

// ES6 compatibility (is this nice way to do it?)
LogHub.default = LogHub;

module.exports = LogHub;
