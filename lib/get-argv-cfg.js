var yargs = require('yargs');

module.exports = function(structure, argv){
    argv = argv || process.argv.slice( /node$/.test(process.execPath)? 2 : 1 );
    // http://yargs.js.org/docs/#methods-optionskey-opt
    return yargs
        .options(structure)
        .parse(argv);
};
