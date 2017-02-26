const fs = require("fs");
const path = require("path");
const R = require("ramda");
const interpret = require("./interpret");
const validate = require("./validate");

const reader = R.curry((config, env, manifestString) => {
  const result = validate(config.validators, interpret(manifestString), env);
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

const loader = R.curry((read, manifestPath) => {
  const absPath = path.resolve(process.cwd(), manifestPath);
  let manifest;

  try {
    manifest = fs.readFileSync(absPath, { encoding: "utf8" });
  } catch (e) {
    throw new Error(`Varium: Could not find env var manifest at ${absPath}`);
  }

  return read(manifest);
});

const Varium = R.curry((validators, env, manifestPath) =>
  loader(reader(validators, env), manifestPath));

module.exports = Varium({});
module.exports.Varium = Varium;
module.exports.reader = reader;
