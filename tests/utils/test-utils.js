var testUtils = require('../../lib/utils/test-utils');
var expect = require('chai').expect;

describe('test utils', function () {

  describe('expectPartialEqual', function () {

    it('should throw if both inputs are not arrays or objects', function () {

      expect(function () {
        testUtils.expectPartialEqual(1, [{a: 1}]);
      }).to.throw(Error);

      expect(function () {
        testUtils.expectPartialEqual(1, '1');
      }).to.throw(Error);

      expect(function () {
        testUtils.expectPartialEqual({0: 'a', length: 1}, ['a']);
      }).to.throw(Error);

      expect(function () {
        testUtils.expectPartialEqual(['a'], {0: 'a', length: 1});
      }).to.throw(Error);

    });

    it('should not throw for two equal objects', function () {

      expect(function () {
        testUtils.expectPartialEqual({a: 1}, {a: 1});
      }).to.not.throw(Error);

      expect(function () {
        testUtils.expectPartialEqual({a: {b: 2}}, {a: {b: 2}});
      }).to.not.throw(Error);

    });

    it('should not throw if first object partially equals second object', function () {

      expect(function () {
        testUtils.expectPartialEqual({a: 1, b: 2, c: 3}, {a: 1});
      }).to.not.throw(Error);

      expect(function () {
        testUtils.expectPartialEqual({a: 1, b: 2, c: [{a: 1}, true]}, {b: 2, c: [{a: 1}, true]});
      }).to.not.throw(Error);

    });

    it('should throw if two objects have different values', function () {

      expect(function () {
        testUtils.expectPartialEqual({a: 1}, {a: 2});
      }).to.throw(Error);

      expect(function () {
        testUtils.expectPartialEqual({a: 1, b: 2, c: 3}, {a: 1, b: 'wat'});
      }).to.throw(Error);

      expect(function () {
        testUtils.expectPartialEqual({a: 1, b: 2, c: [{a: 1}, true]}, {b: 2, c: [{a: 1}, false]});
      }).to.throw(Error);

      expect(function () {
        testUtils.expectPartialEqual({a: {b: 2}}, {a: {b: 3}});
      }).to.throw(Error);

      expect(function () {
        testUtils.expectPartialEqual({a: 1}, {a: {b: 3}});
      }).to.throw(Error);

    });

    it('should not throw for two equal arrays', function () {

      expect(function () {
        testUtils.expectPartialEqual([{a: 1}, {a: 2}], [{a: 1}, {a: 2}]);
      }).to.not.throw(Error);

      expect(function () {
        testUtils.expectPartialEqual([{a: {b: 2}}, {a: {b: 3}}], [{a: {b: 2}}, {a: {b: 3}}]);
      }).to.not.throw(Error);

    });

    it('should not throw if objects in first array partially equals objects in second array', function () {

      expect(function () {
        testUtils.expectPartialEqual([{a: 1, b: 2}, {a: 3, b: 4}], [{a: 1}, {b: 4}]);
      }).to.not.throw(Error);

      expect(function () {
        testUtils.expectPartialEqual([{a: 1, b: {q: 2}}, {a: 3, b: {q: 4}}], [{a: 1}, {b: {q: 4}}]);
      }).to.not.throw(Error);

    });

    it('should throw if arrays have different lengths', function () {

      expect(function () {
        testUtils.expectPartialEqual([{a: 1}, {a: 2}], [{a: 1}]);
      }).to.throw(Error);

      expect(function () {
        testUtils.expectPartialEqual([{a: 1}], [{a: 1}, {a: 2}]);
      }).to.throw(Error);

    });

    it('should throw if objects in arrays have different values', function () {

      expect(function () {
        testUtils.expectPartialEqual([{a: 1}, {a: 2}], [{a: 1}, {a: 3}]);
      }).to.throw(Error);

      expect(function () {
        testUtils.expectPartialEqual([{a: 1}, {a: 2}, {a: 3}], [{a: 1}, {a: 3}]);
      }).to.throw(Error);

    });

  });

});
