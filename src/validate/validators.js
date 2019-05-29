const isnt = x => x === "" || x === undefined;

module.exports = {
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
