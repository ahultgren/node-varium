const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");
const parser = require("./syntax-parser");

const syntaxPath = path.join(__dirname, "./syntax.yml");
const syntaxYml = fs.readFileSync(syntaxPath, { encoding: "utf8" });

const syntax = yaml.safeLoad(syntaxYml);

module.exports = chars => parser(syntax, "Noop", chars);
