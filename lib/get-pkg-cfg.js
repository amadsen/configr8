var pkgUp = require('pkg-up');
var loadJsonFile = require('load-json-file');
var _async = require('async');

module.exports = function (opts, cb) {
  _async.parallel(
    (opts.dirs || []).map(function (dir) {
      return function findPkgTask (done) {
        pkgUp(dir)
        .then(
          function (pkgPath) { setImmediate(done, null, { file: pkgPath }); },
          function (e) { setImmediate(done, null, { error: e, file: dir }); }
        );
      };
    }),
    function (err, pkgInfos) {
      if (err) {
        return cb(err);
      }

      var errInfos = [];
      var uniquePaths = pkgInfos
      .filter(function (pInfo) {
        if (pInfo.error) {
          errInfos.push(pInfo);
          return false;
        }
        return true;
      })
      .reduce(function (pSet, pInfo) {
        pSet[pInfo.file] = pSet[pInfo.file] || pInfo;
        return pSet;
      }, {});

      _async.parallel(
        Object.keys(uniquePaths).map(function (pkgPath) {
          return function pkgCfgTask (done) {
            return loadJsonFile(pkgPath)
            .then(
              function (conf) {
                setImmediate(done, null, {
                  conf: (conf || {})[opts.name] || {},
                  file: pkgPath
                });
              },
              function (e) { setImmediate(done, null, { error: e, file: pkgPath }); }
            );
          };
        }),
        function (err, pkgCfgs) {
          if (err) {
            // should not happen
            return cb(err);
          }
          return cb(null, [].concat(pkgCfgs, errInfos));
        }
      );
    }
  );
}
