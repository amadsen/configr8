var yargs = require('yargs');

module.exports = function(argv, structure){
    var result = yargs
        .options(structure)
        .parse(argv);
    // $0 will frequently be 'lib/spawn-sync.js' instead of what yargs thinks we want.
    // Users that want it can get it easily other ways. Just delete it.
    delete result['$0'];

    return result;
};
