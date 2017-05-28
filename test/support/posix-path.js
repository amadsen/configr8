var path = require('path');

function posixPath () {
    var args = [].slice.call(arguments);

    return path.posix.join.apply( path.posix,
        [path.posix.sep].concat( path.join.apply(path, args)
            .split( path.sep )
            .filter( function (part, i) {
                return !(i === 0 && /:/.test(part));
            })
        )
    )
}

module.exports = posixPath;
