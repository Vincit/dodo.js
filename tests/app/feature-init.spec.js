'use strict';

var expect = require('chai').expect;
var plugins = require('../../lib/app/plugins');

var path = require('path');
var featurePath1 = path.join(__dirname, 'feature-path1');
var featurePath2 = path.join(__dirname, 'feature-path2');

describe('initFeatures', function () {

  describe('init single feature with just name and simple configuration', function () {
    var loadedFeature = null;
    beforeEach(function () {
      var app = {
        config: {
          features : [
            {
              feature : 'feature-in-path',
              config: {
                featureConfigParameter: true
              }
            }
          ],
          featurePaths: [ featurePath1 ],
          profile: 'testing'
        }
      };
      plugins.initFeatures(app);
      loadedFeature = app.feature('feature-in-path');
    });

    it('should load feature without $featureId given', function () {
      expect(loadedFeature.featureId).to.equal('feature-path1/feature-in-path');
    });

    it('should pass configuration to feature', function () {
      expect(loadedFeature.featureConfig.featureConfigParameter).to.be.ok;
    });
  });

  it('should fail if feature with same $featureId is initialized twice', function () {
    var app = {
      config: {
        features : [
          { feature : 'feature-in-path' },
          { feature : 'feature-in-path' }
        ],
        featurePaths: [ featurePath1 ],
        profile: 'testing'
      }
    };

    expect(function () {
      plugins.initFeatures(app);
    }).to.throw(/feature feature-in-path has already been initialized/);
  });

  it('should allow to load feature from single file feature', function () {
    var app = {
      config: {
        features : [
          { feature : 'single-file-feature' }
        ],
        featurePaths: [ featurePath1, featurePath2 ],
        profile: 'testing'
      }
    };

    plugins.initFeatures(app);
    expect(app.feature('single-file-feature').featureId)
      .to.equal('feature-path1/single-file-feature');
  });

  it('should throw if feature directory / file is not found', function () {
    var app = {
      config: {
        features : [
          { feature : 'single-file-feature' }
        ],
        featurePaths: ['yoyo', 'bobo'],
        profile: 'testing'
      }
    };

    expect(function () {
      plugins.initFeatures(app);
    }).to.throw(/Cannot find feature.*single-file-feature.*yoyo.*bobo/);
  });

  it('should pass error if initialization of feature fail', function () {
    var app = {
      config: {
        features : [
          { feature : 'fail-on-init' }
        ],
        featurePaths: [featurePath1],
        profile: 'testing'
      }
    };

    expect(function () {
      plugins.initFeatures(app);
    }).to.throw(/Critical aborting failure error!/);
  });

  it('should load feature from first path if the same feature in multiple paths', function () {
    var app = {
      config: {
        features : [
          { feature : 'feature-in-path' }
        ],
        featurePaths: [ featurePath2, featurePath1 ],
        profile: 'testing'
      }
    };

    plugins.initFeatures(app);
    expect(app.feature('feature-in-path').featureId)
      .to.equal('feature-path2/feature-in-path');
  });

  it('should throw if unmet dependency', function () {
    var app = {
      config: {
        features : [
          { feature : 'depends-on-single-file-feature' }
        ],
        featurePaths: [ featurePath2, featurePath1 ],
        profile: 'testing'
      }
    };

    expect(function () {
      plugins.initFeatures(app);
    }).to.throw(/Feature.*depends-on-single-file-feature.*has unmet dependencies:.*single-file-feature/);
  });

  it('should throw if unmet dependency is initialized after dependent feature', function () {
    var app = {
      config: {
        features : [
          { feature : 'depends-on-single-file-feature' },
          { feature : 'single-file-feature' }
        ],
        featurePaths: [ featurePath2, featurePath1 ],
        profile: 'testing'
      }
    };

    expect(function () {
      plugins.initFeatures(app);
    }).to.throw(/Feature.*depends-on-single-file-feature.*has unmet dependencies:.*single-file-feature/);
  });

  it('should work if dependency is initialized before dependent feature', function () {
    var app = {
      config: {
        features : [
          { feature : 'single-file-feature' },
          { feature : 'depends-on-single-file-feature' }
        ],
        featurePaths: [ featurePath2, featurePath1 ],
        profile: 'testing'
      }
    };
    plugins.initFeatures(app);

    expect(app.feature('depends-on-single-file-feature').featureId)
      .to.equal('feature-path2/depends-on-single-file-feature');
    expect(app.feature('single-file-feature').featureId)
      .to.equal('feature-path1/single-file-feature');
  });

  describe('create 2 instances of the same feature with $featureId property', function () {
    var loadedApp = null;

    beforeEach(function () {
      var app = {
        config: {
          features : [
            { $featureId: 'feat1', feature : 'feature-in-path', config: { instance: 'feat1' } },
            { $featureId: 'feat2', feature : 'feature-in-path', config: { instance: 'feat2' } }
          ],
          featurePaths: [ featurePath1 ],
          profile: 'testing'
        }
      };

      loadedApp = plugins.initFeatures(app);
    });

    it('app.feature(featureId) should return feature', function () {
      expect(loadedApp.feature('feat1').featureConfig.instance).to.equal('feat1');
      expect(loadedApp.feature('feat2').featureConfig.instance).to.equal('feat2');
    });

    it('should not find feature with name if $featureId was given', function () {
      expect(function () {
        loadedApp.feature('feature-in-path');
      }).to.throw(/this service doesn't have the feature "feature-in-path"/);
    });
  });

  it('should allow to init feature once with just feature: given and second with additional $featureId', function () {
    var app = {
      config: {
        features : [
          { feature : 'feature-in-path', config: { instance: 'feat1' } },
          { $featureId: 'feat2', feature : 'feature-in-path', config: { instance: 'feat2' } }
        ],
        featurePaths: [ featurePath1 ],
        profile: 'testing'
      }
    };

    plugins.initFeatures(app);
    expect(app.feature('feature-in-path').featureConfig.instance).to.equal('feat1');
    expect(app.feature('feat2').featureConfig.instance).to.equal('feat2');
  });

});
