var spawnSync = require('child_process').spawnSync,
    extend = require('deep-extend'),
    trike = require('trike');

var CONFIG_TAG = '::CONFIG::';

function spawner (name, metaConfig, defaults, overrides, filename) {
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
            process.argv.slice(2)
        ),
        // options
        {
            // preserve the current working directory
            cwd: process.cwd(),
            // tell electron to run as node - https://github.com/electron/electron/issues/1613
            env: /electron$/.test(process.execPath)?
                extend(process.env, {ATOM_SHELL_INTERNAL_RUN_AS_NODE: 1}) :
                process.env,
            timeout: metaConfig.timeout,
            input: JSON.stringify({
                filename: filename,
                defaults: defaults,
                overrides: overrides,
                metaConfig: metaConfig
            }),
            stdio: [null, 'pipe', 'pipe'],
            encoding: 'utf8'
        }
    );

    // if we had an error running the process (like a timeout)
    if (child.error) {
        return child.error;
    }

    // if we have an error on child.stderr, return an error
    if (child.stderr) {
        return new Error(child.stderr);
    }
    var start = child.stdout.indexOf(CONFIG_TAG);
    if (start < 0) {
      console.log(child.stdout);
      return new Error('No config returned!!');
    }
    var end = child.stdout.indexOf(CONFIG_TAG, start + CONFIG_TAG.length);
    if (end < 0) {
      console.log(child.stdout);
      return new Error('Config cut off!!');
    }
    var before = child.stdout.slice(0, start);
    console.log(before);
    var after = child.stdout.slice(end + CONFIG_TAG.length);
    console.log(after);
    var configString = child.stdout.slice(start + CONFIG_TAG.length, end);

    var [e, r] = trike(JSON.parse, configString);
    return e || r;
}

/*
Now, support our spawnSync call to ourself...
*/

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
        var [e, parsed] = trike(JSON.parse, fromStdin);
        if (e instanceof Error) {
            console.error(e);
            return process.exit(1);
        }

        // make sure metaConfig.async is true
        parsed.metaConfig.async = true;

        // re-establish our configResolver for this process
        // call the config resolver with defaults and overrides
        var configResolver = require(parsed.filename)(parsed.metaConfig);
        if (configResolver instanceof Error) {
            console.error(configResolver);
            console.error(parsed);
            return process.exit(1);
        }
        configResolver(parsed.defaults, parsed.overrides, function (err, config) {
            if(err){
                console.error(err);
                return process.exit(1);
            }

            console.log(CONFIG_TAG + JSON.stringify(config) + CONFIG_TAG);
            return process.exit();
        });
    });
}

module.exports = spawner;
