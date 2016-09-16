# Varium

A strict parser and validator of environment config variables. The fundametal
priniciples are that you want:

1. to have _one_ place where _all_ environment variables are declared
2. CI and/or builds to _fail_ if any environment variables are missing
3. to prevent developers from ever using an undeclared env var
4. to be able to set e.g. `SOME_FLAG=false` and have it treated like a boolean.

This package does not handle loading of environment variables themselves. Use
foreman or dotenv or whatever you prefer for that.

## Installation

`npm install varium -s`

_Requires node v4 or above._

## Usage

The central piece of your environment configuration is the manifest. Maybe
located at `env.manifest`:

```
REQUIRED_URL : String
POSITION : Int | 7
FLAG : Bool | false # Comment, can be used as documentation
LIST_OF_THINGS : Json | []
OPTIONAL_WITH_NO_DEFAULT : String |
```

Create a central file for your config, probably `config/index.js`, where you put
something like this:

```js
const varium = require('varium');

module.exports = varium(process.env, 'env.manifest');
```

Then use the config in other modules like this:

```js
const config = require('./config');

const myVar = config.get('POSITION');
console.log(myVar); // 7
```

To abort builds you can for example on heroku just run the config file postbuild.
Just add the following to your package.json.

```js
{
  "scripts": {
    "heroku-postbuild": "node config"
  }
}
```


## Manifest syntax

`Varname : Type[ |[ Default]]`

* **Varname**: Name of an environment variable.
* **Type**: The type of the variable. Can be one of `Int, Float, String, Bool, Json`
* **Default** (optional): The default value. Must be the same type as **Type**.
  If neither `|` nor a default value is set, the variable will be required. If
  only `|` is set, the default will be `undefined` (thus the variable is optional).

For examples see Usage above.


## API

### varium : Env -> PathToManifest -> config

* **Env**: Object String, an object with a key for each environment variable and
  the values are strings.
* ** PathToManifest**: String, path to the manifest. Relative to `process.cwd()`
  or absolute (e.g. `path.join(__dirname, 'env.manifest')`).
  
**Returns** an instance of Config.

### config.get : VarName -> value

Takes the name of an environment variable and returns its value. Will throw if
the environment variable is not defined.

* **VarName**: The name of the variable.

**Returns** the value.


## Known caveats

* `#` is currently not supported other than for stating comments (thus can't be
  used in default values). Will be fixed when I get around to writing a custom
  lexer and parser.
