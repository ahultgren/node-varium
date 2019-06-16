# Varium reference

## Varium manifest syntax

```
Varium
    Syntax:
        <Declaration>
        <Declaration> # <Comment>
        # <Comment>
        ""
    Each line must contain a declaration or be an emtpy line.
    Might be followed by a comment.
    Whitespace between tokens, except for newlines, is insignificant.

Declaration
    Syntax:
        <Varname> : <Type>
        <Varname> : <Type> |
        <Varname> : <Type> | <Default>
    A declaration consists of a name and a type.
    It might be followed by a default value.
    Examples:
        A_VAR : String
        A_VAR : String |
        A_VAR : String | Default value
        A_VAR : String | "Default\nvalue"

Varname
    Allowed characters:
        /[a-z]+/i
    The name of the variable, as found in the environment. May only contain
    ascii alfa-numeric characters, and are by convention usually named using
    uppercase letters.
    Example:
        BASE_URL

Type
    Allowed characters:
        /[a-z]+/i
    The type of the variable, must be one of the built-in types or a custom
    type.
    Example:
        String

Default
    Syntax:
        LiteralDefault
        QuotedDefault
    Either a literal string which is not escaped, or a quoted string which is.

LiteralDefault
    Allowed characters:
        /[^"][^#]*/i
    May contain any value except newline and hash.
    May not start with a quote since that signifies the start of an escaped
    string (see below). Whitespace before and after the value is stripped.
    Example:
        This is a string!

QuotedDefault
    Syntax:
        "</[^"]+/i>"
    Surround the value with quotes if the value contains "#" or escaped
    characters. May contain all other characters except newlines and quotes ("),
    which must be escaped.
    Example:
        "http://example.com/#hash"

Comment
    Allowed characters: /.*/
    May contain any character. Is read until the end of the line. Whitespace
    between the "#" character and the first comment character is stripped.
    Example:
        # This is a comment
```

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

Options.types
    Add your own custom types or overwrite the built-in ones. See custom types
    below.

Options.env
    Provide another object as the environment. By default `process.env` is used.
    If you use dotenv, make sure `require('dotenv').config()` is called before
    initializing varium.

Options.manifestPath
    Provide another path to the manifest file. The default is
    `${projectRootfolder}/env.manifest` where to root is deduced through
    `require.main.filename`. Use an absolute path if you want your path to not
    be relative to that.

Options.noProcessExit
    Set to true if you do not want the process to exit with an error on
    valdiation errors.


Config.get(VarName) -> value
    Takes the name of an environment variable and returns its value. Will throw
    if the environment variable is not defined.

```

## Custom types

A custom type is a function that takes one value: the value read from the
environment, or the default value provided from the manifest, if any. It is
always a string, and it's only an empty string if the variable is optional or if
an empty string was provided from the environment (e.g. `BASE_URL=`).

It returns a proper value according to the type, or throws an error.

```js
varium({
  types: {
    Url: (value) => {
      if (value === "") {
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

[Debug][debug] is used for logging if installed. Thus if you need to debug
something, set `DEBUG=varium:*`. **Note** that it's not advised to use
this level in production. It logs the environment variable values and may thus
potentially log secrets, which is widely frowned upon.

[debug]: https://www.npmjs.com/package/debug
