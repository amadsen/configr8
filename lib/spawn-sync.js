var spawnSync = require('child_process').spawnSync,
    decoder = new (require('string_decoder').StringDecoder)('utf8'),
    extend = require('deep-extend');

module.exports = function spawner(metaConfig, defaults, overrides, filename){
    var child = spawnSync(
        // - process.execPath is the path to the version of node we are
        // currently running
        process.execPath,
        // - combine, in order...
        [].concat(
            // the node specific options we are running with
            process.execArgv,
            // the absolute path of the filename to spawn - this file
            __filename,
            // the rest of the command line arguments
            process.argv.slice(1)
        ),
        // options
        {
            // preserve the current working directory
            cwd: process.cwd(),
            // tell electron to run as node - https://github.com/electron/electron/issues/1613
            env: /electron$/.test(process.execPath)?
                extend(process.env, {ATOM_SHELL_INTERNAL_RUN_AS_NODE: 1}) :
                process.env,
            timeout: 500,
            input: JSON.stringify({
                filename: filename,
                defaults: defaults,
                overrides: overrides,
                metaConfig: metaConfig
            }),
            stdio: [null, 'pipe', 'pipe']
        }
    );

    var errStr = decoder.end(child.stderr),
        outStr = decoder.end(child.stdout);

    // if we have an error on child.stderr, return an error
    if(errStr){
        return new Error(errStr);
    }

    try{
        return JSON.parse(outStr);
    } catch(e) {
        return e;
    }
};


/*
Now, support our spawnSync call to ourself...
*/
function parseFromStdIn (fromStdin) {
    try {
        return JSON.parse(fromStdin);
    } catch(e) {
        return e;
    }
}

if(module === process.mainModule){
    // read the filename, metaConfig, defaults, and overrides off of stdio...
    var fromStdin = "";

    process.stdin.setEncoding('utf8');
    process.stdin.on('readable', function() {
      var chunk = process.stdin.read();
      if (chunk !== null) {
        fromStdin += chunk;
      }
    });

    process.stdin.on('end', function() {
        var parsed = parseFromStdIn(fromStdin);
        if(parsed instanceof Error){
            console.error(err);
            return process.exit(1);
        }
        // make sure metaConfig.async is true
        parsed.metaConfig.async = true;

        var configr8 = require(parsed.filename);

        // re-establish our configResolver for this process
        // call the config resolver with defaults and overrides
        configr8(parsed.metaConfig)(parsed.defaults, parsed.overrides, function (err, config) {
            if(err){
                console.error(err);
                return process.exit(1);
            }

            console.log( JSON.stringify(config) );
            return process.exit();
        });
    });
}
