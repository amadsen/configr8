var extend = require('deep-extend'),
    path = require('path');


var cfgTypeFn = {
    defaults: function (env, o) {
        var envCfg = (o[':env:'] || {})[env] || {};
        delete o[':defaults:'];
        delete o[':env:'];
        delete envCfg[':defaults:'];
        return [{
            type: 'defaults',
            conf: o
        },{
            type: 'defaults-environment',
            conf: envCfg
        }];
    },
    environment: function (env, o) {
        var defaults = o[':defaults:'];
        delete o[':defaults:'];
        delete o[':env:'];

        return [{
            type: 'environment',
            conf: o
        },{
            type: 'environment-defaults',
            conf: defaults
        }];
    },
    '[base]': function (env, o) {
        var envCfg = (o[':env:'] || {})[env] || {},
            defaults = o[':defaults:'] || {},
            defaultsEnv = (defaults[':env:'] || {})[env] || {},
            envDefaults = envCfg[':defaults:'] || {};

        delete o[':defaults:'];
        delete o[':env:'];
        delete defaults[':env:'];
        delete envCfg[':defaults:'];
        return [{
            type: 'base',
            conf: o
        },{
            type: 'base-defaults',
            conf: defaults
        },{
            type: 'base-environment',
            conf: envCfg
        },{
            type: 'base-defaults-environment',
            conf: defaultsEnv
        },{
            type: 'base-environment-defaults',
            conf: envDefaults
        }];
    }

}

function getConfigMerger (name, environment, defaults, overrides, pkgCfg, envCfg, argvCfg, ready) {
    return function mergeConfigs(err, configs) {
        if (err) {
            return ready(err);
        }

        var errors = [];
        var order = {
            // get defaults from base config first,
            'base-defaults': 0,
            // then defaults files,
            'defaults': 1,
            // then environment-specific defaults
            'base-defaults-environment': 2,
            'base-environment-defaults': 3,
            'defaults-environment': 4,
            'environment-defaults': 5,
            // base configs
            'base': 6,
            // environment from base files
            'base-environment': 7,
            // environment from environment files
            'environment': 8
        };
        function sorter(a, b) {
            var r = order[a.type] - order[b.type];
            if (r !== 0) {
                return r;
            }
            // keep the sort stable
            return a.index - b.index;
        }

        if (pkgCfg) {
            configs.unshift({
                file: path.join('package.json', '.'+ name +'-rc'),
                conf: pkgCfg
            });
        }

        if (defaults) {
            configs.unshift({
                file: '.'+ name +'-rc',
                conf: {
                    ':defaults:': defaults
                }
            });
        }

        var cfgTypePattern = new RegExp(name + '-(defaults|' + environment + ')');
        configs = configs
            .filter( function(cfg){
                if (cfg.error) {
                    //console.error(cfg);
                    errors.push({
                      // Error properties are normally not enumerable, so we get the
                      // specific ones we want another way.
                      error: ['message', 'stack'].reduce((e, key) => {
                        if (cfg.error[key]) {
                          e[key] = cfg.error[key];
                        }
                        return e;
                      }, {}),
                      file: cfg.file
                    });
                    return false;
                }
                return true;
            })
            .map( function (cfg, i) {
                var cfgType = (cfgTypePattern.exec(path.basename(cfg.file)) || [])[1] || '[base]',
                    fn = (cfgType === environment)?
                        cfgTypeFn.environment : (cfgTypeFn[cfgType] || cfgTypeFn['[base]']),
                    o = fn(environment, cfg.conf);

                return o;
            })
            .reduce( function(flat, cfg) {
                // the function called in the previous map will return an Array, so .concat() to flatMap everything
                return flat.concat(cfg);
            }, [])
            .map(function (o, i) {
                o.index = i;
                return o;
            });

        return ready(
            null,
            [{}].concat(
                // sort and merge configs
                configs
                    .slice() // because sort isn't a pure function
                    .sort( sorter )
                    .map( function(o){
                        //console.log('\nDefaults from', o.type, o.conf);
                        return o.conf;
                    }),
                // environment variables...
                envCfg,
                // passed in overrides
                overrides,
                // process.argv
                argvCfg,
                // errors
                { _: { errors: errors } }
            // then merge them all together
            ).reduce( extend )
            /*
            TODO: consider replacing extend with a more efficient
            implementation that:
            1. sets the property from the highest
              priority input object for which it is set
            2. if the property is an object, recursively
              merges
            3. if the property is an array, checks each
              element

            This potentially saves traversing whole branches
            of the object tree that later get overridden.
            */
        );
    }
}

module.exports = getConfigMerger;
