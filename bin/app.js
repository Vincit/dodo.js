/**
 * Parse command line arguments and start the server.
 *
 * NOTE: Probably this should be removed completely or to be replaced with nicer cmd client.
 *
 * Command line arguments:
 *
 * ```
 * --config
 *   path to the config file
 *
 * --port
 *   optional port that overrides the one defined in the config file
 * ```
 */

var argv = require('minimist')(process.argv.slice(2))
  , color = require('cli-color')
  , config = null;

if (!argv.config) {
  console.error(color.red('parameter --config needed'));
  process.exit(1);
}

try {
  config = require(argv.config);
} catch (err) {
  console.error(color.red('could not open config file "' + argv.config + '"'));
  process.exit(1);
}

// Override port.
if (argv.port) {
  config.port = argv.port;
}

require('../app').express.main.start(config);