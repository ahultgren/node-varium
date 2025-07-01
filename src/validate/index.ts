import defaultValidators from "./validators";
import validatorError from "../util/suggest";
import { Env, ValidationError, Validators } from "./types";
import { Definition } from "../interpret/types";

let logName;
let logValue;

try {
  // eslint-disable-next-line
  const debug = await import("debug");
  logName = debug("varium:validate:name");
  logValue = debug("varium:validate:value");
} catch (e) {
  logName = () => {};
  logValue = () => {};
}

export default function validate(
  customValidators: Validators | undefined | null,
  manifest: Definition[],
  env: NodeJS.ProcessEnv
): (ValidationError | Env)[] {
  const validators = Object.assign({}, defaultValidators, customValidators);

  return manifest.map((definition) => {
    const validator = validators[definition.type!];
    const envValue = env[definition.name];
    const envDefault = definition.default;

    if (!validator) {
      const errorMessage = validatorError(
        Object.keys(validators),
        definition.type!
      );

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

    const value =
      envValue === undefined || envValue === "" ? envDefault : envValue;

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
}

export { defaultValidators };
