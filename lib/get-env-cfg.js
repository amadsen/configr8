var yargs = require('yargs');

module.exports = function (envPrefix, structure) {
    return yargs
        .env(envPrefix)
        .options(structure)
         // use an empty argv - we only want environment based config here
        .parse([]);
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
