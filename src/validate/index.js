const R = require("ramda");
const debug = require("debug");

const logName = debug("varium:validate:name");
const logValue = debug("varium:validate:value");

const isnt = x => x === "" || x === undefined;

const levDistance = (a, b) => {
  if (typeof a === "undefined") return 9000;
  if (typeof b === "undefined") return 9000;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  if (a.toLowerCase() === b.toLowerCase()) return 0;

  const matrix = [];

  // increment along the first column of each row
  let i;
  for (i = 0; i <= b.length; i += 1) {
    matrix[i] = [i];
  }

  // increment each column in the first row
  let j;
  for (j = 0; j <= a.length; j += 1) {
    matrix[0][j] = j;
  }

  // Fill in the rest of the matrix
  for (i = 1; i <= b.length; i += 1) {
    for (j = 1; j <= a.length; j += 1) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, // substitution
                         Math.min(matrix[i][j - 1] + 1, // insertion
                         matrix[i - 1][j] + 1)); // deletion
      }
    }
  }

  return matrix[b.length][a.length];
};


const Validators = {
  String: (value, def) => value || def,
  Int: (value, def) => {
    const validDef = isnt(def) ? undefined : parseInt(def, 10);
    const validValue = isnt(value) ? undefined : parseInt(value, 10);

    if (typeof validDef === "number" && (isNaN(validDef) || String(validDef) !== def)) {
      throw new Error("default is not a valid Int");
    }

    if (typeof validValue === "number" && (isNaN(validValue) || String(validValue) !== value)) {
      throw new Error("value is not a valid Int");
    }

    return !isNaN(validValue)
      ? validValue
      : validDef;
  },
  Float: (value, def) => {
    const validDef = isnt(def) ? undefined : parseFloat(def, 10);
    const validValue = isnt(value) ? undefined : parseFloat(value, 10);

    if (typeof validDef === "number" && (isNaN(validDef) || isNaN(def))) {
      throw new Error("default is not a valid Float");
    }

    if (typeof validValue === "number" && (isNaN(validValue) || isNaN(value))) {
      throw new Error("value is not a valid Float");
    }

    return !isNaN(validValue)
      ? validValue
      : validDef;
  },
  Bool: (value, def) => {
    let validDef;
    let validValue;

    if (def === "false") { validDef = false; }
    else if (def === "true") { validDef = true; }
    else if (isnt(def)) { validDef = undefined; }
    else { throw new Error("default is not a valid Bool"); }

    if (value === "false") { validValue = false; }
    else if (value === "true") { validValue = true; }
    else if (isnt(value)) { validValue = undefined; }
    else { throw new Error("value is not a valid Bool"); }

    return typeof validValue === "boolean" ? validValue : validDef;
  },
  Json: (value, def) => {
    let validDef;
    let validValue;

    try {
      validDef = isnt(def) ? undefined : JSON.parse(def);
    } catch (e) {
      throw new Error("default is not a valid Json");
    }

    try {
      validValue = isnt(value) ? undefined : JSON.parse(value);
    } catch (e) {
      throw new Error("value is not a valid Json");
    }

    return validValue !== undefined ? validValue : validDef;
  },
};


const suggestValidatorName = (validators, typeName) => {
  const possibleMatches = Object.keys(validators)
    .map(validatorType => ({
      type: validatorType,
      distance: levDistance(validatorType, typeName)
    }))
    .filter(validator => validator.distance < 3);

  return R.sortBy(R.prop('distance'), possibleMatches)
    .map(validator => validator.type);
};

module.exports = (customValidators, manifest, env) => {
  const validators = Object.assign({}, Validators, customValidators);

  return manifest.map((definition) => {
    if (!validators[definition.type]) {
      const suggestions = suggestValidatorName(validators, definition.type);

      let errorMessage = "";

      if (suggestions.length === 0) errorMessage = `Unable to offer any suggestions.`;
      else if (suggestions.length === 1 || suggestions[0].distance === 0) {
        errorMessage = `Maybe you meant ${suggestions[0]}?`;
      }
      else { errorMessage = `Maybe you meant one of these: ${suggestions.join('|')}`; }

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
