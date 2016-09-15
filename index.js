const fs = require("fs");
const path = require("path");
const R = require("ramda");

const loadFile = (filepath) => {
  const absPath = path.resolve(process.cwd(), filepath);
  try {
    return fs.readFileSync(absPath, { encoding: "utf8" });
  } catch (e) {
    throw new Error(`Could not find envvar manifest at ${absPath}`);
  }
};

const commentRegex = / *#.*/g;
const newlinesRegex = /\n/g;
const ruleRegexp = /^(\w+) *: *(\w+) *(\|)* *(.+)*$/;
const parseManifest = (file) => {
  return R.pipe(
    R.replace(commentRegex, ""),
    R.split(newlinesRegex),
    R.map(R.trim),
    R.filter(Boolean),
    R.map((line) => {
      const match = line.match(ruleRegexp);

      if (!match) {
        throw new Error("Invalid envvar manifest rule: " + line);
      }

      const name = match[1];
      const type = match[2];
      const hasDefault = !!match[3];
      const defaultValue = match[4];

      return {
        name,
        type,
        hasDefault,
        defaultValue,
      };
    })
  )(file);
};

const typeParsers = {
  String: (value) => {
    // Not much to do, everything is a string
    return value;
  },
  Int: (value) => {
    if(parseInt(Number(value)) == value
      && !isNaN(parseInt(value, 10))
    ) {
      return Number(value);
    } else {
      return null;
    }
  },
  Float: (value) => {
    if(!isNaN(Number(value))) {
      return Number(value);
    } else {
      return null;
    }
  },
  Bool: (value) => {
    if(value.toLowerCase() === "true") {
      return true;
    } else if(value.toLowerCase() === "false") {
      return false;
    } else {
      return null;
    }
  },
  Json: (value) => {
    try {
      return JSON.parse(value);
    } catch (e) {
      return null;
    }
  },
};

const parseType = (name, type, value) => {
  if(typeParsers[type]) {
    const parsedValue = typeParsers[type](value);

    if(parsedValue !== null) {
      return parsedValue;
    } else {
      throw new Error(`Invalid type for envvar ${name}. Expected ${type}, got ${value}`);
    }
  } else {
    throw new Error(`Unknown envvar type ${type}`);
  }
};

const evaluate = R.curry((env, manifest) => {
  return manifest.reduce((rules, rule) => {
    const value = env[rule.name];

    if (value !== undefined) {
      const cleanValue = parseType(rule.name, rule.type, value);
      rules[rule.name] = cleanValue;
    } else {
      if(rule.hasDefault) {
        const cleanDefault = parseType(rule.name, rule.type, rule.defaultValue);
        rules[rule.name] = cleanDefault;
      } else {
        throw new Error(`Envvar ${rule.type} was not set and did not have a default value`);
      }
    }

    return rules;
  }, {});
});

const create = (values) => {
  return {
    get: (key) => {
      if(values.hasOwnProperty(key)) {
        return values[key];
      } else {
        throw new Error(`The envvar ${key} has not been properly declared`);
      }
    },
  };
};

module.exports = (env, path) => {
  return R.pipe(
    loadFile,
    parseManifest,
    evaluate(env),
    create
  )(path);
};
