var timeTable = {};

module.exports = {

  time: function(id, dontReset) {
    if (!timeTable[id]) {
      timeTable[id] = {
        start: null,
        count: 0,
        sum: 0
      }
    }
    if (!dontReset) {
      timeTable[id].count = 0;
      timeTable[id].sum = 0;
    }
    timeTable[id].start = process.hrtime();
  },

  timeEnd: function(id) {
    var diff = process.hrtime(timeTable[id].start);
    var millis = diff[0] * 1e3 + diff[1] / 1e6;
    timeTable[id].count++;
    timeTable[id].sum += millis;
    console.log(id, millis, timeTable[id].sum / timeTable[id].count);
  }

};