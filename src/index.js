const fs = require("fs");
const path = require("path");
const interpret = require("./interpret");
const validate = require("./validate");
const nameError = require("./util/suggest");

const reader = (config, env, manifestString) => {
  const result = validate(config.types, interpret(manifestString), env);
  const errors = result.map(x => x.error$).filter(Boolean);

  if (errors.length) {
    const msg = "Varium: Error reading env:";
    const stack = `${msg}\n  ${errors.join("\n  ")}`;

    if (config.noProcessExit) {
      const err = new Error(msg);
      err.stack = stack;
      throw err;
    } else {
      /* eslint no-console: 0 */
      console.error(stack);
      process.exit(1);
    }
  }

  const values = Object.assign.apply(null, [{}].concat(result));

  return new Proxy(values, {
    get(target, prop) {
      if (!Object.prototype.hasOwnProperty.call(target, prop)) {
        if (prop === "get") {
          return (name) => {
            throw new Error(`Varium upgrade notice: config.get("${name}") is obsolete. Access the property directly using config.${name}`);
          };
        } else {
          const suggestion = nameError(Object.keys(values), prop);
          throw new Error(`Varium: Undeclared env var '${prop}'.\n${suggestion}`);
        }
      } else {
        return target[prop];
      }
    }
  });
};

const loader = (manifestPath) => {
  const appDir = path.dirname(require.main.filename);
  const absPath = path.resolve(appDir, manifestPath);

  try {
    return fs.readFileSync(absPath, { encoding: "utf8" });
  } catch (e) {
    throw new Error(`Varium: Could not find a manifest at ${absPath}`);
  }
};

module.exports = ({
  types = {},
  env = process.env,
  manifestPath = "env.manifest",
  noProcessExit = false,
} = {}) => reader({ types, noProcessExit }, env, loader(manifestPath));

module.exports.reader = reader;
