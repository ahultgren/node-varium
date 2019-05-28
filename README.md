# Varium

Varium is:

* a syntax which lets you declare all used environment variables in a manifest,
* a library that validates the existence and format of these variables,
* and a library which casts these values to their proper types.

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
ENABLE_DEBUG : Bool | False # Enable to print all the things. False if unset
```

Then create the file which all your other files imports to obtain the config.
For example `config/index.js`. This needs to at least contain:

```js
const varium = require('varium');

module.exports = varium();
```

Import this file in the rest of your project to read environment variables:

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

For the complete api and syntax (and how to integrate e.g. dot-env), see the
[docs](./DOCS.md).

## Motivation

The fundamental idea is that you want to:

1. have _one_ place where _all_ environment variables are declared and
  documented, to not hunt arount the code base when setting up or deploying your
  app,
2. _abort_ CI and/or builds if any environment variable is missing,
3. prevent developers (yourself) from ever using an undeclared env var,
4. load other types than strings. E.g. treay `SOME_FLAG=false` as a boolean and
  avoid `"41" + 1 = 411` errors.
