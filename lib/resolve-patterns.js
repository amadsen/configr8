var path = require('path');

var patternSets = {
    application: [
        "${home}/.${name}rc",
        "${cwd}/.${name}rc",
        "${etc}/${name}rc",
    ],
    "per-directory": [
        "${parents}/.${name}rc",
        "${home}/.${name}rc",
        "${etc}/${name}rc"
    ]
};

function pathSubstitution (key, meta) {
    return 'string' !== typeof meta[key] ?
        false : path.posix.join.apply( 
            path.posix,
            ['/'].concat(
                meta[key]
                .split(path.sep)
                .filter( function (part, i) {
                    return (!(i === 0 && /:/.test(part)));
                })
            )
        );
}

var patternSubstitutions = {
    etc: pathSubstitution.bind(null, 'etc'),
    cwd: pathSubstitution.bind(null, 'cwd'),
    home: pathSubstitution.bind(null, 'home'),
    name: function (meta) {
        // meta.name should always be a string
        return 'string' !== typeof meta.name ? false : meta.name.indexOf('-') < 0 ? meta.name : meta.name+'-';
    },
    parents: function (meta) {
        if ('string' !== typeof meta.cwd ) {
            return false;
        }

        var prefixes = [],
            cwd = path.resolve(meta.cwd),
            parts = cwd.split(path.sep)
                .map( function (part, i) {
                    return (i === 0 && /:/.test(part)) ? path.posix.sep : part;
                });

        while(parts.length > 0){
            /*
            This was tested in the node REPL to ensure the pattern syntax
             would work as intended:
            > globby.sync('{/Users,/}/*.js');
            [ '/test.js' ]
            */
            prefixes.push( path.posix.join.apply(path.posix, ['/'].concat(parts) ) );
            parts.pop();
        }

        return '{'+prefixes.join(',')+'}';
    }
}

var splitPattern = /(\$\{\w+?\})/,
    keyPattern = /^\$\{(\w+)\}$/;
function resolvePatterns (meta, shouldNotFilterName) {
    var patterns = meta.patterns;
    var resolved = ('string' === typeof patterns && patternSets[patterns])?
        patternSets[patterns] : patterns;
    if (!Array.isArray(resolved)) {
        return new Error('configr8 requires that patterns be an array.');
    }

    return resolved.map( function (pattern) {
        return pattern.split(splitPattern)
            .reduce( function (list, part) {
                if (list) {
                    var key = (keyPattern.exec(part) || [])[1],
                        fn,
                        replacement;

                    if (key) {
                        fn = patternSubstitutions[key];
                        // only replace what we know how to replace
                        replacement = 'function' === typeof fn? fn(meta) : false;
                        if ( !(replacement || ('name' === key && shouldNotFilterName)) ) {
                            // short circuit the map because we can't resolve this pattern
                            return false;
                        }
                    }
                    list.push(replacement || part);
                }
                return list;
            }, []);
        })
        .filter( function (list) {
            return !!list;
        })
        .map( function (list) {

            return list.join('')
                // if name has a hyphen, but the pattern just has a file
                // extension after name, we need to do some cleanup
                .replace(/-\./, '.');
        });
}

module.exports = resolvePatterns;
