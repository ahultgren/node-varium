const R = require("ramda");

let log;

try {
  // eslint-disable-next-line
  const debug = require("debug");
  log = debug("varium:lexer");
} catch (e) {
  log = () => {};
}

const wrapNonArrays = R.ifElse(
  Array.isArray,
  R.identity,
  R.of);

const harmonizeSyntax = R.map(R.map(wrapNonArrays));

const Input = (data) => {
  let i = 0;
  return {
    peek: () => data[i] === undefined ? "EOF" : data[i],
    skip: () => {
      i += 1;
    },
    eof: () => i > data.length,
    pos: () => i,
  };
};

const matchCondition = (patterns, char) => (condition) => {
  const pattern = patterns[condition] || condition;

  if (!pattern) {
    throw new Error(`Unknown condition ${condition}`);
  }

  const parts = pattern.match(/^\/(.*)\/([a-z]*)/);

  if (!parts) {
    throw new Error(`Invalid condition ${condition}`);
  }

  const safeRegexStr = parts[1][0] === "^" ? parts[1] : `^(${parts[1]})$`;
  const regex = new RegExp(safeRegexStr, parts[2]);

  return String(char).match(regex);
};

const FailSafe = (lim) => {
  const limit = Math.max(10, lim);
  let lastPos = -1;
  let count = 0;

  return (pos) => {
    if (pos === lastPos) {
      count += 1;
    } else {
      count = 0;
    }
    lastPos = pos;

    return count < limit;
  };
};

module.exports = (rawSyntax, initialState, chars) => {
  const tokens = [];
  const syntax = harmonizeSyntax(rawSyntax);
  const input = Input(chars);
  const failSafe = FailSafe(chars.length);

  let done = false;
  let currentStateName = initialState;
  let store = "";

  const functions = {
    take() {
      store += input.peek();
      input.skip();
    },
    save() {
      tokens.push({
        type: currentStateName,
        value: store,
      });
      store = "";
    },
    trim() {
      store = store.trim();
    },
    skip() {
      input.skip();
    },
    success() {
      done = true;
    },
  };

  const patterns = {
    EOF: "/EOF/",
    WS: "/ |\\t|\\n/",
    EOL: "/\\n/",
    _: "/.*/s",
  };

  const doAction = (action) => {
    if (functions[action]) {
      functions[action]();
    } else if (syntax[action]) {
      currentStateName = action;
    } else {
      throw new Error(`Unknown action ${action}`);
    }
  };

  while (!done) {
    const currentChar = input.peek();
    const currentState = syntax[currentStateName];

    const condition = R.find(matchCondition(patterns, currentChar), Object.keys(currentState));
    const actions = currentState[condition];

    log(currentStateName, currentChar, actions);

    if (actions) {
      actions.forEach(doAction);
    } else {
      throw new Error(`Unexpected '${currentChar}' in ${currentStateName}`);
    }

    if (!failSafe(input.pos())) {
      throw new Error(`Endless cycle detected in state ${currentStateName} for condition ${condition}: ${actions}`);
    }

    if (input.eof()) {
      throw new Error(`Unexpected end of string in state ${currentStateName}`);
    }
  }

  return tokens;
};
