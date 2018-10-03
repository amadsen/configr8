var test = require('tape'),
    path = require('path');

var processFiles = require('../lib/process-files.js');
var asyncProcessFiles = processFiles.bind(null, true);
var syncProcessFiles = processFiles.bind(null, false);

/*
 This test relies on the files in the test/test-fs directory.
 The processEachFile() module uses the parse() module (which we are not mocking.)
*/
test('For a readable, parsable file asynchronous processFiles() should return an object for each file, with a file property and a conf property.', function (assert) {
    var file = path.join(__dirname, 'test-fs', 'cwd', '.test1rc'),
        expected = [{
            file: file,
            conf: {
             "number": 1
            }
        }];

    // asyncProcessFiles takes a Promise that resolves to a trike result
    asyncProcessFiles(Promise.resolve([null, [file]])).then(function (asyncResult) {
        var err = asyncResult[0];
        var r = asyncResult[1];

        if (err) {
            return assert.end(err);
        }
        assert.same(r, expected, 'Asynchronously returned expected object');
        assert.end();
    });
});

test('For an unreadable or unparsable file, asynchronous processFiles() should return an object for each file, with a file property and an error property.', function (assert) {
    var file = path.join(__dirname, 'test-fs', 'not', 'a', 'file', '.test1rc'),
        expected = [{
            file: file,
            error: {}
        }];

    // asyncProcessFiles takes a Promise that resolves to a trike result
    asyncProcessFiles(Promise.resolve([null, [file]])).then(function (asyncResult) {
        var err = asyncResult[0];
        var r = asyncResult[1];

        if (err) {
            return assert.end(err);
        }
        assert.ok(Array.isArray(r) && r.length === expected.length, 'Asynchronously returned array for found paths');
        assert.equal(r[0].file, expected[0].file, 'Asynchronously returned object for file');
        assert.ok(r[0].error instanceof Error, 'error property is an Error');
        assert.end();
    });
});

test('For a pattern error, asynchronous processFiles() should return an array with a single object, with a file property and an error property.', function (assert) {
  var expected = [{
          file: 'patterns',
          error: {}
      }];

  // asyncProcessFiles takes a Promise that resolves to a trike result
  asyncProcessFiles(Promise.resolve([expected[0].error])).then(function (asyncResult) {
      var err = asyncResult[0];
      var r = asyncResult[1];

      if (err) {
          return assert.end(err);
      }
      assert.ok(Array.isArray(r) && r.length === expected.length, 'Asynchronously returned array for found paths');
      assert.deepEqual(r[0], expected[0], 'Asynchronously returned an object for pattern error');

      assert.end();
  });
});

test('For a readable, parsable file synchronous processFiles() should return an object for each file, with a file property and a conf property.', function (assert) {
  var file = path.join(__dirname, 'test-fs', 'cwd', '.test1rc'),
      expected = [{
          file: file,
          conf: {
           "number": 1
          }
      }];

  // syncProcessFiles takes a trike result
  var syncResult = syncProcessFiles([null, [file]]);
  var err = syncResult[0];
  var r = syncResult[1];

  if (err) {
    return assert.end(err);
  }

  assert.same(r, expected, 'Synchronously returned expected object');
  assert.end();
});

test('For an unreadable or unparsable file, synchronous processFiles() should return an object for each file, with a file property and an error property.', function (assert) {
  var file = path.join(__dirname, 'test-fs', 'not', 'a', 'file', '.test1rc'),
      expected = [{
          file: file,
          error: {}
      }];

  // syncProcessFiles takes a trike result
  var syncResult = syncProcessFiles([null, [file]]);
  var err = syncResult[0];
  var r = syncResult[1];

  if (err) {
    return assert.end(err);
  }

  assert.ok(Array.isArray(r) && r.length === expected.length, 'Synchronously returned array for found paths');
  assert.equal(r[0].file, expected[0].file, 'Synchronously returned object for file');
  assert.ok(r[0].error instanceof Error, 'error property is an Error');
  assert.end();
});

test('For a pattern error, synchronous processFiles() should return an array with a single object, with a file property and an error property.', function (assert) {
  var expected = [{
          file: 'patterns',
          error: {}
      }];

  // syncProcessFiles takes a Promise that resolves to a trike result
  var syncResult = syncProcessFiles([expected[0].error])
  var err = syncResult[0];
  var r = syncResult[1];

  if (err) {
      return assert.end(err);
  }
  assert.ok(Array.isArray(r) && r.length === expected.length, 'Synchronously returned array for found paths');
  assert.deepEqual(r[0], expected[0], 'Synchronously returned an object for pattern error');
  
  assert.end();
});
