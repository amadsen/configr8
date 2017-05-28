var configr8 = require('../../');

var config = configr8({ name: process.argv[2] || 'foo' })({}, {});

if ( config instanceof Error ) {
    console.error(config);
    process.exit(1);
} else {
    console.log(
        JSON.stringify(
            config,
            null,
            2
        )
    );
}

console.log('=END=');
