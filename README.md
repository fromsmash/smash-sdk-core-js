<p align="center">
  <a href="https://fromsmash.com/"><img src="https://developer.fromsmash.com/LOGO_SMASH_API.png" align="center" width="135" alt="Send big files"/></a>
<h1 align="center">@smash-sdk/core</h1>
</p>
<br />
<p align="center">
  <a href="https://npmjs.com/package/@smash-sdk/core"><img
      src="https://img.shields.io/npm/v/@smash-sdk/core.svg" /></a>
  <br />
</p>
<hr />

@smash-sdk/core is a JavaScript library that provides core functionality for [Smash SDK](https://api.fromsmash.com/).
<hr />

## Table of Contents

- [Table of Contents](#table-of-contents)
- [Installation](#installation)
- [Usage](#usage)
- [Documentation](#documentation)
- [Contributing](#contributing)
- [License](#license)

## Installation

This package is already installed when a Smash SDK package is installed in your project, so you should not have to install it manually. If you are using the [Smash Uploader](https://github.com/fromsmash/smash-uploader-js) and/or [Smash Downloader](https://github.com/fromsmash/smash-downloader-js), this package is not yet usable (for now).

 Anyway, @smash-sdk/core is available on npm: 

```bash
npm install @smash-sdk/core
```

## Usage

The main feature of @smash-sdk/core is to set a default configuration for any SDKs futur instanciation.
Most of Smash SDKs needs a token and/or a region to be used.


To use @smash-sdk/core in your project, you need to first import it into your JavaScript file:

```javascript
import { config } from "@smash-sdk/core";
```

You can set the config object with your Smash API credentials ([How to get Smash API crendentials](https://api.fromsmash.com/docs/quick-start)).


```javascript
config.setToken("Your Smash API key here");
```

Smash is available accross 9 regions. You may pick up a region of your choice and set it as default:

```javascript
config.setRegion("eu-west-3");
```

## Documentation

For more information on how to use Smash SDKs, you can refer to the Smash Docs [documentation](https://api.fromsmash.com/docs).

## Contributing

We welcome contributions! If you'd like to help improve @smash-sdk/core, please fork the repository, make your changes, and submit a pull request.
## License

@smash-sdk/core is released under the MIT License.