var expect = require('chai').expect;
var arrayUtils = require('../../lib/utils/array-utils');

describe('array utils', function () {

  it('should create a difference object', function () {
    var currentValues = [{id: 1, a: 'a'}, {id: 2, a: 'b'}, {id: 3, a: 'c'}];
    var newValues = [{id: 1, a: 'd'}, {id: 4, a: 'e'}, {a: 'f'}];
    var res = arrayUtils.differences(currentValues, newValues);

    expect(res.create).to.have.length(2);
    expect(res.create[0] === newValues[2]).to.equal(true);
    expect(res.create[1] === newValues[1]).to.equal(true);

    expect(res.update).to.have.length(1);
    expect(res.update[0] === newValues[0]).to.equal(true);

    expect(res.delete).to.have.length(2);
    expect(res.delete[0] === currentValues[1]).to.equal(true);
    expect(res.delete[1] === currentValues[2]).to.equal(true);
  });

  it('should create a difference object by id attribute given in options.idAttr', function () {
    var currentValues = [{name: 1, a: 'a'}, {name: 2, a: 'b'}, {name: 3, a: 'c'}];
    var newValues = [{name: 1, a: 'd'}, {name: 4, a: 'e'}, {a: 'f'}];
    var res = arrayUtils.differences(currentValues, newValues, {idAttr: 'name'});

    expect(res.create).to.have.length(2);
    expect(res.create[0] === newValues[2]).to.equal(true);
    expect(res.create[1] === newValues[1]).to.equal(true);

    expect(res.update).to.have.length(1);
    expect(res.update[0] === newValues[0]).to.equal(true);

    expect(res.delete).to.have.length(2);
    expect(res.delete[0] === currentValues[1]).to.equal(true);
    expect(res.delete[1] === currentValues[2]).to.equal(true);
  });

  it('if option.testEquality parameter is true should test equality for update array items', function () {
    var currentValues = [{id: 1, a: 'a'}, {id: 2, a: 'b'}, {id: 3, a: 'c'}];
    var newValues = [{id: 1, a: 'd'}, {id: 4, a: 'e'}, {a: 'f'}];
    var res = arrayUtils.differences(currentValues, newValues, {testEquality: true});

    expect(res.create).to.have.length(2);
    expect(res.create[0] === newValues[2]).to.equal(true);
    expect(res.create[1] === newValues[1]).to.equal(true);

    expect(res.update).to.have.length(1);
    expect(res.update[0] === newValues[0]).to.equal(true);

    expect(res.delete).to.have.length(2);
    expect(res.delete[0] === currentValues[1]).to.equal(true);
    expect(res.delete[1] === currentValues[2]).to.equal(true);

    newValues = [{id: 1, a: 'a'}, {id: 4, a: 'e'}, {a: 'f'}];
    res = arrayUtils.differences(currentValues, newValues, {testEquality: true});

    expect(res.create).to.have.length(2);
    expect(res.create[0] === newValues[2]).to.equal(true);
    expect(res.create[1] === newValues[1]).to.equal(true);

    expect(res.update).to.have.length(0);

    expect(res.delete).to.have.length(2);
    expect(res.delete[0] === currentValues[1]).to.equal(true);
    expect(res.delete[1] === currentValues[2]).to.equal(true);
  });

});
