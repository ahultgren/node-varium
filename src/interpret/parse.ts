import { Definition, Token } from "./types";

function duplicatedDefinitions(manifest: Definition[]) {
  const duplicates: string[] = [];
  const duplicateMap = {};

  manifest.forEach((definition) => {
    if (duplicateMap[definition.name]) {
      duplicates.push(definition.name);
    }
    duplicateMap[definition.name] = 1;
  });

  return duplicates;
}

function parseTokens(definitions: Definition[], token: Token): Definition[] {
  /* eslint no-param-reassign: 0 */
  if (token.type === "DeclarationName") {
    return [
      ...definitions,
      {
        name: token.value,
        type: "",
      },
    ];
  } else if (token.type === "DeclarationType") {
    definitions[definitions.length - 1].type = token.value;
  } else if (token.type === "DeclarationDefault") {
    definitions[definitions.length - 1].default = token.value;
  }
  return definitions;
}

export default (tokens: Token[]) => {
  const definitions = tokens.reduce(parseTokens, []);
  const duplicated = duplicatedDefinitions(definitions);

  if (duplicated.length) {
    const stack = duplicated
      .map((name) => `  Env var ${name} is declared more than once.`)
      .join("\n");
    const err = new Error("Varium: Error reading manifest");
    err.stack = stack;
    throw err;
  } else {
    return definitions;
  }
};
