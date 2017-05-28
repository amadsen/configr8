var globby = require('globby'),
    path = require('path'),
    resolvePatterns = require('./resolve-patterns.js');

module.exports = function (name, patterns, environment, cb) {
    // first determine if any pattern has ${name}
    if( patterns.some( function(p) {
        return (p.indexOf('${name}') > -1);
    })){
        // if so, do our substitutions and expand our pattern list to include
        // defaults and environment specific files
        patterns = [].concat(
            resolvePatterns({patterns: patterns, name: name + '-defaults'}),
            resolvePatterns({patterns: patterns, name: name }),
            (!environment? [] : resolvePatterns({patterns: patterns, name: name + '-' + environment}))
        )
    }

    globby( patterns ).then( function found(found) {
        return cb(null, found.map(path.normalize));
    }, function problem(err) {
        return cb(err);
    });
}
