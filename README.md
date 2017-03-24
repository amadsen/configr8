# Configr8

It is useful to be able to provide a basic configuration with overrides based on system, runtime, user, environment, and other factors. `.{name}rc` files provide a solid foundation for such configurations. Configr8 provides an API modeled loosely after [rc](https://www.npmjs.com/package/rc) and [yargs](https://www.npmjs.com/package/yargs), with a few helpful additions and potentially arbitrary quirks and opinions (discerning between these is left as an exercise for the reader.)

<a name="file-locations"></a>
## File Locations

Configr8 will look for and apply configuration files from the locations specified by the `patterns` key in the settings you give it. It provides two named pattern sets which should meet most use cases - which you refer to by setting `patterns` to their name, but you can also provide your own array of patterns.

The two named pattern sets are:

### `"application"`
The `"application"` patterns are appropriate for configuring an application. This is the default.
 
~~~javascript
[
    "${home}/.${name}rc",
    "${cwd}/.${name}rc",
    "${etc}/${name}rc",
]
~~~


### `"per-directory"`
The `"per-directory"` patterns are appropriate for configuring a tool that should act differently in different target directories.
 
~~~javascript
[
    "${parents}/.${name}rc",
    "${home}/.${name}rc",
    "${etc}/${name}rc"
]
~~~

The tokens in these patterns are substituted as follows:

+ `${name}` - the `name` string specified in settings. _In all cases where a `-` is found in the `${name}` an additional `-` will be inserted before any appended `rc` suffix_. That is, files will be expected to be `.hyphenated-app-name-rc` rather than `.hyphenated-app-namerc`.
+ `${home}` - the current user's HOME directory or the `home` path specified in settings
+ `${cwd}` - the process' current working directory or the `cwd` path specified in settings
+ `${etc}` - the `etc` path specified in settings
+ `${parents}` - like `${cwd}` except that it checks each parent of the current working directory back to the root of the file system.

#### Environment and Default Configuration Files

Additionally, these same file locations will be searched for environment-specific files, substituting `${name}-${environment}-` for `${name}` in the patterns above. The `environment` searched for will be determined, in order of precedence, by the `env` or `environment` command line arguments (if parsed), the `env` or `environment` properties of any overrides passed in, or the `${name}_ENV`, `ENV`, `NODE_ENV`, or `ENVIRONMENT` environment variables. If none of these is found, no environment-specific files will be loaded.

Similarly, these same filesystem locations will be searched for "defaults" files using `${name}-defaults-` instead of `${name}`.

## Merging configuration

Configuration defaults are merged by first taking the values under the `:defaults:` key in any standard configuration files, then configuration from any defaults configuration files, then the values under the `:defaults:` key in any environment specific configuration files. 

Environment specific configurations are merged with values under the `[":env:"][environment]` key path from any defaults configuration files, then values under the `[":env:"][environment]` key path from any standard configuration files, and finally the values in any environment specific configuration files.

Finally, the merged configuration defaults are overriden by the merged standard configuration, which is further overriden by the merged environment specific configuration.

The defaults object you pass in will be treated as the lowest priority defaults configuration file.

Configuration from environment varibles, overrides you pass in, and configuration from parsed command line arguments is then merged in order, giving command line arguments the highest precedence. These configuration sources do not provide a mechanism for specifying defaults or environment specific configuration because it is not needed.

## Configuring Configr8

Configr8 exports a (synchronous) function that allows you to provide `settings` describing how Configr8 should work. This will either be an app `name` string or an object containing an `name` property and other meta-configuration parameters. This function will return a configuration resolver function.

### Settings

+ `name` - Required. This is the `name` that will be used to look up configurtion files and environment variables, etc.
+ `useArgv` - Default: `false`. Indicates whether Configr8 should parse `process.argv` for configuration. Default is `false` because users will often pass in overrides from their own argv parser (or another source).
+ `useEnv` - Default: `true`. Indicates whether Configr8 should parse `process.env` for configuration.
+ `usePkg` - Default: `true`. Indicates whether Configr8 should parse `package.json` and get configuration from the key matching `name`.
+ `cwd` - Default: `process.cwd()`. The path Configr8 should treat as the target or current working directory. It does not actually change `process.cwd()`.
+ `home` - Default: The user's home directory as determined by [`os-homedir`](https://www.npmjs.com/package/os-homedir). The path Configr8 should treat as the user's home directory.
+ `etc` - Default: `null`. The path Configr8 should treat as the system configuration directory.
+ `patterns` - Default: `"application"`. The set of patterns to use to search for configuration files. (See [File Locations](#file-locations) above for details).
+ `async` - Default: `false`. Indicates whether Configr8's configuration resolver function should return a Promise if no callback function is provided. When `false` and no callback is provided the configuration resolver function will return the resolved configuration or an `Error` synchronously.

## Installation

~~~bash
> npm install configr8 --save
~~~

## Use

~~~javascript
var configReslover = require('configr8')('my-app');

var defaultConfig = {
	fiz: 'buzz',
	blah: {
		blarg: 2
		biz: 1
	}
}

var config = configReslover(defaultConfig);

//...
~~~
