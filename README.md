![Latest NPM release][version-shield]
[![License][license-shield]][license-url]

# [G]glib

A collection of packages for creating real-time 3D web applications, such as games or anything else that requires 3D rendering in the browser.

> This is a spare time project. Frequently changed. Occasionally maintained.

# Project structure

```
  ├── assets              // Assets that are shared across docs examples and experiments
  ├── docs                // Vitepress documentation and examples
  ├── experiments         // Experimental projects using gglib
  ├── packages            // Workspaces for all gglib packages
  │   ├── ...             //
  ├── tools               // Build tools and utilities
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
