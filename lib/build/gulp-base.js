'use strict';

var buildHelpers = require('./build-helpers');
var path = require('path');
var args = require('minimist')(process.argv.slice(2));
var _ = require('lodash');

var gulp = null;
var gutil = null;

function DodoGulpper(servicePath, selectedConfiguration) {
  try {
    gulp = require('gulp');
    gutil = require('gulp-util');
  } catch (err) {
    console.error("Error: Using dodo/build/gulpBase requires that you have 'gulp' and 'gulp-util' packages installed!");
  }

  // register gulp stuff here
  var services = buildHelpers.scanServices(servicePath, selectedConfiguration);
  var defaultTexts = [];

  // Generate tasks for each service.
  _.each(services, function (service) {
    gutil.log(gutil.colors.green('Registering tasks for: ') + service.name);
    defaultTexts.push(gutil.colors.cyan('--------- Service:') + ' ' + gutil.colors.yellow(service.name) + gutil.colors.cyan(' ---------'));
    if (service.config) {
      _.each(service.tasks, function (task) {
        var taskStr = task.name + ':' + service.name;
        gulp.task(taskStr, function () {
          return task.run();
        });
        defaultTexts.push(gutil.colors.yellow('gulp [--config <config-file>] ' + taskStr));
      });
    } else {
      defaultTexts.push(gutil.colors.yellow("No configuration found from: " + service.configPath));
    }
  });

  // Print help about available commands.
  gulp.task('default', function () {
    _.each(defaultTexts, function (line) {
      gutil.log(line);
    });
  });
}

// If there is ever need to add some public API for DodoGulpper it can be added below


/**
 * Wraps tasks to gulp format for gulp people...
 */
module.exports = {
  DodoGulpFactory: function(args, projectRootPath) {
    var selectedConfiguration = args.config || 'development';
    return new DodoGulpper(path.join(projectRootPath, 'services'), selectedConfiguration);
  }
};
