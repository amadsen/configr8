var pkgConf = require('pkg-conf');

module.exports = function (opts, cb) {
    pkgConf(opts.name, { cwd: opts.cwd })
        .then( function (config) {
            return cb(null, config);
        }, function (err) {
            return cb(err);
        });
}
