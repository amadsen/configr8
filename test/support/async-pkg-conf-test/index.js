var configr8 = require(process.argv[2]);

configr8({ name: 'foo' })({}, {}, function (err, config) {
    if ( err ) {
        console.error(config);
        process.exit(1);
    }

    if ( config instanceof Error ) {
        console.error(config);
        process.exit(1);
    }

    console.log('=START=');
    console.log(
        JSON.stringify(
            config,
            null,
            2
        )
    );
});
