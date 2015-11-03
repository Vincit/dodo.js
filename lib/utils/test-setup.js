var _ = require('lodash')
  , Knex = require('knex')
  , main = require('../main')
  , Promise = require('bluebird')
  , dbManagerBuilder = require('../database/db-utils')
  , request = require('nails/lib/http/request')
  , testHelpers = {};

/**
 * Performs a one-time test setup and returns an instance of `TestHelper` class.
 *
 * `TestHelper` provides helper methods for writing tests.
 *
 * @param {object} config
 *    The configuration object of the service we are testing.
 *
 * @returns {TestHelper}
 */
module.exports = function (config) {
  var dbKey = keyForDb(config.database);
  var testHelper = testHelpers[dbKey];

  // First run.
  if (!testHelper) {
    testHelper = new TestHelper(main.createApp(config));
    testHelpers[dbKey] = testHelper;

    // Before running any tests initialize test database and start the server.
    before(function () {
      return testHelper.dbManager.dropDb()
        .then(function () {
          return testHelper.dbManager.createDb();
        })
        .then(function () {
          return testHelper.dbManager.migrateDb();
        })
        .then(function () {
          return main.startApp(testHelper.app);
        });
    });

    after(function () {
      return testHelper.destroy();
    });
  }

  return testHelper;
};

function keyForDb(dbConfig) {
  return dbConfig.client + '_' + (dbConfig.host || '') + '_' + dbConfig.database;
}

function TestHelper(app) {
  /**
   * Express.js Application object.
   *
   * @type {Object}
   */
  this.app = app;
  /**
   * Service configuration object.
   *
   * @type {Object}
   */
  this.config = app.config;
  /**
   * Database manager instance.
   *
   * @type {DatabaseManager}
   */
  this.dbManager = null;
  /**
   * Knex.js database connection object.
   *
   * @type {QueryBuilder}
   */
  this.knex = null;
  /**
   * Base url for the server.
   *
   * @ype {String}
   */
  this.serverUrl = this.config.protocol + '://localhost:' + this.config.port;
  /**
   * Request that is bound to the server's URL.
   *
   * @type {PromisifiedRequest}
   */
  this.request = request(this.serverUrl);

  this.init_();
}

/**
 * Truncates all tables in the service's database.
 *
 * @returns {Promise}
 */
TestHelper.prototype.truncateDb = function () {
  return this.dbManager.truncateDb();
};

/**
 * Updates the primary key sequences for all tables.
 * This is useful if test setup inserts rows with ids, which messes up the
 * id sequences (as it is not incremented).
 *
 * This function is currently only implemented for PostgreSQL DB manager,
 * and assumes that the primary key for each table is called `id`.
 *
 * NOTE: some values about tables and id sequences are cached, so if tables are
 * dynamically added or id sequence settings modified, the dbManager should
 * be recreated.
 *
 * @returns {Promise}
 */
TestHelper.prototype.updateIdSequences = function () {
  return this.dbManager.updateIdSequences();
};

/**
 * Creates a session and saves the given user object to it.
 *
 * This can be used to fake a login for tests.
 *
 * @returns {Promise}
 */
TestHelper.prototype.login = function (token, user) {
  // This assumes that we are using passport.js. Kind of a hack and will explode
  // in everyone's face if passport.js is sometimes replaced with something else.
  // But then again this is just test code so it is not that critical.
  if (_.isFunction(this.app.putSession)) {
    return this.app.putSession(token, { passport: { user: user } });
  } else {
    return Promise.reject(new Error('app.putSession method not found. Maybe you are not using the token-session feature?'));
  }
};

/**
 * Destroys the helper and rebuilds it.
 *
 * @returns {Promise}
 */
TestHelper.prototype.reset = function () {
  var self = this;
  return this
    .destroy()
    .then(function () {
      self.init_();
    });
};

/**
 * Closes all database connections and releases other resources.
 *
 * @returns {Promise}
 */
TestHelper.prototype.destroy = function () {
  if (this.dbManager === null) {
    return Promise.resolve();
  }
  var self = this;
  return this.dbManager
    .close()
    .then(function () {
      return self.app.disconnectDb();
    })
    .then(function () {
      self.dbManager = null;
      self.knex = null;
    });
};

/**
 * @private
 */
TestHelper.prototype.init_ = function () {
  this.dbManager = dbManagerBuilder(this.config.database);
  this.knex = this.app.db();
};
