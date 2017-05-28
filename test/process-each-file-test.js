var test = require('tape'),
    path = require('path');

var processEachFile = require('../lib/process-each-file.js');

/*
 This test relies on the files in the test/test-fs directory.
 The processEachFile() module uses the parse() module (which we are not mocking.)
*/
test('For a readable, parsable file processEachFile() should return an object, with a file property and a conf property.', function (assert) {
    var file = path.join(__dirname, 'test-fs', 'cwd', '.test1rc'),
        expected = {
            file: file,
            conf: {
             "number": 1
            }
        };

    processEachFile(file, function (err, r) {
        if (err) {
            return assert.end(err);
        }
        assert.same(r, expected, 'Asynchronously returned expected object');
        assert.end();
    });
});

test('For an unreadable or unparsable file, processEachFile() should return an object, with a file property and an error property.', function (assert) {
    var file = path.join(__dirname, 'test-fs', 'not', 'a', 'file', '.test1rc'),
        expected = {
            file: file,
            error: {}
        };

    processEachFile(file, function (err, r) {
        if (err) {
            return assert.end(err);
        }
        assert.equal(r.file, expected.file, 'Asynchronously returned object for file');
        assert.ok(r.error instanceof Error, 'error property is an Error');
        assert.end();
    });
});
