var test = require('tape'),
    path = require('path');

var resolvePatterns = require('../lib/resolve-patterns.js');

test('resolvePatterns() should substitute provided values for application patterns', function(assert){
    var expected = [
        path.posix.join(__dirname, 'home', '.testrc'),
        path.posix.join(__dirname, 'cwd', '.testrc'),
        path.posix.join(__dirname, 'etc', 'testrc')
    ];

    var r = resolvePatterns({
        name: 'test',
        etc: path.join(__dirname, 'etc'),
        cwd: path.join(__dirname, 'cwd'),
        home: path.join(__dirname, 'home'),
        patterns: 'application'
    });
    assert.ok(Array.isArray(r), 'Synchronously returned an array as expected');
    assert.same(r, expected, 'Application array tokens substituted correctly');

    assert.end();
});

test('resolvePatterns() should substitute provided values for per-directory patterns', function(assert){
    var expected = [
        /*
        This was tested in the node REPL to ensure the pattern syntax
         would work as intended:
        > globby.sync('{/Users,/}/*.js');
        [ '/test.js' ]
        */
        '{' + path.join(__dirname, 'cwd').split(path.sep).map( function(p, i, parts) {
            return path.posix.join.apply(path.posix, ['/'].concat( parts.slice(0, (i > 0? -i : undefined) )) );
        }).join(',') + '}/.testrc',
        path.posix.join(__dirname, 'home', '.testrc'),
        path.posix.join(__dirname, 'etc', 'testrc')
    ];

    var r = resolvePatterns({
        name: 'test',
        etc: path.join(__dirname, 'etc'),
        cwd: path.join(__dirname, 'cwd'),
        home: path.join(__dirname, 'home'),
        patterns: 'per-directory'
    });
    assert.ok(Array.isArray(r), 'Synchronously returned an array as expected');
    assert.same(r, expected, 'Application array tokens substituted correctly');

    assert.end();
});

test('resolvePatterns() should remove patterns that it cannot fully substitute', function(assert){
    var expected = [
        path.posix.join(__dirname, 'home', '.testrc'),
        path.posix.join(__dirname, 'cwd', '.testrc')
    ];

    var r = resolvePatterns({
        name: 'test',
        cwd: path.join(__dirname, 'cwd'),
        home: path.join(__dirname, 'home'),
        patterns: 'application'
    });
    assert.ok(Array.isArray(r), 'Synchronously returned an array as expected');
    assert.same(r, expected, 'Application array tokens substituted correctly');

    assert.end();
});

test('resolvePatterns() should not remove patterns that require name if it is not provided and flag is set', function(assert){
    var expected = [
        path.posix.join(__dirname, 'home', '.${name}rc'),
        path.posix.join(__dirname, 'cwd', '.${name}rc')
    ];

    var r = resolvePatterns({
        cwd: path.join(__dirname, 'cwd'),
        home: path.join(__dirname, 'home'),
        patterns: 'application'
    }, true);
    assert.ok(Array.isArray(r), 'Synchronously returned an array as expected');
    assert.same(r, expected, 'Application array tokens substituted correctly');

    assert.end();
});

test('resolvePatterns() should substitute provided values for custom patterns', function(assert){
    var expected = [
        path.posix.join(__dirname, 'home', 'config', 'test.json'),
        path.posix.join(__dirname, 'home', '.test', 'config.json'),
        path.posix.join(__dirname, 'cwd', 'config', 'test.json')
    ];

    var patterns = [
        '${home}/config/${name}.json',
        '${home}/.${name}/config.json',
        '${cwd}/config/${name}.json'
    ]

    var r = resolvePatterns({
        name: 'test',
        cwd: path.join(__dirname, 'cwd'),
        home: path.join(__dirname, 'home'),
        patterns: patterns
    });
    assert.ok(Array.isArray(r), 'Synchronously returned an array as expected');
    assert.same(r, expected, 'Application array tokens substituted correctly');

    assert.end();
});

test('resolvePatterns() should substitute name with a trailing hyphen if name contains a hyphen', function(assert){
    var expected = [
        path.posix.join(__dirname, 'home', '.hyphenated-test-rc')
    ];

    var patterns = [
        '${home}/.${name}rc'
    ]

    var r = resolvePatterns({
        name: 'hyphenated-test',
        cwd: path.join(__dirname, 'cwd'),
        home: path.join(__dirname, 'home'),
        patterns: patterns
    });
    assert.ok(Array.isArray(r), 'Synchronously returned an array as expected');
    assert.same(r, expected, 'Application array tokens substituted correctly');

    assert.end();
});

test('resolvePatterns() should substitute name without a trailing hyphen if it is immediatly followed by a period', function(assert){
    var expected = [
        path.posix.join(__dirname, 'home', 'config', 'hyphenated-test.json')
    ];

    var patterns = [
        '${home}/config/${name}.json'
    ]

    var r = resolvePatterns({
        name: 'hyphenated-test',
        cwd: path.join(__dirname, 'cwd'),
        home: path.join(__dirname, 'home'),
        patterns: patterns
    });
    assert.ok(Array.isArray(r), 'Synchronously returned an array as expected');
    assert.same(r, expected, 'Application array tokens substituted correctly');

    assert.end();
});
