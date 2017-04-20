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
    // return Object.keys(process.env)
    //     .filter( function(k){
    //         return (envPrefix === k.substr(0, envPrefix.length));
    //     })
    //     .reduce( function(cfg, k) {
    //         var keyStr = k.substr(envPrefix.length),
    //             parts = keyStr.split('__');
    //         // determine if the key is recognizable as a valid cfg path
    //
    //         // set the type of the key properly
    //
    //         return cfg;
    //     }, {});

}
