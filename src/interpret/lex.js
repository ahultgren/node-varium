const debug = require("debug");

const logTokens = debug("varium:lexer:tokens");

const Input = (data) => {
  let i = 0;
  return {
    peek: () => data[i] === undefined ? "\n" : data[i],
    pop: () => {
      i += 1;
      return data[i - 1] === undefined ? "\n" : data[i - 1];
    },
    eof: () => i >= data.length,
  };
};

const State = {
  Noop: Symbol("Noop"),
  DeclarationName: Symbol("DeclarationName"),
  DeclarationSeparator: Symbol("DeclarationSeparator"),
  DeclarationType: Symbol("DeclarationType"),
  DeclarationEnd: Symbol("DeclarationEnd"),
  DeclarationDefaultStart: Symbol("DeclarationDefaultStart"),
  QuotedDeclarationDefault: Symbol("QuotedDeclarationDefault"),
  DeclarationDefault: Symbol("DeclarationDefault"),
  Comment: Symbol("Comment"),
};

const validDeclarationChar = /[a-zA-Z0-9_]/;
const validComment = /[#]/;
const whiteSpace = /[ \t]/;
const newLine = /[\n]/;
const validDeclarationSeparator = /[:]/;
const validTypeChar = /[a-zA-Z]/;
const validDefaultStart = /[|]/;
const validDefaultChar = /[^#\n|]/;
const validQuote = /["]/;
const escapeChar = /[\\]/;
const validTypeEnd = /[ \t\n|#]/;

module.exports = (chars) => {
  const input = Input(chars);
  const tokens = [];
  let state = State.Noop;
  let currentToken = "";
  let escaped = false;
  let char = "";
  let keepGoing = true;

  while (keepGoing) {
    char = input.peek();

    if (input.eof()) {
      keepGoing = false;
    }

    if (state === State.Noop) {
      if (char.match(validDeclarationChar)) {
        state = State.DeclarationName;
        currentToken = "";
      } else if (char.match(validComment)) {
        state = State.Comment;
        input.pop();
      } else if (char.match(whiteSpace) || char.match(newLine)) {
        input.pop();
      } else {
        throw new SyntaxError(`Unexpected ${char}`);
      }
    } else if (state === State.DeclarationName) {
      if (char.match(validDeclarationChar)) {
        currentToken += input.pop();
      } else if (char.match(whiteSpace) || char.match(validDeclarationSeparator)) {
        tokens.push({
          type: "DeclarationName",
          value: currentToken,
        });
        state = State.DeclarationSeparator;
      } else {
        throw new SyntaxError(`Unexpected ${char} in DeclarationName`);
      }
    } else if (state === State.DeclarationSeparator) {
      if (char.match(validTypeChar)) {
        state = State.DeclarationType;
        currentToken = "";
      } else if (char.match(validDeclarationSeparator) || char.match(whiteSpace)) {
        // TODO Check multiple chars to ensure " *: *"
        input.pop();
      } else {
        throw new SyntaxError(`Unexpected ${char} in DeclarationSeparator`);
      }
    } else if (state === State.DeclarationType) {
      if (char.match(validTypeChar)) {
        currentToken += input.pop();
      } else if (char.match(validTypeEnd)) {
        tokens.push({
          type: "DeclarationType",
          value: currentToken,
        });
        state = State.DeclarationEnd;
      } else {
        throw new SyntaxError(`Unexpected char ${char} in DeclarationType`);
      }
    } else if (state === State.DeclarationEnd) {
      if (char.match(whiteSpace)) {
        input.pop();
      } else if (char.match(validDefaultStart)) {
        input.pop();
        state = State.DeclarationDefaultStart;
      } else if (char.match(newLine) || char.match(validComment)) {
        state = State.Noop;
      } else {
        throw new SyntaxError(`Unexpected char ${char} in DeclarationEnd`);
      }
    } else if (state === State.DeclarationDefaultStart) {
      if (char.match(whiteSpace)) {
        input.pop();
      } else if (char.match(newLine) || char.match(validComment)) {
        tokens.push({
          type: "DeclarationDefault",
          value: "",
        });
        state = State.Noop;
      } else if (char.match(validQuote)) {
        state = State.QuotedDeclarationDefault;
        currentToken = "";
        input.pop();
      } else if (char.match(validDefaultChar)) {
        state = State.DeclarationDefault;
        currentToken = "";
      } else {
        throw new SyntaxError(`Unexpected char ${char} in DeclarationDefaultStart`);
      }
    } else if (state === State.QuotedDeclarationDefault) {
      if (char.match(validQuote) && !escaped) {
        tokens.push({
          type: "DeclarationDefault",
          value: currentToken,
        });
        state = State.Noop;
        input.pop();
      } else if (char.match(escapeChar) && !escaped) {
        escaped = true;
        input.pop();
      } else {
        currentToken += input.pop();
        escaped = false;
      }
    } else if (state === State.DeclarationDefault) {
      if (char.match(validDefaultChar)) {
        currentToken += input.pop();
      } else {
        state = State.Noop;
        tokens.push({
          type: "DeclarationDefault",
          value: currentToken.trim(),
        });
      }
    } else if (state === State.Comment) {
      input.pop();
      if (char.match(newLine)) {
        state = State.Noop;
      }
    } else {
      throw new SyntaxError(`Seriously wtf just happened? Debug: ${state}`);
    }
  }

  logTokens(tokens);
  return tokens;
};
