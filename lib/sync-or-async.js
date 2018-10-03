/*
This module's job is to return synchronous or asynchronous (promise returning)
versions of all of our other library functions for config-resolver.js, which,
hopefully, won't have to care because all of these functions will either
return the objects themselves or a Promise that resolves to the object - either
of which just gets passed to a function expecting that format.
*/
var Promise = require('pinkie-promise');

var fns = {
  getPkgCfg: require('./get-pkg-cfg.js'),
  getPaths: require('./get-matching-paths.js'),
  processFiles: require('./process-files.js'),
  mergeConfigs: require('./merge-configs.js')
};

var callbackForMode = {
  sync: function () {
    // for sync mode, done() just returns the config it recieves
    return function (cfg) { return cfg };
  },
  async: function (opts) {
    // for async mode, we may need a timeout check
    var done = (opts.timeout > 0) ?
      (function(){
        // Immediately invoked inline function to start timer
        var resolveTimeout, rejectTimeout;
        var timer = setTimeout(function () {
          var timedOut = new Error('ETIMEDOUT - Gathering configuration took too long.');
          timedOut.code = timedOut.errno = 'ETIMEDOUT';

          return rejectTimeout && rejectTimeout(timedOut);
        }, opts.timeout);

        function clear() {
          resolveTimeout = null;
          rejectTimeout = null;
          if (timer) {
            clearTimeout(timer);
            timer = null;
          }  
        }

        var timeoutPromise = new Promise(function (resolve, reject) {
          resolveTimeout = function (cfg) {
            clear();
            resolve(cfg);
          };
          rejectTimeout = function (e) {
            clear();
            reject(e);
          };
        });

        return function asyncMayTimeout(p) {
          p.then(
            function success(config) {
              // config will be a Promise
              return resolveTimeout && resolveTimeout(config);
            },
            function fail(e) {
              rejectTimeout && rejectTimeout(e);
            }
          );

          return timeoutPromise;
        };
      })()
      :
      function asyncNoTimeout(config) {
        return Promise.resolve(config);
      };
    
    return done;
  }
};

function syncOrAsync (opts) {
  // track whether we are running async (true) or sync (false)
  var asyncMode = opts.async;
  
  // get done() for our mode
  var handler = asyncMode ? callbackForMode.async : callbackForMode.sync;
  var done = handler(opts);

  return Object.keys(fns).reduce(function (bound, name) {
    bound[name] = fns[name].bind(null, asyncMode);
    return bound;
  }, { done });
}

module.exports = syncOrAsync;
