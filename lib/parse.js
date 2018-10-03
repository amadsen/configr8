/*
1. strip json comments
2. JSON.parse() and return the result.
*/

var cleanJson = require('strip-json-comments');
var trike = require('trike');

function parse ( fromJson ) {
    return trike(function() {
        return JSON.parse( cleanJson(fromJson) );
    });
}

module.exports = parse;
