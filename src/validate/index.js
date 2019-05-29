const debug = require("debug");
const Validators = require("./validators");
const validatorError = require("./validatorError");

const logName = debug("varium:validate:name");
const logValue = debug("varium:validate:value");

module.exports = (customValidators, manifest, env) => {
  const validators = Object.assign({}, Validators, customValidators);

  return manifest.map((definition) => {
    const validator = validators[definition.type];
    const envValue = env[definition.name];
    const envDefault = definition.default;

    if (!validator) {
      const errorMessage = validatorError(validators, definition.type);

      return {
        error$: `The type ${definition.type} for env var "${definition.name}" does not exist.\n${errorMessage}`,
      };
    }

    if (envValue === undefined && envDefault === undefined) {
      return {
        error$: `Env var "${definition.name}" requires a value.`,
      };
    }

    logName(definition.name);
    logValue(`Value: ${envValue}`);
    logValue(`Default: ${envDefault}`);

    try {
      return {
        [definition.name]: validator(envValue, envDefault),
      };
    } catch (e) {
      return {
        error$: `Env var "${definition.name}" is invalid: ${e.message}`,
      };
    }
  });
};

module.exports.validators = Validators;
