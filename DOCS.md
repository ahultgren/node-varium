# Varium reference

## Varium manifest syntax

```
Varium
    Declaration[ # Comment] or [# Comment]
    Each line must contain a declaration or be an emtpy line.
    Might be followed by a comment.

Declaration
    Varname : Type[ |[ Default]]
    A declaration consists of a name and a type.
    It might be followed by a default value.

Varname
    /a-z+/i
    The name of the variable, as found in the environment. May only contain
    ascii alfa-numeric characters, and are by convention usually named using
    uppercase letters.
    Example: BASE_URL

Type
    /a-z+/i
    The type of the variable, must be one of the built-in types or a custom
    type.
    Example: String

Default
    LiteralDefault or EscapedDefault

LiteralDefault
    /[^"][^#]*/i
    May contain any value except newline and hash.
    May not start with a quote since that signifies the start of an escaped
    string (see below).
    Example: This is a string!

EscapedDefault
    "EscapedDefaultContent"
    Surround the value with quotes if the value contains "#".
    Example: "http://example.com/#hash"

EscapedDefaultContent
    /[^"]+/i
    All characters are allowed except newlines and quotes ("), which must be
    escaped.
```

All whitespace between tokens, except for newlines, is ignored.

## Built-in types

```
Int
    A positive or negative integer.
    Example: 1000, -3

Float
    A positive or negative float.
    Example: 10.1, -101.101, 42

String
    A string of any characters
    Example: "This is a string!".

Bool
    It's true or false.
    Example: true, false

Json
    Basic support for complex data such as objects and arrays.
    Example: [{"name": "value", "number": 1}, [3]]
```

## JS API

```
varium(Options) -> Config

Options { types, env, manifestPath, noProcessExit }

Options.types
    Add your own custom types or overwrite the built-in ones. See custom types
    below.

Options.env
    Provide another object as the environment. By default `process.env` is used.

Options.manifestPath
    Provide another path to the manifest file. The default is
    `${projectRootfolder}/env.manifest` where to root is deduced through
    `require.main.filename`. Use an absolute path if you want your path to not
    be relative to that.

Options.noProcessExit
    Set to true if you do not want the process to exit with an error on
    valdiation errors.

Config { get }

Config.get(VarName) -> value
    Takes the name of an environment variable and returns its value. Will throw
    if the environment variable is not defined.

```

## Custom types

A custom type is a function that takes two values: the value read from the
environment and the default value provided from the manifest, if any. Both are
always strings.

It returns a proper value according to the type, or throws an error.

```js
varium({
  types: {
    Url: (val, def) => {
      const value = val || def;

      if (!value) {
        return undefined;
      }

      if (!validateUrl(value)) {
        throw new Error('Invalid url');
      } else {
        return value;
      }
    }
  }
})
```

## Logs

[Debug][debug] is used for logging. Thus if you need to debug something, set
`DEBUG=varium:*`. Notice, however, that it's not advised to use this level in
production. It logs env var values and may thus potentially log secrets, which
is generally frowned upon.

[debug]: https://www.npmjs.com/package/debug
