---
title: Getting Started
order: 1
---

# Getting Started

## Prerequisites

This guide assumes you already know how to set up a web application - a dev server, a bundler, TypeScript, and so on. GGlib doesn't require anything special here; any modern bundler workflow (Vite, Webpack, esbuild, ...) works fine.

## Installation

Install the packages you need from npm. See [What is GGlib](/about/gglib) for an overview of what's available. For example, to get the essentials:

```sh
npm install @gglib/utils @gglib/math @gglib/graphics
```

## Usage

Each package is documented under [Packages](/packages/) - that's the place to go for the full API. As a taste, here's the minimal code to open a `Device` and clear the canvas to a color:

```ts
import { createDevice } from '@gglib/graphics'
import { vec4 } from '@gglib/math'

const canvas = document.querySelector('canvas')!
const device = await createDevice({ canvas, autosize: true }).ready

function frame() {
  device.renderPass.setClearColor(0, vec4(0.1, 0.1, 0.1, 1))
  device.renderPass.clear()
  device.renderPass.submit()
  requestAnimationFrame(frame)
}
requestAnimationFrame(frame)
```
