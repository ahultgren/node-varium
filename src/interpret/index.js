const parse = require("./parse");
const lex = require("./lex");

module.exports = input => parse(lex(input));
