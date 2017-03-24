var globby = require('globby'),
    resolvePatterns = require('./resolve-patterns.js');

module.exports = function (name, patterns, environment, cb) {
    // first determine if any pattern has ${name}
    if( !patterns.some( function(p) {
        return (p.indexOf('${name}') > -1);
    })){
        return setImmediate(cb, null, patterns);
    }

    globby(
        [].concat(
            resolvePatterns({patterns: patterns, name: name + '-defaults'}),
            resolvePatterns({patterns: patterns, name: name }),
            (!environment? [] : resolvePatterns({patterns: patterns, name: name + '-' + environment}))
        )
    ).then( function found(found) {
        return cb(null, found);
    }, function problem(err) {
        return cb(err);
    });
}
