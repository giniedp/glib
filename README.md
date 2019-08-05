![Latest NPM release][version-shield]
[![License][license-shield]][license-url]
[![Build status][travis-shield]][travis-url]
[![Coverage status][cover-shield]][cover-url]

> This is a spare time project and is maintained occasionally.

[G]glib
======

Gglib framework is a collection of graphics related libraries and tools written in Typescript. It abstracts WebGL calls and provides a simplified interface for graphics rendering.

# Installation

get source code

```sh
$ git clone git@github.com:giniedp/glib.git
$ cd glib
```

install dependencies

```sh
$ yarn install
```

build the project

```sh
$ gulp build
```

# Gulp commands
| Command | Description |
|---|---|
| `gulp clean`  | Cleans the `dist` folder |
| `gulp update` | Regenerates `package.json` and `api-extractor.json` files. Synchronizes the version number |
| `gulp compile`| Compiles all packages using `tsc` |
| `gulp bundle` | Bundles all packages using `rollup` |
| `gulp build`  | Basically runs all commands above to build all packages |
| `gulp api`    | Runs the api extractor and generates `api/*.api.json` files |
| `gulp docs`   | Generates API for each package |
| `gulp -T`     | List all available tasks |

[travis-url]: https://travis-ci.org/giniedp/glib
[travis-shield]: https://img.shields.io/travis/giniedp/glib.svg
[cover-url]: https://coveralls.io/github/giniedp/glib?branch=master
[cover-shield]: https://img.shields.io/coveralls/github/giniedp/glib.svg
[license-url]: ./LICENSE
[license-shield]: https://img.shields.io/npm/l/@gglib/gglib.svg
[version-shield]: https://img.shields.io/npm/v/@gglib/gglib.svg
