var test = require('tape');

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
