var _ = require('lodash');
var mergeConfig = require('../../lib/utils/merge-config');
var expect = require('chai').expect;

describe('merge config', function () {

  function SomeConstructor() {}
  SomeConstructor.staticProperty = 1000;

  var baseConfig;
  var originalBaseConfig = {
    port: 1234,
    protocol: 'http',
    profile: 'development',
    database: {
      client: 'postgres',
      host: 'localhost',
      port: '5432',
      database: 'some_database'
    },
    featurePaths: [
      'path 1',
      'path 2'
    ],
    features: [
      {
        feature: 'feature 1',
        config: {
          a: {
            b: 1,
            c: 2
          }
        }
      },
      {
        feature: 'feature 2',
        config: {
          someConstructor: SomeConstructor,
          array: [1, 2, 3]
        }
      },
      {
        $featureId: 'feature 3 instance 1',
        feature: 'feature 3',
        config: { }
      },
      {
        $featureId: 'feature 3 instance 2',
        feature: 'feature 3',
        config: { }
      }

    ]
  };

  beforeEach(function () {
    baseConfig = _.cloneDeep(originalBaseConfig, function (value) {
      if (_.isFunction(value)) {
        return value;
      }
    });
  });

  it('should leave the original config untouched', function () {
    var merged = mergeConfig(baseConfig, {
      port: 5555,
      database: {
        client: 'mysql'
      }
    });

    expect(baseConfig).to.eql(originalBaseConfig);
    expect(merged).to.not.eql(originalBaseConfig);

    baseConfig.database.port = 7000;
    expect(originalBaseConfig.database.port).to.equal('5432');
  });

  it('should merge basic values', function () {
    var merged = mergeConfig(baseConfig, {
      port: 5555,
      database: {
        database: 'new_database'
      },
      somethingNew: {
        some: 'value'
      }
    });

    expect(merged.port).to.equal(5555);
    expect(merged.database.database).to.equal('new_database');
    expect(merged.somethingNew).to.eql({some: 'value'});

    delete merged.port;
    delete merged.database.database;
    delete merged.somethingNew;

    delete baseConfig.port;
    delete baseConfig.database.database;

    expect(merged).to.eql(baseConfig);
  });

  it('$addFeaturePaths should add values to the featurePaths array', function () {
    var merged = mergeConfig(baseConfig, {
      $addFeaturePaths: ['path 3', 'path 4']
    });

    expect(merged.featurePaths).to.eql(['path 1', 'path 2', 'path 3', 'path 4']);
    expect(merged.$addFeaturePaths).to.equal(undefined);
  });

  it('$remove in feature definition should remove the feature', function () {
    var feature =         {
      $remove: 'feature 2'
    };

    var merged = mergeConfig(baseConfig, {
      features: [feature]
    });

    expect(merged.features).to.eql([baseConfig.features[0], baseConfig.features[2], baseConfig.features[3]]);
  });

  it('$remove in feature definition should remove the feature with unique id reference', function () {
    var feature =         {
      $remove: 'feature 3 instance 2'
    };

    var merged = mergeConfig(baseConfig, {
      features: [feature]
    });

    expect(merged.features).to.eql([baseConfig.features[0], baseConfig.features[1], baseConfig.features[2]]);
  });

  it('$remove should fail if no unique id given', function () {
    var feature = {
      $remove: 'feature 3'
    };

    expect(function () {
      mergeConfig(baseConfig, {
        features: [feature]
      });
    }).to.throw();
  });


  it('$addBefore in feature definition should add the feature before the given feature', function () {
    var feature = {
      $addBefore: 'feature 2',
      feature: 'add-before-test',
      config: {
        something: 'here'
      }
    };

    var merged = mergeConfig(baseConfig, {
      features: [feature]
    });

    expect(merged.features).to.eql([baseConfig.features[0], feature, baseConfig.features[1], baseConfig.features[2], baseConfig.features[3]]);
  });

  it('$addBefore in feature should allow $featureId reference', function () {
    var feature = {
      $addBefore: 'feature 3 instance 2',
      feature: 'add-before-test',
      config: {
        something: 'here'
      }
    };

    var merged = mergeConfig(baseConfig, {
      features: [feature]
    });

    expect(merged.features).to.eql([baseConfig.features[0], baseConfig.features[1], baseConfig.features[2], feature, baseConfig.features[3]]);
  });

  it('$addBefore should throw without unique feature reference', function () {
    var feature = {
      $addBefore: 'feature 3',
      feature: 'add-before-test',
      config: {
        something: 'here'
      }
    };

    expect(function () {
      mergeConfig(baseConfig, {
        features: [feature]
      });
    }).to.throw();
  });

  it('$addAfter in feature definition should add the feature after the given feature', function () {
    var feature = {
      $addAfter: 'feature 1',
      feature: 'add-after-test',
      config: {
        something: 'here'
      }
    };

    var merged = mergeConfig(baseConfig, {
      features: [feature]
    });

    expect(merged.features).to.eql([baseConfig.features[0], feature, baseConfig.features[1], baseConfig.features[2], baseConfig.features[3]]);

    feature = {
      $addAfter: 'feature 2',
      feature: 'add-after-test',
      config: {
        something: 'here'
      }
    };

    merged = mergeConfig(baseConfig, {
      features: [feature]
    });

    expect(merged.features).to.eql([baseConfig.features[0], baseConfig.features[1], feature, baseConfig.features[2], baseConfig.features[3]]);
  });

  it('$addAfter should work with $featureId reference', function () {
    var feature = {
      $addAfter: 'feature 3 instance 2',
      feature: 'add-after-test',
      config: {
        something: 'here'
      }
    };

    var merged = mergeConfig(baseConfig, {
      features: [feature]
    });

    expect(merged.features).to.eql([
      baseConfig.features[0],
      baseConfig.features[1],
      baseConfig.features[2],
      baseConfig.features[3],
      feature
    ]);
  });

  it('$addAfter should throw without unique feature reference', function () {
    var feature = {
      $addAfter: 'feature 3',
      feature: 'add-after-test',
      config: {
        something: 'here'
      }
    };

    expect(function () {
      mergeConfig(baseConfig, {
        features: [feature]
      });
    }).to.throw();
  });

  it('feature definition should be merged with an existing one', function () {
    var feature = {
      feature: 'feature 1',
      config: {
        f: 'morjens',
        a: {
          c: 666,
          d: {
            e: 'jeah'
          }
        }
      }
    };

    var merged = mergeConfig(baseConfig, {
      features: [feature]
    });

    expect(merged.features).to.have.length(4);
    expect(merged.features[1]).to.eql(baseConfig.features[1]);
    expect(merged.features[0]).to.eql({
      feature: 'feature 1',
      config: {
        f: 'morjens',
        a: {
          b: 1,
          c: 666,
          d: {
            e: 'jeah'
          }
        }
      }
    });
  });

  it('merge should throw if no unique feature reference', function () {
    var feature = {
      feature: 'feature 3',
      config: {
        f: 'morjens',
        a: {
          c: 666,
          d: {
            e: 'jeah'
          }
        }
      }
    };
    expect(function () {
      mergeConfig(baseConfig, {
        features: [feature]
      });
    }).to.throw();
  });


  it('function should not be merged', function () {
    function NewConstructor() {}
    NewConstructor.newStaticProperty = 'wuppi';

    var feature = {
      feature: 'feature 2',
      config: {
        someConstructor: NewConstructor
      }
    };

    var merged = mergeConfig(baseConfig, {
      features: [feature]
    });

    expect(merged.features).to.have.length(4);
    expect(merged.features[0]).to.eql(baseConfig.features[0]);
    expect(merged.features[1]).to.eql({
      feature: 'feature 2',
      config: {
        someConstructor: NewConstructor,
        array: [1, 2, 3]
      }
    });

    expect(merged.features[1].config.someConstructor === NewConstructor).to.equal(true);
    expect(merged.features[1].config.someConstructor.staticProperty).to.equal(undefined);
    expect(merged.features[1].config.someConstructor.newStaticProperty).to.equal('wuppi');
  });

  it('new feature definition should be added to the end', function () {
    var feature = {
      feature: 'feature 666',
      config: {
        f: 'morjens',
        a: {
          c: 666,
          d: {
            e: 'jeah'
          }
        }
      }
    };

    var merged = mergeConfig(baseConfig, {
      features: [feature]
    });

    expect(merged.features).to.have.length(5);
    expect(merged.features[0]).to.eql(baseConfig.features[0]);
    expect(merged.features[1]).to.eql(baseConfig.features[1]);
    expect(merged.features[4]).to.eql(feature);
  });

});
