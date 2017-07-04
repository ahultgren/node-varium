const R = require("ramda");

const duplicatedDefinitions = R.pipe(
  R.groupBy(R.prop("name")),
  R.values,
  R.filter(R.compose(R.lt(1), R.prop("length"))),
  R.map(R.head)
);

module.exports = R.pipe(
  R.reduce((definitions, token) => {
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
  }, []),
  (manifest) => {
    const duplicated = duplicatedDefinitions(manifest);

    if (duplicated.length) {
      const stack = duplicated.map(definition =>
        `  Env var ${definition.name} is declared more than once.`
      ).join("\n");
      const err = new Error("Varium: Error reading manifest");
      err.stack = stack;
      throw err;
    } else {
      return manifest;
    }
  }
);
