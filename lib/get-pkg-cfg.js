var pkgUp = require('pkg-up');
var loadJsonFile = require('load-json-file');
var trike = require('trike');
var runners = require('./runners.js');

function makePgkInfo (dir, trikeRes) {
  var e = trikeRes[0];
  if (e) {
    return {
      error: e,
      file: dir
    }
  }

  return {
    file: trikeRes[1]
  };
}

function getPkgInfoCfgs (pkgInfos) {
  var errInfos = [];
  var uniquePaths = pkgInfos
    .filter(function (pInfo) {
      if (pInfo.error) {
        errInfos.push(pInfo);
        return false;
      }
      return !!pInfo.file;
    })
    .reduce(function (pSet, pInfo) {
      pSet[pInfo.file] = pSet[pInfo.file] || pInfo;
      return pSet;
    }, {});

  return [errInfos, Object.keys(uniquePaths)];
}

var findPkg = {
  sync: function (dirs) {
    return getPkgInfoCfgs(
      dirs.map(function (d) {
        return makePgkInfo(d, trike(pkgUp.sync, {cwd: d}));
      })
    );
  },
  async: function (dirs) {
    return Promise.all(
      dirs.map(function (d) {
        return trike(pkgUp,{cwd: d}).then(function(r) {
          return makePgkInfo(d, r);
        });
      })
    ).then(getPkgInfoCfgs);
  }
};

var loadJson = function (isAsync, opts) {
  if (isAsync) {
    return function asyncLoadJson ([errInfos, uniquePaths]) {
      return Promise.all(
        uniquePaths.map(function (pkgPath) {
          return trike(loadJsonFile, pkgPath).then(function(r){
            var e = r[0];
            if (e) {
              return { error: e, file: pkgPath }
            }
      
            var pkgData = r[1];
            return {
              conf: (pkgData || {})[opts.name] || {},
              file: pkgPath
            };
          });
        })
      ).then( function (pkgCfgs) {
        return [].concat(pkgCfgs, errInfos);
      });
    };
  }

  return function syncLoadJson ([errInfos, uniquePaths]) {
    var pkgCfgs = uniquePaths.map(function (pkgPath) {
      var r = trike(loadJsonFile.sync, pkgPath);
      var e = r[0];
      if (e) {
        return { error: e, file: pkgPath }
      }

      var pkgData = r[1];
      return {
        conf: (pkgData || {})[opts.name] || {},
        file: pkgPath
      };
    });

    return [].concat(pkgCfgs, errInfos);
  };
};

module.exports = function (isAsync, opts) {
  var run = isAsync ? runners.async : runners.sync;
  var pkgFn = isAsync ? findPkg.async : findPkg.sync;
  var jsonFn = loadJson(isAsync, opts);

  // get unique directories
  var dirs = Object.keys(
    (opts.dirs || []).reduce(function (dset, d) {
      dset[d] = true;
      return dset;
    }, {})
  );

  return trike(
    run,
    [
      pkgFn,
      jsonFn
    ],
    dirs
  );
}
