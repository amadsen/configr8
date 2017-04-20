var test = require('tape'),
    fork = require('child_process').fork;

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
