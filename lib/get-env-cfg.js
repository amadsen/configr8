var yargs = require('yargs');

module.exports = function (envPrefix, structure) {
    var result = yargs
        .env(envPrefix)
        .options(structure)
         // use an empty argv - we only want environment based config here
        .parse([]);
    // $0 will frequently be 'lib/spawn-sync.js' instead of what yargs thinks we want.
    // Users that want it can get it easily other ways. Just delete it.
    delete result['$0'];
    
    return result;
}
