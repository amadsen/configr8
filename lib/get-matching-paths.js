var globby = require('globby'),
    path = require('path'),
    trike = require('trike'),
    runners = require('./runners.js'),
    resolvePatterns = require('./resolve-patterns.js');

function normalizeFound(found) {
  return found.map(path.normalize);
}

module.exports = function (isAsync, name, patterns, environment) {
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
    );
  }

  // get the right runner for our sync / async mode
  var run = !isAsync ? runners.sync : runners.async;
  var globFn = !isAsync ? globby.sync : globby;

  return trike(
    run,
    [
      globFn,
      normalizeFound
    ],
    patterns
  );
}
