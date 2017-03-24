/*
1. strip json comments
2. JSON.parse() and return the result.
*/

var cleanJson = require('strip-json-comments');

function parse ( fromJson, done ) {
    var result;
    try {
        result = JSON.parse( cleanJson(fromJson) );
    } catch (e) {
        return done(e);
    }

    return done(null, result);
}

module.exports = parse;
