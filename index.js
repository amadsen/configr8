/*
## Merging Configuration

+ command line arguments (parsed by yargs)
+ environment variables prefixed with `${appname}_` (parsed by yargs)
+ environment-specific configuration from the configuration files
+ standard configuration from the configuration files
+ default configuration from the configuration files
+ the defaults object you passed in.
*/
var path = require('path'),
    extend = require('deep-extend'),
    osHomedir = require('os-homedir'),
    requireMain = require('require-main-filename');

var configResolver = require('./lib/config-resolver.js'),
    resolvePatterns = require('./lib/resolve-patterns.js');

var settings = {
  // name, if not provided, will throw an error
  name: '',
  useArgv: false,
  useArgvEnv: false,
  useEnv: true,
  usePkg: true,
  cwd: process.cwd(),
  home: osHomedir(),
  // We allow setting the etc directory to make it easier to test.
  etc: null,
  patterns: "application",
  async: false,
  timeout: undefined, // <- timeout for spawnSync
  structure: {}/*,
  reference-resolvers: []
  */
};

var resolveMetaConfig = {
  string: function(appname){
      return { name: appname };
  },
  object: function(metaConfig){
      return metaConfig || {};
  }
};


function configr8 (rawParams) {
  // params configures the configuration resolution function returned
  // by configr8
  var paramNormalizer = resolveMetaConfig[ typeof rawParams ];
  if (!paramNormalizer) {
    return new Error('configr8 requires a name string or configuration object.');
  }
  var params = paramNormalizer(rawParams);

  var name = params.name;
  // we delete name because we don't want to resolve it in our patterns yet
  delete params.name;
  if( !(name && /^[-\w]+$/.test(name)) ){
      return new Error('configr8 requires a name consisting of letters, numbers, hyphens or underscores.');
  }

  // merge our params and settings to get opts
  var opts = extend({}, settings, params);

  // add main module dir to metaConfig (if it isn't already set)
  if (opts.usePkg) {
    opts.pkgSearchDirs = opts.pkgSearchDirs || [
      path.dirname( requireMain() ),
      process.cwd()
    ];
  }

  // resolve our patterns as far as we can
  opts.patterns = resolvePatterns(opts, true);
  
  // return the the configuration resolution function
  return configResolver.bind(null, name, opts);
}

// export the main configr8 function
module.exports = configr8;
