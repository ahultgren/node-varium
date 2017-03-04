# Varium

Declare and validate environment variables.

Let's say you join a project and need to set up environment variables. You find
a file called `env.manifest`. It contains the following:

```
REQUIRED_URL : String
A_NUMBER : Int | 7
FLAG : Bool | false # Comment, can be used as documentation
LIST_OF_THINGS : Json | []
OPTIONAL_WITH_UNDEFINED_DEFAULT : String |
```

You immediately see what env vars you need, and what they do.


## TOC

* [Philosophy](#philosophy)
* [Installation](#installation)
* [Usage](#usage)
* [Documentation](#documentation)
  * [Manifest syntax](#manifest-syntax)
  * [API](#api)
  * [Logs](#logs)


## Philosophy

The fundamental principles are that you want to:

1. have _one_ place where _all_ environment variables are declared and documented
2. _abort_ CI and/or builds if any environment variable is missing
3. prevent developers (yourself) from ever using an undeclared env var
4. treat e.g. `SOME_FLAG=false` as a boolean.

In short you will never again have to hunt around in the source code for any
environment variables you might be missing.


## Installation

`npm install varium -S`

_Requires node v6.5 or above._


## Usage

The central piece of your environment configuration is the manifest. I suggest
you create a file named `env.manifest`, see the example above.

Next, create a central file for your config, probably `config/index.js`, where
you need the following:

```js
const varium = require('varium');
module.exports = varium(process.env, 'env.manifest');
```

Of course you also need to actually define the environment variables, either
as actual env vars, or load from a .env using foreman/nf, dotenv, or
whatever you prefer.

Now you can use the config in other modules. For example:

```js
const config = require('./config');
console.log(config.get('A_NUMBER')); // 7
console.log(config.get('WAIT_WHAT_IS_THIS')); // throws Error: Varium: Undeclared env var "WAIT_WHAT_IS_THIS"
```

If you want to abort builds when env vars are missing, you can simply run the
config file. For example on heroku, just add the following to your package.json:

```js
{
  "scripts": {
    "heroku-postbuild": "node config"
  }
}
```


# Documentation

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

[debug]: https://www.npmjs.com/package/debug

### varium.Varium : Config -> varium

* **Config.customValidators** : Use your own validators for custom types, or
  overwrite the built-in ones. For example:
  
  ```js
  Varium({
    FortyTwo : (value, def) => value === "42" ? 42 : def
  }, process.env, "env.manifest");
  ```

Returns an instance with the same api as described for `varium` above.


## Logs

[Debug][debug] is used for logging. Thus if you need to debug something, set
`DEBUG=varium:*`. Notice, however, that it's not advised to use this level in
production. It logs env var values and may thus potentially log secrets, which
is generally frowned upon.
