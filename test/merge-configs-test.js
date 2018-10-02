var test = require('tape');

var mergeConfigs = require('../lib/merge-configs.js');
/*
 The mergeConfigs() takes , defaults, overrides, pkgCfg, envCfg, and argvCfg.
 The function it returns is a callback that takes an error and a list of file
 config objects. They are merged in this order:
*/
/*
passed in defaults (excluding  specific defaults),
defaults from pkgCfg,
defaults from base config files in order,
defaults from -defualts-rc files,
 specific defaults from passed in defaults, pkgCfg, base config, and -defaults-rc files
defaults from -{}-rc files in order,
base config from pkgCfg,
base config from base config files in order,
 specific config from pkgCfg,
 specific config from base config files in order,
 specific config from -{}-rc files in order

//  variables...
envCfg,
// passed in overrides
overrides,
// process.argv
argvCfg,
// errors encountered while reading and parsing files
{ errors: errors }

*/
function addNumericProperties(target, expected, value, start, end){
    for (var i = start; i < end; i++) {
        // we deliberately set all the properties to the same value
        // so we know which object the merged value came from
        target[i] = value;
    }
    expected[start] = value;
}

test('mergeConfigs() should return a function', function (assert) {
    var environment = 'unit-test',
        defaults = {
            ':env:': {
                'unit-test': {
                }
            }
        },
        pkgCfg = [{
          conf: {
            ':defaults:': {
                ':env:': {
                    'unit-test': {}
                }
            },
            ':env:': {
                'unit-test': {
                    ':defaults:': {}
                }
            }
          },
          file: 'package.json'
        }],
        envCfg = {},
        argvCfg = {},
        overrides = {},
        errors = [];

    var files = [
        // 1/.my-cfg-defaults-rc
        { file: '1/.my-cfg-defaults-rc', conf: {
            ':env:': {
                'unit-test': {}
            }
        } },
        // 2/.my-cfg-defaults-rc
        { file: '2/.my-cfg-defaults-rc', conf: {
            ':env:': {
                'unit-test': {}
            }
        } },
        // 1/.my-cfg-rc
        { file: '1/.my-cfg-rc', conf: {
            ':defaults:': {
                ':env:': {
                    'unit-test': {}
                }
            },
            ':env:': {
                'unit-test': {
                    ':defaults:': {}
                }
            }
        } },
        // 2/.my-cfg-rc
        { file: '2/.my-cfg-rc', conf: {
            ':defaults:': {
                ':env:': {
                    'unit-test': {}
                }
            },
            ':env:': {
                'unit-test': {
                    ':defaults:': {}
                }
            }
        } },
        // 1/.my-cfg-unit-test-rc
        { file: '1/.my-cfg-unit-test-rc', conf: {
            ':defaults:': {}
        } },
        // 2/.my-cfg-unit-test-rc
        { file: '2/.my-cfg-unit-test-rc', conf: {
            ':defaults:': {}
        } },
        // 3/.my-cfg-rc - deliberately an error
        { file: '3/.my-cfg-rc', error: new Error('3/.my-cfg-rc error') }
    ]

    // errors encountered while reading and parsing files
    // {
    //     _: {
    //         errors: list of errors reading files
    //     }
    // }
    var expected = {
        _: {
            errors: [ files[6] ]
        }
    }

    // 0 - passed in defaults (excluding  specific defaults)
    addNumericProperties( defaults, expected, 'supplied defaults', 0, 28 );
    // 1 - defaults from pkgCfg
    addNumericProperties( pkgCfg[0]['conf'][':defaults:'], expected, 'package config defaults', 1, 28 );
    // 2-3 - defaults from base config files in order
    addNumericProperties( files[2].conf[':defaults:'], expected, '1/.my-cfg-rc defaults', 2, 28 );
    addNumericProperties( files[3].conf[':defaults:'], expected, '2/.my-cfg-rc defaults', 3, 28 );
    // 4-5 - defaults from -defualts-rc files,
    addNumericProperties( files[0].conf, expected, '1/.my-cfg-defaults-rc', 4, 28 );
    addNumericProperties( files[1].conf, expected, '2/.my-cfg-defaults-rc', 5, 28 );
    // 6-14 -  specific defaults from passed in defaults, pkgCfg,
    //  base config, and -defaults-rc files
    addNumericProperties( defaults[':env:']['unit-test'], expected, 'supplied defaults for environment', 6, 28 );
    addNumericProperties( pkgCfg[0]['conf'][':defaults:'][':env:']['unit-test'], expected, 'package config defaults for the environment', 7, 28 );
    addNumericProperties( files[2].conf[':defaults:'][':env:']['unit-test'], expected, '1/.my-cfg-rc defaults for environment', 8, 28 );
    addNumericProperties( files[3].conf[':defaults:'][':env:']['unit-test'], expected, '2/.my-cfg-rc defaults for environment', 9, 28 );
    addNumericProperties( pkgCfg[0]['conf'][':env:']['unit-test'][':defaults:'], expected, 'package config environment-specific defaults', 10, 28 );
    addNumericProperties( files[2].conf[':env:']['unit-test'][':defaults:'], expected, '1/.my-cfg-rc environment-specific defaults', 11, 28 );
    addNumericProperties( files[3].conf[':env:']['unit-test'][':defaults:'], expected, '2/.my-cfg-rc environment-specific defaults', 12, 28 );
    addNumericProperties( files[0].conf[':env:']['unit-test'], expected, '1/.my-cfg-defaults-rc environment-specific values', 13, 28 );
    addNumericProperties( files[1].conf[':env:']['unit-test'], expected, '2/.my-cfg-defaults-rc environment-specific values', 14, 28 );
    // 15-16 - defaults from -{}-rc files in order,
    addNumericProperties( files[4].conf[':defaults:'], expected, '1/.my-cfg-unit-test-rc defaults (environment-specific file)', 15, 28 );
    addNumericProperties( files[5].conf[':defaults:'], expected, '2/.my-cfg-unit-test-rc defaults (environment-specific file)', 16, 28 );
    // base config from pkgCfg,
    addNumericProperties( pkgCfg[0]['conf'], expected, 'base package config', 17, 28 );
    // base config from base config files in order,
    addNumericProperties( files[2].conf, expected, '1/.my-cfg-rc base config', 18, 28 );
    addNumericProperties( files[3].conf, expected, '2/.my-cfg-rc base config', 19, 28 );
    //  specific config from pkgCfg,
    addNumericProperties( pkgCfg[0]['conf'][':env:']['unit-test'], expected, 'environment-specific package config', 20, 28 );

    //  specific config from base config files in order,
    addNumericProperties( files[2].conf[':env:']['unit-test'], expected, '1/.my-cfg-rc environment-specific config', 21, 28 );
    addNumericProperties( files[3].conf[':env:']['unit-test'], expected, '2/.my-cfg-rc environment-specific config', 22, 28 );

    //  specific config from -{}-rc files in order
    addNumericProperties( files[4].conf, expected, '1/.my-cfg-unit-test-rc config (environment-specific file)', 23, 28 );
    addNumericProperties( files[5].conf, expected, '2/.my-cfg-unit-test-rc config (environment-specific file)', 24, 28 );

    // environment variables...
    addNumericProperties( envCfg, expected, 'environment variables', 25, 28 );
    // passed in overrides
    addNumericProperties( overrides, expected, 'overrides', 26, 28 );
    // process.argv
    addNumericProperties( argvCfg, expected, 'process.argv', 27, 28 );

    var fn = mergeConfigs(
        // name
        'my-cfg',
        // env
        environment,
        // defaults
        defaults,
        // overrides
        overrides,
        // pkgCfg
        pkgCfg,
        // envCfg
        envCfg,
        // argvCfg
        argvCfg,
        function(err, merged) {
            Object.keys(expected).forEach( function(key){
                var actual = merged[key],
                    reference = expected[key];
                if ('_' === key) {
                    return assert.equal(
                        actual.errors[0].file,
                        reference.errors[0].file,
                        'Error sorted properly'
                    );
                }
                return assert.equal(actual, reference, 'Key "' + key + '" is ' + reference);
            });
            assert.end();
        }
    );

    assert.ok('function' === typeof fn, 'Synchronously returned function');
    fn(null, files);
});
