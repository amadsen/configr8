var fs = require('fs'),
    Promise = require('pinkie-promise'),
    trike = require('trike'),
    parse = require('./parse.js');

function readFileAsync (file) {
  // NOTE: we never reject - we only resolve with an error
  return new Promise(function (resolve) {
    fs.readFile(
      file,
      'utf8',
      function (err, data) {
        if (err) {
          return resolve({
            file: file,
            error: err
          });
        }

        var r2 = parse(data);
        var e2 = r2[0];
        if (e2) {
          return resolve({
            file: file,
            error: e2
          });
        }

        return resolve({
          file: file,
          conf: r2[1]
        });
      }
    );
  });
}

var read = {
  sync: function readAllFilesSync([patternErr, foundPaths]) {
    if (patternErr) {
      return [{
        file: 'patterns',
        error: patternErr
      }];
    }

    return foundPaths.map(function(file) {
      var r = trike(fs.readFileSync, file, { encoding: 'utf8' });
      var e = r[0];
      if (e) {
        return {
          file: file,
          error: e
        };
      }

      var data = r[1];
      var r2 = parse(data);
      var e2 = r2[0];
      if (e2) {
        return {
          file: file,
          error: e2
        };
      }

      return {
        file: file,
        conf: r2[1]
      };
    });
  },
  async: function readAllFilesAsync(found) {
    return found.then(function ([patternErr, foundPaths]) {
      if (patternErr) {
        return Promise.resolve([{
          file: 'patterns',
          error: patternErr
        }]);
      }
  
      return Promise.all(
        foundPaths.map(readFileAsync)
      );
    });
  }
}

function processFiles (isAsync, found) {
  // get the right runner for our sync / async mode
  var readFn = isAsync ? read.async : read.sync;

  return trike(
    readFn,
    found
  );
}

module.exports = processFiles;
