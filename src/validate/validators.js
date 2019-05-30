module.exports = {
  String: value => value,
  Int: (value) => {
    const validValue = parseInt(value, 10);

    if (value === "") {
      return undefined;
    }

    if (
      typeof validValue === "number"
      && (isNaN(validValue) || String(validValue) !== value)
    ) {
      throw new Error("value is not a valid Int");
    }

    return validValue;
  },
  Float: (value) => {
    const validValue = parseFloat(value, 10);

    if (value === "") {
      return undefined;
    }

    if (typeof validValue === "number" && (isNaN(validValue) || isNaN(value))) {
      throw new Error("value is not a valid Float");
    }

    return validValue;
  },
  Bool: (value) => {
    if (value === "") {
      return undefined;
    } else if (value === "false") {
      return false;
    } else if (value === "true") {
      return true;
    } else {
      throw new Error("value is not a valid Bool");
    }
  },
  Json: (value) => {
    try {
      return value === "" ? undefined : JSON.parse(value);
    } catch (e) {
      throw new Error("value is not a valid Json");
    }
  },
};
