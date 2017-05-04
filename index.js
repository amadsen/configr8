/*
## Merging Configuration

+ command line arguments (parsed by yargs)
+ environment variables prefixed with `${appname}_` (parsed by yargs)
+ environment-specific configuration from the configuration files
+ standard configuration from the configuration files
+ default configuration from the configuration files
+ the defaults object you passed in.
*/
var extend = require('deep-extend'),
    _async = require('async'),
    osHomedir = require('os-homedir'),
    Promise = require('pinkie-promise');

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
    structure: {},
    /*
    TODO: there are a few aspects to consider for referenceResolvers:
    1. a pattern - "resolve|~" to search for in strings in the parsed object
        that triggers a further lookup and parse to be merged in at that point.
        Parsing would recursively feed back in to step 1. for all strings

    2. patterns or references can be special URI's that are matched by thier
        protocol against the defined referenceResolvers (protocols must be
        unique) to read and parse the pattern or reference.
        (When no protocol is provided we use "jsonfile:")

       This likely looks something like
           var ref = (/^resolve|>(.*)$/.exec(string) || [])[1];
           if(ref){
               ref = url.parse(ref);
               // match against referenceResolvers for what to do
           }

    3. references are evaluated:
        1. in the intially calculated patterns
        2. agressively, before merging of initially resolved configs
       This is because lazy evaluation may result in config from an overridden
       reference not being merged, even though not all of it's values would
       otherwise be overridden.

    4. each reference resolver must define - under a key matching it's protocol
    - a function which reads and parses the config for the reference. This
    allows the user to parse things that are not json. This function's
    return value will be substituted into the referencing object under the key
    where the reference was found. References in patterns should always return a
    javascript object that can be merged with those provided via argv, env,
    package.json, and other resolved pattern objects. Parsers are expected to be
    asynchronous pure functions. Where they can they should memoize using the
    raw data directly or indirectly (ie through a hash functions). They should
    return through the provided callback only.

    The list contains functions that receive
        `reference` - the original string reference (or pattern)
        `callback` - a function that takes an `error` and a `config` option. If
            this callback is called with:
            + an error (error is not falsey) - the parser encountered an error.
              This will immediately suspend config resolution
            + no error and data (error is falsey and data is truthy) - the
              parser has returned the parsed data
            + no error and no data will also count as an error

    Keep in mind that the function However, there are some use cases
    where only a streaming parser can efficiently parse a data set.

    For example, our built in module protocol matches strings starting with
    "module". A reference or pattern using it would look something like:
    `module:./path/to/module/or/name|string-argument`
    */
    referenceResolvers: {
        jsonfile,
        module
    },

    /*
    TODO: consider
    - polling / watching configs and emitting an event when updates occur
    - true turns it on. any falsey value turns it off.
    */
    watch: false
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

    // resolve our patterns as far as we can
    metaConfig = extend({}, settings, metaConfig);
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

        _async.parallel({
            pkgObj: function(done) {
                if (!metaConfig.usePkg) {
                    return done(null, {});
                }
                // Identify config from package.json
                getPkgCfg({ name: name, cwd: spawnSync.mainModuleDir() }, done);
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
                /*
                TODO: get-matching-paths.js (which provides results.found),
                process-each-file.js (eachFile()), and parse.js (used by
                eachFile()) need to be migrated under the `jsonfile:` built in
                reference resolver. We need to build the `module` built in
                reference resolver. And we need to route each pattern to the
                appropriate reference resolver for read, parse, and watching
                logic while maintaining the original pattern order.
                */
                results.found,
                // read each file that exists
                eachFile,
                // merge the resulting config objects with our other config objects
                mergeConfigs(
                    name,
                    environment,
                    defaults,
                    overrides,
                    results.pkgObj,
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
