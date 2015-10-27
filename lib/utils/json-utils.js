/**
 * Fast clone for pure JSON objects.
 */
module.exports.deepClone = function deepClone(json) {
  if (json === null || json === void 0) {
    return json;
  }
  if (Array.isArray(json)) {
    var arr = new Array(json.length);
    for (var i = 0, l = json.length; i < l; ++i) {
      arr[i] = deepClone(json[i]);
    }
    return arr;
  } else if (typeof json === 'object') {
    var obj = {};
    for (var key in json) {
      if (json.hasOwnProperty(key)) {
        obj[key] = deepClone(json[key]);
      }
    }
    return obj;
  } else {
    return json;
  }
};

/**
 * Fast deep equality test for pure JSON objects.
 */
module.exports.isEqual = function isEqual(left, right) {
  if (left === right) {
    return true;
  }

  // undefined and null are considered equal.
  if ((left === null || left === void 0) && (right === null || right === void 0)) {
    return true;
  }

  // null and undefined are not equal to anything else.
  if ((left === null || left === void 0) || (right === null || right === void 0)) {
    return false;
  }

  var leftIsArr = Array.isArray(left);
  var rightIsArr = Array.isArray(right);

  if (leftIsArr || rightIsArr) {
    if (!leftIsArr || !rightIsArr || left.length !== right.length) {
      return false;
    }
    for (var i = 0, l = left.length; i < l; ++i) {
      if (!isEqual(left[i], right[i])) {
        return false;
      }
    }
    return true;
  } else if (typeof left === 'object' && typeof right === 'object') {
    var leftCount = 0;
    for (var key in left) {
      var leftHasOwn = left.hasOwnProperty(key);
      var rightHasOwn = right.hasOwnProperty(key);
      if (leftHasOwn && rightHasOwn) {
        ++leftCount;
        if (!isEqual(left[key], right[key])) {
          return false;
        }
      } else if (leftHasOwn || rightHasOwn) {
        return false;
      }
    }
    var rightCount = 0;
    for (var key in right) {
      if (right.hasOwnProperty(key)) {
        rightCount++;
      }
    }
    return leftCount === rightCount;
  } else {
    return false;
  }
};
