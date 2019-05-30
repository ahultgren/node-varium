const duplicatedDefinitions = (manifest) => {
  const duplicates = [];
  const duplicateMap = {};

  manifest.forEach((definition) => {
    if (duplicateMap[definition.name]) {
      duplicates.push(definition.name);
    }
    duplicateMap[definition.name] = 1;
  });

  return duplicates;
};

const parseTokens = (definitions, token) => {
  /* eslint no-param-reassign: 0 */
  if (token.type === "DeclarationName") {
    return [...definitions, {
      name: token.value,
    }];
  } else if (token.type === "DeclarationType") {
    definitions[definitions.length - 1].type = token.value;
  } else if (token.type === "DeclarationDefault") {
    definitions[definitions.length - 1].default = token.value;
  }
  return definitions;
};

module.exports = (manifest) => {
  const definitions = manifest.reduce(parseTokens, []);
  const duplicated = duplicatedDefinitions(definitions);

  if (duplicated.length) {
    const stack = duplicated.map(definition =>
      `  Env var ${definition.name} is declared more than once.`
    ).join("\n");
    const err = new Error("Varium: Error reading manifest");
    err.stack = stack;
    throw err;
  } else {
    return definitions;
  }
};
