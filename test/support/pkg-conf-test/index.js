var configr8 = require(process.argv[2]);

var config = configr8({ name: 'foo' })({}, {});

if ( config instanceof Error ) {
    console.error(config);
    process.exit(1);
}

console.log(
    JSON.stringify(
        config,
        null,
        2
    )
);
