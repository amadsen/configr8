var configr8 = require('../../');
process.send( configr8({ name: process.argv[2] })({}, {}) );
