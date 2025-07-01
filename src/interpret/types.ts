type Definition = {
  name: string;
  type?: string;
  default?: string;
};

type Syntax = Record<
  State,
  {
    [pattern: string]: (State | Action) | (State | Action)[];
  }
>;

type State =
  | "Noop"
  | "DeclarationName"
  | "DeclarationSeparator"
  | "DeclarationSeparatorEnd"
  | "DeclarationType"
  | "DeclarationTypeEnd"
  | "DefaultOrOptional"
  | "DeclarationDefaultStart"
  | "DeclarationDefaultUnquoted"
  | "DeclarationDefaultQuoted"
  | "DeclarationDefault"
  | "Comment";

type Action = "take" | "save" | "trim" | "skip" | "success";

type Patterns = Record<"EOF" | "WS" | "EOL" | "_", string>;

type Token = { type: State; value: string };

export type { Definition, Syntax, Token, State, Action, Patterns };
