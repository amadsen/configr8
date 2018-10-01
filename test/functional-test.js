var test = require('tape'),
    path = require('path'),
    semver = require('semver'),
    child_process = require('child_process'),
    spawn = child_process.spawn,
    fork = child_process.fork;

var configr8 = require('../');

/*
var settings = {
    // name, if not provided, will throw an error
    name: '',
    argvParser: yargs,
    cwd: process.cwd(),
    home: osHomedir(),
    // We allow setting the etc directory to make it easier to test.
    etc: null,
    patterns: "application",
    async: false,
    reference-resolvers: []
};
*/

test('Should return an Error if invalid name is provided', function(assert) {
    var r = configr8();
    assert.ok(r instanceof Error, 'Returned an error for undefined name as expected');
    var r = configr8(null);
    assert.ok(r instanceof Error, 'Returned an error for null name as expected');
    var r = configr8(true);
    assert.ok(r instanceof Error, 'Returned an error for Boolean name as expected');
    r = configr8(2);
    assert.ok(r instanceof Error, 'Returned an error for Number name as expected');
    r = configr8(function(){return;});
    assert.ok(r instanceof Error, 'Returned an error for Function name as expected');
    r = configr8([]);
    assert.ok(r instanceof Error, 'Returned an error for Array name as expected');
    assert.end();
});

test('Should accept a string name and return a function', function(assert) {
    var r = configr8('test');
    assert.ok('function' === typeof r, 'Returned a function as expected');
    assert.end();
});

test('Should accept an object with a string `name` property and return a function', function(assert) {
    var r = configr8({
        name: 'test'
    });
    assert.ok('function' === typeof r, 'Returned a function as expected');
    assert.end();
});

test('Returned function should accept defaults and overrides and (option 1) synchronously return a configuration object', function(assert) {
    var fn = configr8({
        name: 'test',
        useEnv: false
    });

    var def = {
        some: 'config',
        another: 'default value'
    };

    var over = {
        another: 'overriden'
    };

    var expected = {
        some: 'config',
        another: 'overriden',
        _: { errors: [] }
    }


    var config = fn(def, over);
    assert.notEqual(config, def, 'Returned config object should not be the defaults object');
    assert.deepEqual(config, expected, 'Returned expected config');
    assert.end();
});

test('If async: true, returned function should accept defaults and overrides and (option 2) return a Promise that resolves to a configuration object', function(assert) {
    var fn = configr8({
        name: 'test',
        async: true,
        useEnv: false
    });

    var def = {
        some: 'config',
        another: 'default value'
    };

    var over = {
        another: 'overriden'
    };

    var expected = {
        some: 'config',
        another: 'overriden',
        _: { errors: [] }
    }

    fn(def, over)
        .then( function (config) {
            assert.notEqual(config, def, 'Returned config object should not be the defaults object');
            assert.deepEqual(config, expected, 'Returned expected config via Promise');
            assert.end();
        })
        .catch( function (err) {
            assert.end(err);
        });
});

test('Returned function should accept defaults, overrides and (option 3) a callback that resolves to a configuration object', function(assert) {
    var fn = configr8({
        name: 'test',
        useEnv: false
    });

    var def = {
        some: 'config',
        another: 'default value'
    };

    var over = {
        another: 'overriden'
    };

    var expected = {
        some: 'config',
        another: 'overriden',
        _: { errors: [] }
    }

    fn(def, over, function (err, config) {
        assert.notEqual(config, def, 'Returned config object should not be the defaults object');
        assert.deepEqual(config, expected, 'Returned expected config via callback');
        assert.end();
    });
});

test('Should support configuration via environment variables', function(assert) {
    var env = {
        FOO_THING1: '1',
        FOO_THING2__BAR: 'bar',
        FOO_THING2__BAZ: 'baz'
    };

    var expected = {
        thing1: 1,
        thing2: {
            bar: 'bar',
            baz: 'baz'
        },
        _: { errors: [] }
    }
    var child = fork(
        './test/support/use-env-test-module.js',
        ['foo'],
        { env: env }
    );
    child.on('message', function(config) {
        assert.deepEqual(config, expected, 'Returned expected config from environment');
        assert.end();
    });
});

test('Should support configuration via environment variables for names with hyphens', function(assert) {
    var env = {
        HYPHEN_ENV_TEST_THING1: '1',
        HYPHEN_ENV_TEST_THING2__BAR: 'bar',
        HYPHEN_ENV_TEST_THING2__BAZ: 'baz'
    };

    var expected = {
        thing1: 1,
        thing2: {
            bar: 'bar',
            baz: 'baz'
        },
        _: { errors: [] }
    }
    var child = fork(
        './test/support/use-env-test-module.js',
        ['hyphen-env-test'],
        { env: env }
    );
    child.on('message', function(config) {
        assert.deepEqual(config, expected, 'Returned expected config from environment');
        assert.end();
    });
});

test('Should support configuration via environment variables for names with underscores', function(assert) {
    var env = {
        UNDERSCORE_ENV_TEST_THING1: '1',
        UNDERSCORE_ENV_TEST_THING2__BAR: 'bar',
        UNDERSCORE_ENV_TEST_THING2__BAZ: 'baz'
    };

    var expected = {
        thing1: 1,
        thing2: {
            bar: 'bar',
            baz: 'baz'
        },
        _: { errors: [] }
    }
    var child = fork(
        './test/support/use-env-test-module.js',
        ['underscore_env_test'],
        { env: env }
    );
    child.on('message', function(config) {
        assert.deepEqual(config, expected, 'Returned expected config from environment');
        assert.end();
    });
});

test('Should support configuration via environment variables for names with hyphens and underscores', function(assert) {
    var env = {
        HYPHEN_UNDERSCORE_ENV_TEST_THING1: '1',
        HYPHEN_UNDERSCORE_ENV_TEST_THING2__BAR: 'bar',
        HYPHEN_UNDERSCORE_ENV_TEST_THING2__BAZ: 'baz'
    };

    var expected = {
        thing1: 1,
        thing2: {
            bar: 'bar',
            baz: 'baz'
        },
        _: { errors: [] }
    }
    var child = fork(
        './test/support/use-env-test-module.js',
        ['hyphen_underscore-env-test'],
        { env: env }
    );
    child.on('message', function(config) {
        assert.deepEqual(config, expected, 'Returned expected config from environment');
        assert.end();
    });
});

test('Should support configuration via command line arguments', function(assert) {
    var argv = [
        '--thing1=1',
        '--thing2.bar=bar',
        '--thing2.baz=baz'
    ];

    var expected = {
        thing1: 1,
        thing2: {
            bar: 'bar',
            baz: 'baz'
        },
        _: { errors: [] }
    }
    var child = fork(
        './test/support/use-argv-test-module.js',
        argv
    );
    child.on('message', function(config) {
        assert.deepEqual(config, expected, 'Returned expected config from command line arguments');
        assert.end();
    });
});

if (semver.lt(process.version, '7.7.0')) {
test('Should not error when run with --debug', function(assert){
    var inspecting = spawn(
        'node',
        [
            '--debug=9872',
            path.join(__dirname, 'support', 'inspect-test-module.js'),
            'foo'
        ],
        {});

    var expected = { _: { errors: [] } };

    inspecting.stderr
        .on('data', function(data) {
            console.error(`${data}`);
        })
        .on('error', function(err) {
            console.error(err);
            assert.fail(err);
        });

    var out = '';
    var startRegEx = /=START=/m;
    var endRegEx = /=END=$/m;
    inspecting.stdout
        .on('data', function(data) {
            out += data;
            if(endRegEx.test(out)){
                inspecting.kill();
                out = out.replace(endRegEx, '');
            }
        })
        .on('error', function(err) {
            console.error(err);
            assert.fail(err);
        });

    inspecting
        .on('exit', function(code) {
            assert.equal(code, null, 'Child process exited with null exit code');

            var parts = out.split(startRegEx);
            console.log(parts[0]);

            assert.doesNotThrow( function(){
                out = JSON.parse(parts[1]);
            }, null, 'Config should JSON.parse()');
            assert.deepEqual(out, expected, 'Got expected config');
            assert.end();
        });
});
}

test('Should not error when run with --inspect', function(assert){
    var inspecting = spawn(
        'node',
        [
            '--inspect=9872',
            path.join(__dirname, 'support', 'inspect-test-module.js'),
            'foo'
        ],
        {});

    var expected = { _: { errors: [] } };

    inspecting.stderr
        .on('data', function(data) {
            console.error(`${data}`);
        })
        .on('error', function(err) {
            console.error(err);
            assert.fail(err);
        });

    var out = '';
    var startRegEx = /=START=/m;
    var endRegEx = /=END=$/m;
    inspecting.stdout
        .on('data', function(data) {
            out += data;
            if(endRegEx.test(out)){
                inspecting.kill();
                out = out.replace(endRegEx, '');
            }
        })
        .on('error', function(err) {
            console.error(err);
            assert.fail(err);
        });

    inspecting
        .on('exit', function(code) {
            assert.equal(code, null, 'Child process exited with null exit code');

            var parts = out.split(startRegEx);
            console.log(parts[0]);

            assert.doesNotThrow( function(){
                out = JSON.parse(parts[1]);
            }, null, 'Config should JSON.parse()');
            assert.deepEqual(out, expected, 'Got expected config');
            assert.end();
        });
});

test('Should get correct config when run synchronously with config in package.json', function(assert){
    var inspecting = spawn(
        'node',
        [
            path.join(__dirname, 'support', 'pkg-conf-test/index.js'),
            path.resolve( path.join(__dirname, '..') )
        ],
        {});

    var expected = {
      "bar": 1,
      "baz": {
        "buzz": 4
      },
      _: { errors: [] }
    };

    inspecting.stderr
        .on('data', function(data) {
            console.error(`${data}`);
        })
        .on('error', function(err) {
            console.error(err);
            assert.fail(err);
        });

    var out = '';
    var startRegEx = /=START=/m;
    inspecting.stdout
        .on('data', function(data) {
            out += data;
        })
        .on('error', function(err) {
            console.error(err);
            assert.fail(err);
        });

    inspecting
        .on('exit', function(code) {
            assert.equal(code, 0, 'Child process exited with 0 exit code');

            var parts = out.split(startRegEx);
            console.log(parts[0]);

            assert.doesNotThrow( function(){
                out = JSON.parse(parts[1]);
            }, null, 'Config should JSON.parse()');
            assert.deepEqual(out, expected, 'Got expected config');
            assert.end();
        });
});

test('Should get correct config when run asynchronously with config in package.json', function(assert){
    var inspecting = spawn(
        'node',
        [
            path.join(__dirname, 'support', 'async-pkg-conf-test/index.js'),
            path.resolve( path.join(__dirname, '..') )
        ],
        {});

    var expected = {
      "bar": 1,
      "baz": {
        "buzz": 4
      },
      _: { errors: [] }
    };

    inspecting.stderr
        .on('data', function(data) {
            console.error(`${data}`);
        })
        .on('error', function(err) {
            console.error(err);
            assert.fail(err);
        });

    var out = '';
    var startRegEx = /=START=/m;
    inspecting.stdout
        .on('data', function(data) {
            out += data;
        })
        .on('error', function(err) {
            console.error(err);
            assert.fail(err);
        });

    inspecting
        .on('exit', function(code) {
            assert.equal(code, 0, 'Child process exited with 0 exit code');

            var parts = out.split(startRegEx);
            console.log(parts[0]);

            assert.doesNotThrow( function(){
                out = JSON.parse(parts[1]);
            }, null, 'Config should JSON.parse()');
            assert.deepEqual(out, expected, 'Got expected config');
            assert.end();
        });
});

test('Should report config file errors in _.errors object', function(assert){
  var inspecting = spawn(
      'node',
      [
          'index.js',
          path.resolve( path.join(__dirname, '..') )
      ],
      {
        cwd: path.join(__dirname, 'support', 'async-file-error-test')
      });

  var expected = {
    "bar": 1,
    "baz": {
      "buzz": 4
    },
    _: { errors: [{
      error: {
        message: 'Unexpected token i in JSON at position 4'
      },
      file: path.join(__dirname, 'support', 'async-file-error-test/.foorc')
    }] }
  };

  inspecting.stderr
      .on('data', function(data) {
          console.error(`${data}`);
      })
      .on('error', function(err) {
          console.error(err);
          assert.fail(err);
      });

  var out = '';
  var startRegEx = /=START=/m;
  inspecting.stdout
      .on('data', function(data) {
          out += data;
      })
      .on('error', function(err) {
          console.error(err);
          assert.fail(err);
      });

  inspecting
      .on('exit', function(code) {
          assert.equal(code, 0, 'Child process exited with 0 exit code');

          var parts = out.split(startRegEx);
          console.log(parts[0]);

          assert.doesNotThrow( function(){
              out = JSON.parse(parts[1]);
          }, null, 'Config should JSON.parse()');
          var e = (((out._ || {}).errors || [])[0] || {}).error || {};
          assert.ok(!!e.stack, 'Errors contain stack.');
          delete e.stack;
          assert.deepEqual(out, expected, 'Got expected config with error info in _.errors');
          assert.end();
      });
});

test('Should get ETIMEDOUT when run synchronously with too small a timeout', function(assert){
    var fn = configr8({
        // this name should be unique to avoid finding config cached on process.env
        name: 'test-timeout-sync',
        timeout: 1
    });

    r = fn({},{});

    assert.ok(r instanceof Error && r.code === 'ETIMEDOUT', 'Returned expected ETIMEDOUT error');
    assert.end();
});

test('Should get ETIMEDOUT when run asynchronously with too small a timeout', function(assert){
    var fn = configr8({
        // this name should be unique to avoid finding config cached on process.env
        name: 'test-timeout-async',
        timeout: 1,
        async: true
    });

    fn({}, {})
        .then( function (config) {
            assert.fail('Did not time out');
        })
        .catch( function (err) {
            assert.ok(
                err instanceof Error && err.code === 'ETIMEDOUT',
                'Returned expected ETIMEDOUT error'
            );
            assert.end();
        });
});
