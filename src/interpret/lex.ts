import fs from "fs";
import path from "path";
import yaml from "js-yaml";
import parser from "./syntax-parser";
import { Syntax } from "./types";

const syntaxPath = path.join(__dirname, "./syntax.yml");
const syntaxYml = fs.readFileSync(syntaxPath, { encoding: "utf8" });

const syntax = yaml.load(syntaxYml) as Syntax;

const lex = (chars: string): ReturnType<typeof parser> =>
  parser(syntax, "Noop", chars);

export default lex;
