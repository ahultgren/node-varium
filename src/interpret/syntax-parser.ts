import R from "ramda";
import { State, Patterns, Syntax, Token, Action } from "./types";

let log: (...args: any[]) => void;

try {
  // eslint-disable-next-line
  const debug = await import("debug");
  log = debug("varium:lexer");
} catch (e) {
  log = () => {};
}

// Hack: convince typescript that R.map maps over objects
const mapObj = R.map as <T, U>(
  fn: (x: T) => U
) => (obj: Record<string, T>) => Record<string, U>;

const wrapNonArrays = R.ifElse(Array.isArray, R.identity, (x) => [x]);
const harmonizeSyntax = mapObj(mapObj(wrapNonArrays));

const Input = (data: string) => {
  let i = 0;
  return {
    peek: () => (data[i] === undefined ? "EOF" : data[i]),
    skip: () => {
      i += 1;
    },
    eof: () => i > data.length,
    pos: () => i,
  };
};

const matchCondition =
  (patterns: Patterns, char: string) => (condition: string) => {
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

    return Boolean(String(char).match(regex));
  };

const FailSafe = (lim: number) => {
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

export default (rawSyntax: Syntax, initialState: State, chars: string) => {
  const tokens: Token[] = [];
  const syntax = harmonizeSyntax(rawSyntax);
  const input = Input(chars);
  const failSafe = FailSafe(chars.length);

  let done = false;
  let currentStateName: State = initialState;
  let store = "";

  const functions: Record<Action, () => void> = {
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

  const patterns: Patterns = {
    EOF: "/EOF/",
    WS: "/ |\\t|\\n/",
    EOL: "/\\n/",
    _: "/(.|\\r\\n|\\r|\\n)*/",
  };

  const doAction = (action: State | Action) => {
    if (functions[action]) {
      functions[action]();
    } else if (syntax[action]) {
      currentStateName = action as State;
    } else {
      throw new Error(`Unknown action ${action}`);
    }
  };

  while (!done) {
    const currentChar = input.peek();
    const currentState = syntax[currentStateName];

    const condition = R.find(
      matchCondition(patterns, currentChar),
      Object.keys(currentState)
    ) as string;
    const actions = currentState[condition];

    log(currentStateName, currentChar, actions);

    if (actions) {
      actions.forEach(doAction);
    } else {
      throw new Error(`Unexpected '${currentChar}' in ${currentStateName}`);
    }

    if (!failSafe(input.pos())) {
      throw new Error(
        `Endless cycle detected in state ${currentStateName} for condition ${condition}: ${actions}`
      );
    }

    if (input.eof()) {
      throw new Error(`Unexpected end of string in state ${currentStateName}`);
    }
  }

  return tokens;
};
