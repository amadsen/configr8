var spawnSync = require('child_process').spawnSync,
    decoder = new (require('string_decoder').StringDecoder)('utf8'),
    extend = require('deep-extend');

module.exports = function spawner(name, metaConfig, defaults, overrides, filename){
    metaConfig.name = name;

    var child = spawnSync(
        // - process.execPath is the path to the version of node we are
        // currently running
        process.execPath,
        // - combine, in order...
        [].concat(
            // the node specific options we are running with
            process.execArgv.filter( function(arg) {
                // don't run --debug or --inspect
                /* TODO: just run on different port */
                return !/^--(debug|inspect)/.test(arg);
            }),
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
    process.on('uncaughtException', (err) => {
        console.error(err);
        console.error(err.stack);
        process.exit(err.code || 1);
    });

    process.on('unhandledRejection', (err) => {
        console.error(err);
        console.error(err.stack);
        process.exit(err.code || 1);
    });

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

        // re-establish our configResolver for this process
        // call the config resolver with defaults and overrides
        var configResolver = require(parsed.filename)(parsed.metaConfig);
        if(configResolver instanceof Error){
            console.error(configResolver);
            console.error(parsed);
            return process.exit(1);
        }
        configResolver(parsed.defaults, parsed.overrides, function (err, config) {
            if(err){
                console.error(err);
                return process.exit(1);
            }

            console.log( JSON.stringify(config) );
            return process.exit();
        });
    });
}
