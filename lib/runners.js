var Promise = require('pinkie-promise');

var runners = {
  sync: function (fns, params, i) {
    i = i || 0;
    var fn = fns[i];
    if (!fn) {
      return params;
    }

    return runners.sync(fns, fn(params), i+1);
  },
  async: function (fns, params, i) {
    i = i || 0;
    var fn = fns[i];
    if (!fn) {
      return params;
    }

    return Promise.resolve(fn(params)).then(function (r) {
      return runners.sync(fns, r, i+1);
    });
  }
}

module.exports = runners;