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
    _async = require('async'),
    osHomedir = require('os-homedir'),
    Promise = require('pinkie-promise'),
    requireMain = require('require-main-filename');

var getArgvCfg = require('./lib/get-argv-cfg.js'),
    getEnvCfg = require('./lib/get-env-cfg.js'),
    getPkgCfg = require('./lib/get-pkg-cfg.js'),
    spawnSync = require('./lib/spawn-sync.js'),
    resolvePatterns = require('./lib/resolve-patterns.js'),
    getPaths = require('./lib/get-matching-paths.js'),
    eachFile = require('./lib/process-each-file.js'),
    mergeConfigs = require('./lib/merge-configs.js');

var settings = {
    // name, if not provided, will throw an error
    name: '',
    useArgv: false,
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


/*
Optionally, the results of merging config can be JSON.stringify()'ed and
placed in a process.env property that can't easily come from common shells. This
module would look for this variable first and, if present, simply read and
JSON.parse() the already merged config from there.
*/
function parseConfigCachingEnv (cacheJson) {
    try {
        return JSON.parse(cacheJson);
    } catch(e) {
        return undefined;
    }
}

function configr8 (metaConfig) {
    var name, cachingEnvVar;
    // metaConfig configures the configuration resolution function returned
    // by configr8
    try {
        metaConfig = resolveMetaConfig[ typeof metaConfig ](metaConfig);
    } catch(e) {
        return new Error('configr8 requires a name string or configuration object.');
    }

    name = metaConfig.name;
    // we delete name because we don't want to resolve it in our patterns yet
    delete metaConfig.name;
    if( !(name && /^[-\w]+$/.test(name)) ){
        return new Error('configr8 requires a name consisting of letters, numbers, hyphens or underscores.');
    }

    // create our environment variable for caching configs read from the file system
    cachingEnvVar = name + ':configr8:fs-configs';

    // merge our metaConfig and settings
    metaConfig = extend({}, settings, metaConfig);

    // add main module dir to metaConfig (if it isn't already set)
    if (metaConfig.usePkg) {
      metaConfig.pkgSearchDirs = metaConfig.pkgSearchDirs || [
        path.dirname( requireMain() ),
        process.cwd()
      ];
    }

    // resolve our patterns as far as we can
    metaConfig.patterns = resolvePatterns(metaConfig, true);

    // return the the configuration resolution function
    return function configResolver(defaults, overrides, ready){
        var environment,
            envVarPrefix = name.toUpperCase().replace(/[-\W]/g, '_');
        overrides = overrides || {};

        environment = overrides.env ||
            overrides.environment ||
            process.env[ envVarPrefix + '_ENV' ] ||
            process.env.ENV ||
            process.env.ENVIRONMENT ||
            process.env.NODE_ENV;

        var readyIsFn = ('function' === typeof ready);

        if (metaConfig.async === false && !readyIsFn) {
            /*
            If synchronus operation is desired, we need to use
            child_process.spawnSync() to run this module, get the result, and
            parse it meaningfully.

            We always use async code internally because of the speed advantages for
            reading/parsing files in parallel. For synchronus use, pass defaults and
            overrides as special JSON encoded environment variables to a
            child_process.spawnSync() call that runs this file via the same node
            interpreter that we are currently running (I think?) in a seperate process and
            dumps the resulting json encoded config object to it's stdout.
            */
            var fsConfig;
            if ( process.env[cachingEnvVar] ) {
                fsConfig = parseConfigCachingEnv(process.env[cachingEnvVar]);
            }
            return fsConfig || (function (cfg) {
                process.env[cachingEnvVar] = JSON.stringify(cfg);
                return cfg;
            })(
                spawnSync(
                    name,
                    metaConfig,
                    defaults,
                    overrides,
                    __filename
                )
            );
        }

        var future;
        /*
        if async, and ready isn't supplied return a promise and create a ready
        callback that resolves it.
        */
        if (!readyIsFn) {
            // odd as this looks,
            // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise
            // indicates that the executor will run immediately, before the
            // Promise constructor returns, so ready will be set for us.
            future = new Promise( function(resolve, reject) {
                ready = function(err, config) {
                    if (err) {
                        return reject(err);
                    }
                    return resolve(config);
                }
            });
        }

        // establish a setTimeout for async timeout functionality
        // ...and wrap ready to make sure it is only called once
        if (metaConfig.timeout > 0) {
            ready = (function (cb) {
                function finish(err, config) {
                    if (timer) {
                        clearTimeout(timer);
                        timer = null;
                    }
                    // call if not
                    if('function' === typeof cb) {
                        setImmediate(function(f){
                            f(err, config);
                        }, cb);
                        // prevent calling again
                        cb = null;
                    }
                }
                var timer = setTimeout(finish, metaConfig.timeout, (function(){
                    var timedOut = new Error('ETIMEDOUT - Gathering configuration took too long.');
                    timedOut.code = timedOut.errno = 'ETIMEDOUT';
                    return timedOut;
                })());

                return finish;
            })(ready);
        }


        _async.parallel({
            pkgCfgs: function(done) {
                if (!metaConfig.usePkg) {
                    return done(null, {});
                }
                // Identify config from package.json
                getPkgCfg({ name: name, dirs: metaConfig.pkgSearchDirs }, done);
            },
            envObj: function(done) {
                // Identify config from process.env
                setImmediate(done, null, (!metaConfig.useEnv? {} : getEnvCfg(envVarPrefix, metaConfig.structure)) );
            },
            argvObj: function(done) {
                // Identify config from process.argv
                setImmediate(done, null, (!metaConfig.useArgv? {} : getArgvCfg(process.argv, metaConfig.structure)) );
            },
            found: function(done) {
                // Identify which config files actually exist
                getPaths(name, metaConfig.patterns, environment, done);
            }
        }, function (err, results) {
            if(err){
                return ready(err);
            }

            return _async.map(
                results.found,
                // read each file that exists
                eachFile,
                // merge the resulting config objects with our other config objects
                mergeConfigs(
                    name,
                    environment,
                    defaults,
                    overrides,
                    results.pkgCfgs,
                    results.envObj,
                    results.argvObj,
                    ready
                )
            );
        });

        // actually return the Promise (if defined)
        return future;
    };
}

// export the main configr8 function
module.exports = configr8;
