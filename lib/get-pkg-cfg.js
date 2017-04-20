var main = require('require-main-filename')(),
    pkgConf = require('pkg-conf');

module.exports = function (name, cb) {
    pkgConf(name, { cwd: main })
        .then( function (config) {
            return cb(null, config);
        }, function (err) {
            return cb(err);
        });
}
