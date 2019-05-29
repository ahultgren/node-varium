const debug = require("debug");
const Validators = require("./validators");
const validatorError = require("./validatorError");

const logName = debug("varium:validate:name");
const logValue = debug("varium:validate:value");

module.exports = (customValidators, manifest, env) => {
  const validators = Object.assign({}, Validators, customValidators);

  return manifest.map((definition) => {
    if (!validators[definition.type]) {
      const errorMessage = validatorError(validators, definition.type);

      return {
        error$: `The type ${definition.type} for env var "${definition.name}" does not exist.\n${errorMessage}`,
      };
    }
    if (env[definition.name] === undefined && definition.default === undefined) {
      return {
        error$: `Env var "${definition.name}" requires a value.`,
      };
    }

    logName(definition.name);
    logValue(`Value: ${env[definition.name]}`);
    logValue(`Default: ${definition.default}`);

    try {
      return {
        [definition.name]: validators[definition.type](env[definition.name], definition.default),
      };
    } catch (e) {
      return {
        error$: `Env var "${definition.name}" is invalid: ${e.message}`,
      };
    }
  });
};

module.exports.validators = Validators;
