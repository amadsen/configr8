var fs = require('fs'),
    parse = require('./parse.js');

function processEachFile (file, cb) {
    fs.readFile(
        file,
        'utf8',
        function (err, data) {
            /*
            If we can't read a file that we found via globby or we can't parse
            it, return the error so it can be collected in to the config.
            */
            return err?
                cb(null, {
                    file: file,
                    error: err
                }) :
                parse(data, function (err, obj) {
                    if (err) {
                        return cb(null, {
                            file: file,
                            error: err
                        });
                    }
                    return cb(null, {
                        file: file,
                        conf: obj
                    });
                });
        }
    );
}

module.exports = processEachFile;
