var test = require('tape');

var spawnSync = require('../lib/spawn-sync.js');

test('spawnSync() should return the stderr of the spawned file as an Error', function(assert){
    var r = spawnSync('test', {error: true}, {}, {}, __filename);
    assert.ok(r instanceof Error, 'Synchronously returned an error as expected');
    assert.end();
});

test('spawnSync() should return the JSON-encoded stdout of the spawned file as an object', function(assert){
    var expected = {
            foo: 1,
            bar: null,
            baz: "buzz"
        },
        r = spawnSync('test', {}, {expected: expected}, {}, __filename);

    assert.same(r, expected, 'Synchronously returned expected object');
    assert.end();
});

if(module){
    module.exports = function (cfg) {
        return function (def, ovr, done) {
            if(cfg.error){
                return done(new Error('Requested error'));
            }
            return done(null, def.expected);
        }
    }
}
