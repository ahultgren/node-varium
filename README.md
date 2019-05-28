# Varium

Varium is both a syntax which lets you declare which environment variables you
use in a manifest, and a library that validates the existence and types of these
variables.

If you've ever typed `CMD+SHIFT+F process.env` looking for which environment
variables you need to get your local instance up and running, this library is
for you.

## Installation

`npm install varium --save`

_Requires node v6.5 or above._

## Usage example

Create a file called `env.manifest` in the project root. It should contain all
environment variables used in the project. For example:

```
API_BASE_URL : String
API_SECRET : String
NUMBER_OF_ITEMS : Int | # Optional variable
ENABLE_DEBUG : Bool | False # Enable to print all the things. Default is off
```

Then create the file which all your other files imports to obtain the config.
For example `config/index.js`. This needs to at least contain:

```js
const varium = require('varium');

module.exports = varium();
```

In the rest of your project you use this file to read environment variables:

```js
const config = require('../config');
const url = config.get('API_BASE_URL');

// An error will be thrown if you try to load an undeclared variable:
const wrong = config.get('AIP_ABSE_ULR');
// -> Error('Varium: Undeclared env var "AIP_ABSE_ULR"')
```

Your environment now needs to contain the required variables. If you use a
library to load `.env`-files, the `.env` could contain this:

```bash
API_BASE_URL=https://example.com/
API_SECRET=1337
NUMBER_OF_ITEMS=3
```

To abort builds during CI when environment variables are missing, just include
the config file. For example, on heroku the following would be enough:

```js
{
  "scripts": {
    "heroku-postbuild": "node ./config"
  }
}
```

_Note:_ this library does not load environment variables from .env or similar.
For that, use an env loader such as node-foreman.

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

## Documentation

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

A custom type is a function that takes two values, the value read from the
environment and the default value, if any, provided from the manifest. Both are
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

## Motivation

The fundamental principles are that you want to:

1. have _one_ place where _all_ environment variables are declared and
  documented, to not hunt arount the code base when setting up or deploying your
  app,
2. _abort_ CI and/or builds if any environment variable is missing,
3. prevent developers (yourself) from ever using an undeclared env var,
4. load other types than strings. E.g. treay `SOME_FLAG=false` as a boolean and
  avoid `"41" + 1 = 411` errors.


[debug]: https://www.npmjs.com/package/debug
