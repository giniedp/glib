![Latest NPM release][version-shield]
[![License][license-shield]][license-url]

> This is a spare time project. Frequently changed. Occasionally maintained.

# [G]glib

A collection of graphics and game engine related libraries
including packages to work with webGL, 3D math, content processing, scene management,
shader composition and more.

# Project structure

This project uses yarn workspaces and gulp tasks

```
  ├── assets              // Contains assets (textures, models, materials etc.) that are shared across all apps
  ├── docs                // Vitepress documentation and examples
  ├── experiments         // Experimental projects using gglib
  ├── packages            // Workspaces all gglib packages
  │   ├── ...             //
  ├── tools               // Build tools
  │   ├── glib            // Tasks to compile and bundle gglib packages
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
$ pnpm install
```

build the packages and the website

```sh
$ pnpm build
```

build and watch in dev mode with website preview running at http://localhost:5173/

```sh
$ pnpm dev
```

[license-url]: ./LICENSE
[license-shield]: https://img.shields.io/npm/l/@gglib/gglib.svg
[version-shield]: https://img.shields.io/npm/v/@gglib/gglib.svg
