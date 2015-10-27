var _ = require('lodash');

/**
 * Class to make handling configuration easier.
 *
 * @constructor
 */
function ConfigManager(config) {
  this._config = config;
}

ConfigManager.prototype.feature = function(featureName) {
  return _.find(this._config.features, {feature : featureName}).config;
};

ConfigManager.prototype.removeFeature = function(featureName) {
  return _.remove(this._config.features, {feature : featureName});
};

ConfigManager.prototype.knexConfig = function(req) {
  return ConfigManager.databaseConfigToKnexConfig(this._config.database, req);
};

ConfigManager.databaseConfigToKnexConfig = function(dbConf, req) {
  if (_.isFunction(dbConf)) {
    if (!req) {
      throw new Error(
        'Cannot create database connection: ' +
        'database configuration is a function that expects a Request object as input ' +
        'and the request object is not available.'
      );
    }
    dbConf = dbConf(req);
  }
  return {
    client: dbConf.client,
    debug: dbConf.debug,
    connection: {
      user: dbConf.user,
      host: dbConf.host,
      port: dbConf.port,
      password: dbConf.password,
      database: dbConf.database,
      filename: dbConf.database
    },
    pool: {
      min: _.isNumber(dbConf.minConnectionPoolSize) ? dbConf.minConnectionPoolSize : 0,
      max: _.isNumber(dbConf.maxConnectionPoolSize) ? dbConf.maxConnectionPoolSize : 10,
      afterCreate: dbConf.afterConnectionCreate,
      beforeDestroy: dbConf.beforeConnectionDestroy
    },
    migrations: {
      directory: dbConf.migrationsDir,
      tableName: dbConf.migrationsTable || 'knex_migrations'
    }
  };
};

module.exports = ConfigManager;
