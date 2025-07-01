import { Validators } from "./types";

const validators: Validators = {
  String: (value: string) => value,
  Int: (value: string) => {
    const validValue = parseInt(value, 10);

    if (value === "") {
      return undefined;
    }

    if (
      typeof validValue === "number" &&
      (isNaN(validValue) || String(validValue) !== value)
    ) {
      throw new Error("value is not a valid Int");
    }

    return validValue;
  },
  Float: (value: string) => {
    const validValue = parseFloat(value);

    if (value === "") {
      return undefined;
    }

    if (
      typeof validValue === "number" &&
      (isNaN(validValue) || isNaN(value as unknown as number))
    ) {
      throw new Error("value is not a valid Float");
    }

    return validValue;
  },
  Bool: (value: string) => {
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
  Json: (value: string) => {
    try {
      return value === "" ? undefined : JSON.parse(value);
    } catch (e) {
      throw new Error("value is not a valid Json");
    }
  },
};

export default validators;
