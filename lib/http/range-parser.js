var _ = require('lodash');

function RangeParser(req, res) {
  this.req = req;
  this.res = res;
  this.start = null;
  this.end = null;
  this.total = null;
  this.isValid = false;
}

RangeParser.prototype.parseRange = function () {
  var range = this.req.headers['range'];
  var parts = /resources=(\d+)-(\d+)/.exec(range) || [];
  this.start = parseInt(parts[1], 10);
  this.end = parseInt(parts[2], 10);
  this.isValid = !_.isNaN(this.start) && !_.isNaN(this.end);
};

RangeParser.prototype.parseContentRange = function () {
  var range = this.res.headers['content-range'];
  var parts = /resources (\d+)-(\d+)\/(\d+)/.exec(range) || [];
  this.start = parseInt(parts[1], 10);
  this.end = parseInt(parts[2], 10);
  this.total = parseInt(parts[3], 10);
  this.isValid = !_.isNaN(this.start) && !_.isNaN(this.end) && !_.isNaN(this.total);
};

RangeParser.prototype.writeContentRange = function (total) {
  this.res.set('content-range', 'resources ' + this.start + '-' + this.end + '/' + total);
};

RangeParser.prototype.writeRange = function () {
  this.req.set('range', 'resources=' + this.start + '-' + this.end);
};

module.exports = function (req, res) {
  var parser = new RangeParser(req, res);
  parser.parseRange();
  if (!parser.isValid) {
    return null;
  }
  return parser;
};
