# Varium

Varium is a library and syntax for managing environment variables in a sane way.
You should use it if you want to:

* **declare** all used environment variables in **one place**
* **specify** which **types** they have
* **validate** that they are of the right type
* **cast environment variables** to the right type when used
* **require** certain variables
* **default** to a value for other variables
* **abort CI** if variables are missing or fail validation
* **warn developers** if they use an undeclared environment variable

## Installation

`npm install varium --save`

_Requires node v6.5 or above._

## Usage example

Create a file called `env.manifest` in the project root. It should contain all
environment variables used in the project. For example:

```
API_BASE_URL : String
API_SECRET : String

# This is a comment
# The following is an optional variable (the above were required):
NUMBER_OF_ITEMS : Int |

FLAG : Bool | False # Variables can also have default values. Here it is False
COMPLEX_VALUE : Json | [{ "object": 42 }] # Use json for advanced data structures

QUOTED_STRING : String | "Quote the string if it contains # or \\escaped chars"
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

To prevent other developers or your future self from using `process.env`
directly, use the `no-process-env`
[eslint rule](https://eslint.org/docs/rules/no-process-env).

Your environment now needs to contain the required variables. If you use a
library to load `.env` files (such as node-forman or dotenv), the `.env` could
contain this:

```bash
API_BASE_URL=https://example.com/
API_SECRET=1337
NUMBER_OF_ITEMS=3
```

To abort builds during CI when environment variables are missing, just run the
config file during th build step. For example, on heroku the following would be
enough:

```js
{
  "scripts": {
    "heroku-postbuild": "node ./config"
  }
}
```

For a complete syntax and api reference (for example how to add your own custom
types), see the [docs](./DOCS.md).
