![Latest NPM release][version-shield]
[![License][license-shield]][license-url]
[![Build status][travis-shield]][travis-url]
[![Coverage status][cover-shield]][cover-url]

> This is a spare time project and is maintained occasionally.

# [G]glib

Gglib framework is a collection of graphics related libraries and tools written in Typescript.
It abstracts WebGL calls and provides a simplified interface for graphics rendering.

# Project structure

This project uses yarn workspaces and gulp tasks

```
  ├── assets              // Contains assets (textures, models, materials etc.) that are shared across all apps
  ├── apps                // Contains workspaces for everything that is executable
  │   ├── web             // Workspace for the gglib website
  │   ├── ...             //
  ├── packages            // Contains workspaces for all gglib packages
  │   ├── ...             //
  ├── tools               // Contains workspaces for build tools
  │   ├── gglib           // build tasks for the gglib packages
  │   ├── ...             //
```

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

build the packages and the website

```sh
$ yarn build
```

[travis-url]: https://travis-ci.org/giniedp/glib
[travis-shield]: https://img.shields.io/travis/giniedp/glib.svg
[cover-url]: https://coveralls.io/github/giniedp/glib?branch=master
[cover-shield]: https://img.shields.io/coveralls/github/giniedp/glib.svg
[license-url]: ./LICENSE
[license-shield]: https://img.shields.io/npm/l/@gglib/gglib.svg
[version-shield]: https://img.shields.io/npm/v/@gglib/gglib.svg
