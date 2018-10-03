var test = require('tape');

var parse = require('../lib/parse.js');

test('parse() should return an object from JSON', function (assert) {
    var expected = {
            a: "b",
            c: 2,
            d: true
        },
        expectedStr = JSON.stringify(expected, null, 2);

    var result = parse(expectedStr);
    var err = result[0];
    var r = result[1];

    if (err) {
        return assert.end(err);
    }
    assert.same(r, expected, 'Synchronously returned expected object');
    assert.end();
});

test('parse() should return an object from JSON with single-line comments', function (assert) {
    var expected = {
            a: "b",
            c: 2,
            d: true
        },
        comment = '\n// This is a comment',
        expectedStr = JSON.stringify(expected, null, 2)
            .replace(/$/m, comment);

    var result = parse(expectedStr);
    var err = result[0];
    var r = result[1];

    if (err) {
        return assert.end(err);
    }
    assert.same(r, expected, 'Synchronously returned expected object');
    assert.end();
});

test('parse() should return an object from JSON with multi-line comments', function (assert) {
    var expected = {
            a: "b",
            c: 2,
            d: true
        },
        comment = '\n/*\n This is a comment\n */',
        expectedStr = JSON.stringify(expected, null, 2)
            .replace(/$/m, comment);

    var result = parse(expectedStr);
    var err = result[0];
    var r = result[1];

    if (err) {
        return assert.end(err);
    }
    assert.same(r, expected, 'Synchronously returned expected object');
    assert.end();
});
