var test = require('tape'),
    path = require('path');

var resolvePatterns = require('../lib/resolve-patterns.js');

function posixPath () {
    var args = [].slice.call(arguments);

    return path.posix.join.apply( path.posix,
        [path.posix.sep].concat( path.join.apply(path, args)
            .split( path.sep )
            .filter( function (part, i) {
                return !(i === 0 && /:/.test(part));
            })
        )
    )
}

test('resolvePatterns() should substitute provided values for application patterns', function(assert){
    var expected = [
        posixPath(__dirname, 'home', '.testrc'),
        posixPath(__dirname, 'cwd', '.testrc'),
        posixPath(__dirname, 'etc', 'testrc')
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
        '{' + posixPath(__dirname, 'cwd').split(path.posix.sep).map( function(p, i, parts) {
            return path.posix.join.apply(path.posix, ['/'].concat( parts.slice(0, (i > 0? -i : undefined) )) );
        }).join(',') + '}/.testrc',
        posixPath(__dirname, 'home', '.testrc'),
        posixPath(__dirname, 'etc', 'testrc')
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
        posixPath(__dirname, 'home', '.testrc'),
        posixPath(__dirname, 'cwd', '.testrc')
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
        posixPath(__dirname, 'home', '.${name}rc'),
        posixPath(__dirname, 'cwd', '.${name}rc')
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
        posixPath(__dirname, 'home', 'config', 'test.json'),
        posixPath(__dirname, 'home', '.test', 'config.json'),
        posixPath(__dirname, 'cwd', 'config', 'test.json')
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
        posixPath(__dirname, 'home', '.hyphenated-test-rc')
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
        posixPath(__dirname, 'home', 'config', 'hyphenated-test.json')
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
