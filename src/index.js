const fs = require("fs");
const path = require("path");
const R = require("ramda");
const interpret = require("./interpret");
const validate = require("./validate");

const reader = R.curry((config, env, manifestString) => {
  const result = validate(config.types, interpret(manifestString), env);
  const errors = result.filter(R.has("error$")).map(R.prop("error$"));

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

  const values = R.mergeAll(result);

  return {
    get: (name) => {
      if (Object.prototype.hasOwnProperty.call(values, name)) {
        return values[name];
      } else {
        throw new Error(`Varium: Undeclared env var "${name}"`);
      }
    },
  };
});

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
}) => reader({ types, noProcessExit }, env, loader(manifestPath));

module.exports.reader = reader;
