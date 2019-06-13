const Validators = require("./validators");
const validatorError = require("./validatorError");

let logName;
let logValue;

try {
  // eslint-disable-next-line
  const debug = require("debug");
  logName = debug("varium:validate:name");
  logValue = debug("varium:validate:value");
} catch (e) {
  logName = () => {};
  logValue = () => {};
}

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

    if (envDefault !== undefined) {
      try {
        validator(envDefault);
      } catch (e) {
        return {
          error$: `Default value for "${definition.name}" is invalid: ${e.message}`,
        };
      }
    }

    const value = envValue !== undefined
      ? envValue
      : envDefault;

    try {
      return {
        [definition.name]: validator(value),
      };
    } catch (e) {
      return {
        error$: `Value for "${definition.name}" is invalid: ${e.message}`,
      };
    }
  });
};

module.exports.validators = Validators;
