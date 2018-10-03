var configr8 = require('../../../');
process.send( configr8({ name: 'test-argv', useArgv: true, useArgvEnv:true })({}, {}) );
