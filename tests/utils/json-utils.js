var jsonUtils = require('../../lib/utils/json-utils');
var expect = require('chai').expect;

describe('json utils', function () {

  it('should work for primitives', function () {

    expect(jsonUtils.isEqual(1, 1)).to.equal(true);
    expect(jsonUtils.isEqual(true, true)).to.equal(true);
    expect(jsonUtils.isEqual('foo', 'foo')).to.equal(true);
    expect(jsonUtils.isEqual(null, null)).to.equal(true);
    expect(jsonUtils.isEqual(undefined, null)).to.equal(true);
    expect(jsonUtils.isEqual(undefined, undefined)).to.equal(true);

    expect(jsonUtils.isEqual(1, 2)).to.equal(false);
    expect(jsonUtils.isEqual(true, false)).to.equal(false);
    expect(jsonUtils.isEqual('foo', 'bar')).to.equal(false);

    expect(jsonUtils.isEqual(1, true)).to.equal(false);
    expect(jsonUtils.isEqual(1, 'foo')).to.equal(false);
    expect(jsonUtils.isEqual(1, null)).to.equal(false);
    expect(jsonUtils.isEqual(1, undefined)).to.equal(false);

    expect(jsonUtils.isEqual(true, 1)).to.equal(false);
    expect(jsonUtils.isEqual('foo', 1)).to.equal(false);
    expect(jsonUtils.isEqual(null, 1)).to.equal(false);
    expect(jsonUtils.isEqual(undefined, 1)).to.equal(false);

    expect(jsonUtils.isEqual(true, 'true')).to.equal(false);

  });

  it('should work for object literals', function () {

    expect(jsonUtils.isEqual({a: 1, b: 'foo', c: true, d: null}, {b: 'foo', a: 1, c: true, d: undefined})).to.equal(true);
    expect(jsonUtils.isEqual({a: 1, b: 'foo', c: true, d: null}, {b: 'foo', a: 1, c: true})).to.equal(false);
    expect(jsonUtils.isEqual({a: 1, b: 'foo', c: true}, {b: 'foo', a: '1', c: true})).to.equal(false);

    expect(jsonUtils.isEqual({a: 1, b: 'foo', c: true}, {a: 1, b: 'foo'})).to.equal(false);
    expect(jsonUtils.isEqual({a: 1, b: 'foo'}, {a: 1, b: 'foo', c: true})).to.equal(false);

    expect(jsonUtils.isEqual({a: 1, b: 'foo', c: true}, [])).to.equal(false);
    expect(jsonUtils.isEqual([], {a: 1, b: 'foo', c: true})).to.equal(false);

    expect(jsonUtils.isEqual({a: 1, b: 'foo', c: true}, null)).to.equal(false);
    expect(jsonUtils.isEqual(null, {a: 1, b: 'foo', c: true})).to.equal(false);

    expect(jsonUtils.isEqual({a: 1, b: 'foo', c: true}, 1)).to.equal(false);
    expect(jsonUtils.isEqual(1, {a: 1, b: 'foo', c: true})).to.equal(false);

    expect(jsonUtils.isEqual({a: 1, b: 'foo', c: true}, false)).to.equal(false);
    expect(jsonUtils.isEqual(false, {a: 1, b: 'foo', c: true})).to.equal(false);

  });

  it('should work for arrays', function () {

    expect(jsonUtils.isEqual([1, 'foo', 'bar', null, undefined], [1, 'foo', 'bar', undefined, null])).to.equal(true);
    expect(jsonUtils.isEqual([1, 'foo', 'bar', null, undefined], [1, 'foo', 'bar', undefined, 'null'])).to.equal(false);
    expect(jsonUtils.isEqual([11, 'foo', 'bar', null, undefined], [1, 'foo', 'bar', undefined, null])).to.equal(false);

    expect(jsonUtils.isEqual([1, 'foo', 'bar', null], [1, 'foo', 'bar', undefined, null])).to.equal(false);
    expect(jsonUtils.isEqual([1, 'foo', 'bar', null, undefined], [1, 'foo', undefined, null])).to.equal(false);

  });

  it('should not care about constructor equality', function () {
    function Class() {
      this.a = 10;
      this.b = 100;
    }
    var c = new Class();

    expect(jsonUtils.isEqual(c, {b: 100, a: 10})).to.equal(true);
    expect(jsonUtils.isEqual({b: 100, a: 10}, c)).to.equal(true);
  });

  it('should ignore `notOwn` properties', function () {
    function Class() {
      this.a = 10;
      this.b = 100;
    }
    Class.prototype.c = 1000;
    var c = new Class();

    expect(c.c).to.equal(1000);
    expect(jsonUtils.isEqual(c, {a: 10, b: 100})).to.equal(true);
    expect(jsonUtils.isEqual({a: 10, b: 100}, c)).to.equal(true);
  });

  it('should work for nested', function () {

    var a = {
      a: [
        {b: 10, c: 'foo', d: {
          e: [1, 'bar', false]
        }},
        30
      ]
    };

    var b = {
      a: [
        {b: 10, c: 'foo', d: {
          e: [1, 'bar', false]
        }},
        30
      ]
    };

    expect(jsonUtils.isEqual(a, b)).to.equal(true);

    a = {
      a: [
        {b: 10, c: 'foo', d: {
          e: [1, 'bar', false]
        }},
        30
      ]
    };

    b = {
      a: [
        {b: 10, c: 'foo', d: {
          e: [1, 'bar', true]
        }},
        30
      ]
    };

    expect(jsonUtils.isEqual(a, b)).to.equal(false);

    a = {
      a: [
        {b: 10, d: {
          e: [1, 'bar', false]
        }},
        30
      ]
    };

    b = {
      a: [
        {b: 10, c: 'foo', d: {
          e: [1, 'bar', false]
        }},
        30
      ]
    };

    expect(jsonUtils.isEqual(a, b)).to.equal(false);

  });

});
