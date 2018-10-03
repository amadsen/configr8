var test = require('tape'),
    path = require('path');

var getPaths = require('../lib/get-matching-paths.js');

/*
 This test relies on the files in the test/test-fs directory.
*/

// a utility function to make writing these tests easier
var posixPath = require('./support/posix-path.js');

function listToObject (list) {
    return list.reduce( function(set, item) {
        set[item] = true;
        return set;
    }, {});
}

test('get-matching-paths.js', function (t) {
    t.test('Should find files that match patterns - sync', function (assert) {
        var patterns = [
            posixPath(__dirname, 'test-fs', 'home', '.test1rc'),
            posixPath(__dirname, 'test-fs', 'cwd', '.test1rc'),
            posixPath(__dirname, 'test-fs', 'etc', '.test1rc')
        ],
        // NOTE: name and env should NOT show up in found filenames, because
        // `{name}` does not appear in the patterns.
        name = 'Test1NotUsed',
        env = 'none';

        // order is not guaranteed, but each file should occur only once
        var expected = [
            path.join(__dirname, 'test-fs', 'cwd', '.test1rc'),
            path.join(__dirname, 'test-fs', 'etc', '.test1rc'),
            path.join(__dirname, 'test-fs', 'home', '.test1rc')
        ];

        var syncResult = getPaths(false, name, patterns, env);
        var err = syncResult[0];
        var r = syncResult[1];
        assert.error(err);

        assert.ok( Array.isArray(r), 'Returned a list of paths');
        assert.same(
            listToObject(r),
            listToObject(expected),
            'Synchronously returned expected paths'
        );
        assert.end();
    });

    t.test('Should find files that match patterns - async', function (assert) {
        var patterns = [
            posixPath(__dirname, 'test-fs', 'home', '.test1rc'),
            posixPath(__dirname, 'test-fs', 'cwd', '.test1rc'),
            posixPath(__dirname, 'test-fs', 'etc', '.test1rc')
        ],
        // NOTE: name and env should NOT show up in found filenames, because
        // `{name}` does not appear in the patterns.
        name = 'Test1NotUsed',
        env = 'none';

        // order is not guaranteed, but each file should occur only once
        var expected = [
            path.join(__dirname, 'test-fs', 'cwd', '.test1rc'),
            path.join(__dirname, 'test-fs', 'etc', '.test1rc'),
            path.join(__dirname, 'test-fs', 'home', '.test1rc')
        ];

        getPaths(true, name, patterns, env).then(function (asyncResult) {
            var err = asyncResult[0];
            var r = asyncResult[1];
            assert.error(err);

            assert.ok( Array.isArray(r), 'Returned a list of paths');
            assert.same(
                listToObject(r),
                listToObject(expected),
                'Asynchronously returned expected paths'
            );
            assert.end();
        });
    });

    t.test('Should substitute {name} to find files that match patterns, including defaults and environment-specific files - sync', function (assert) {
        var patterns = [
            posixPath(__dirname, 'test-fs', 'home', '.${name}rc'),
            posixPath(__dirname, 'test-fs', 'cwd', '.${name}rc'),
            posixPath(__dirname, 'test-fs', 'etc', '.${name}rc')
        ],
        name = 'test1',
        env = 'unit';

        // order is not guaranteed, but each file should occur only once
        var expected = [
            path.join(__dirname, 'test-fs', 'cwd', '.test1-defaults-rc'),
            path.join(__dirname, 'test-fs', 'etc', '.test1-defaults-rc'),
            path.join(__dirname, 'test-fs', 'home', '.test1-defaults-rc'),
            path.join(__dirname, 'test-fs', 'cwd', '.test1rc'),
            path.join(__dirname, 'test-fs', 'etc', '.test1rc'),
            path.join(__dirname, 'test-fs', 'home', '.test1rc'),
            path.join(__dirname, 'test-fs', 'cwd', '.test1-unit-rc'),
            path.join(__dirname, 'test-fs', 'etc', '.test1-unit-rc'),
            path.join(__dirname, 'test-fs', 'home', '.test1-unit-rc')
        ];

        var syncResult = getPaths(false, name, patterns, env);
        var err = syncResult[0];
        var r = syncResult[1];
        assert.error(err);

        assert.ok( Array.isArray(r), 'Returned a list of paths');
        assert.same(
            listToObject(r),
            listToObject(expected),
            'Synchronously returned expected paths, including defaults' +
            ' and environment-specific files'
        );
        assert.end();
    });

    t.test('Should substitute {name} to find files that match patterns, including defaults and environment-specific files - async', function (assert) {
        var patterns = [
            posixPath(__dirname, 'test-fs', 'home', '.${name}rc'),
            posixPath(__dirname, 'test-fs', 'cwd', '.${name}rc'),
            posixPath(__dirname, 'test-fs', 'etc', '.${name}rc')
        ],
        name = 'test1',
        env = 'unit';

        // order is not guaranteed, but each file should occur only once
        var expected = [
            path.join(__dirname, 'test-fs', 'cwd', '.test1-defaults-rc'),
            path.join(__dirname, 'test-fs', 'etc', '.test1-defaults-rc'),
            path.join(__dirname, 'test-fs', 'home', '.test1-defaults-rc'),
            path.join(__dirname, 'test-fs', 'cwd', '.test1rc'),
            path.join(__dirname, 'test-fs', 'etc', '.test1rc'),
            path.join(__dirname, 'test-fs', 'home', '.test1rc'),
            path.join(__dirname, 'test-fs', 'cwd', '.test1-unit-rc'),
            path.join(__dirname, 'test-fs', 'etc', '.test1-unit-rc'),
            path.join(__dirname, 'test-fs', 'home', '.test1-unit-rc')
        ];

        getPaths(true, name, patterns, env).then(function (asyncResult) {
            var err = asyncResult[0];
            var r = asyncResult[1];
            assert.error(err);

            assert.ok( Array.isArray(r), 'Returned a list of paths');
            assert.same(
                listToObject(r),
                listToObject(expected),
                'Asynchronously returned expected paths, including defaults' +
                ' and environment-specific files'
            );
            assert.end();
        });
    });

    t.test('Should substitute {name} to find files that match patterns, including defaults but no environment-specific files if environment not set - sync', function (assert) {
        var patterns = [
            posixPath(__dirname, 'test-fs', 'home', '.${name}rc'),
            posixPath(__dirname, 'test-fs', 'cwd', '.${name}rc'),
            posixPath(__dirname, 'test-fs', 'etc', '.${name}rc')
        ],
        name = 'test1',
        env = '';

        // order is not guaranteed, but each file should occur only once
        var expected = [
            path.join(__dirname, 'test-fs', 'cwd', '.test1-defaults-rc'),
            path.join(__dirname, 'test-fs', 'etc', '.test1-defaults-rc'),
            path.join(__dirname, 'test-fs', 'home', '.test1-defaults-rc'),
            path.join(__dirname, 'test-fs', 'cwd', '.test1rc'),
            path.join(__dirname, 'test-fs', 'etc', '.test1rc'),
            path.join(__dirname, 'test-fs', 'home', '.test1rc')
        ];

        var syncResult = getPaths(false, name, patterns, env);
        var err = syncResult[0];
        var r = syncResult[1];
        assert.error(err);

        assert.ok( Array.isArray(r), 'Returned a list of paths');
        assert.same(
            listToObject(r),
            listToObject(expected),
            'Asynchronously returned expected paths, including defaults' +
            ' and environment-specific files'
        );
        assert.end();
    });

    t.test('Should substitute {name} to find files that match patterns, including defaults but no environment-specific files if environment not set - async', function (assert) {
        var patterns = [
            posixPath(__dirname, 'test-fs', 'home', '.${name}rc'),
            posixPath(__dirname, 'test-fs', 'cwd', '.${name}rc'),
            posixPath(__dirname, 'test-fs', 'etc', '.${name}rc')
        ],
        name = 'test1',
        env = '';

        // order is not guaranteed, but each file should occur only once
        var expected = [
            path.join(__dirname, 'test-fs', 'cwd', '.test1-defaults-rc'),
            path.join(__dirname, 'test-fs', 'etc', '.test1-defaults-rc'),
            path.join(__dirname, 'test-fs', 'home', '.test1-defaults-rc'),
            path.join(__dirname, 'test-fs', 'cwd', '.test1rc'),
            path.join(__dirname, 'test-fs', 'etc', '.test1rc'),
            path.join(__dirname, 'test-fs', 'home', '.test1rc')
        ];

        getPaths(true, name, patterns, env).then(function (asyncResult) {
            var err = asyncResult[0];
            var r = asyncResult[1];
            assert.error(err);

            assert.ok( Array.isArray(r), 'Returned a list of paths');
            assert.same(
                listToObject(r),
                listToObject(expected),
                'Asynchronously returned expected paths, including defaults' +
                ' and environment-specific files'
            );
            assert.end();
        });
    });

    t.test('Should substitute {name} with dashes to find only existing files that match patterns, including defaults and environment-specific files - sync', function (assert) {
        var patterns = [
            posixPath(__dirname, 'test-fs', 'home', '.${name}rc'),
            posixPath(__dirname, 'test-fs', 'cwd', '.${name}rc'),
            posixPath(__dirname, 'test-fs', 'etc', '.${name}rc')
        ],
        // NOTE: name and env should NOT show up in found filenames, because
        // `{name}` does not appear in the patterns.
        name = 'test2-with-dash',
        env = 'unit';

        // order is not guaranteed, but each file should occur only once
        var expected = [
            path.join(__dirname, 'test-fs', 'cwd', '.test2-with-dash-defaults-rc'),
            path.join(__dirname, 'test-fs', 'cwd', '.test2-with-dash-rc'),
            path.join(__dirname, 'test-fs', 'etc', '.test2-with-dash-defaults-rc'),
            path.join(__dirname, 'test-fs', 'home', '.test2-with-dash-rc'),
            path.join(__dirname, 'test-fs', 'home', '.test2-with-dash-unit-rc')
        ];

        var syncResult = getPaths(false, name, patterns, env);
        var err = syncResult[0];
        var r = syncResult[1];
        assert.error(err);

        assert.ok( Array.isArray(r), 'Returned a list of paths');
        assert.same(
            listToObject(r),
            listToObject(expected),
            'Asynchronously returned expected paths, including only the' +
            ' defaults and environment-specific files that actually exist.'
        );
        assert.end();
    });

    t.test('Should substitute {name} with dashes to find only existing files that match patterns, including defaults and environment-specific files - async', function (assert) {
        var patterns = [
            posixPath(__dirname, 'test-fs', 'home', '.${name}rc'),
            posixPath(__dirname, 'test-fs', 'cwd', '.${name}rc'),
            posixPath(__dirname, 'test-fs', 'etc', '.${name}rc')
        ],
        // NOTE: name and env should NOT show up in found filenames, because
        // `{name}` does not appear in the patterns.
        name = 'test2-with-dash',
        env = 'unit'

        // order is not guaranteed, but each file should occur only once
        var expected = [
            path.join(__dirname, 'test-fs', 'cwd', '.test2-with-dash-defaults-rc'),
            path.join(__dirname, 'test-fs', 'cwd', '.test2-with-dash-rc'),
            path.join(__dirname, 'test-fs', 'etc', '.test2-with-dash-defaults-rc'),
            path.join(__dirname, 'test-fs', 'home', '.test2-with-dash-rc'),
            path.join(__dirname, 'test-fs', 'home', '.test2-with-dash-unit-rc')
        ];

        getPaths(true, name, patterns, env).then(function (asyncResult) {
            var err =  asyncResult[0];
            var r = asyncResult[1];
            assert.error(err);

            assert.ok( Array.isArray(r), 'Returned a list of paths');
            assert.same(
                listToObject(r),
                listToObject(expected),
                'Asynchronously returned expected paths, including only the' +
                ' defaults and environment-specific files that actually exist.'
            );
            assert.end();
        });
    });

    t.end();
});
