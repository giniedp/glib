---
title: What is GGlib
order: 0
---

# What is GGlib

GGlib is a collection of libraries, or packages, for creating real-time 3D web applications, such as games or anything else that requires 3D rendering in the browser.

Each package solves a specific problem domain while staying as independent as possible. When working with GGlib, you decide what level of abstraction your project needs, and where you draw the line to bring in your own custom architecture.

## Essentials

Essential low-level packages required by every GGlib application.

- `@gglib/utils` - provides a basic game loop and event system
- `@gglib/math` - all the algebra
- `@gglib/graphics` - WebGPU and WebGL abstractions

Together these give you a graphics API that manages WebGPU and WebGL state, while staying low level enough to do almost anything you could do with vanilla WebGPU or WebGL.

## Mid level

- `@gglib/game` - provides an advanced game loop and input management (keyboard, mouse, gamepad)
- `@gglib/content` - provides an extensible content loading pipeline
  - `@gglib/loaders` - adds content loaders for `.gltf`, `.dds`, `.ktx` and more
- `@gglib/effects` - provides shaders and post-processing effects like Bloom, HDR, IBL Prefilter
- `@gglib/model` - provides a 3D model with animation support

## High level

- `@gglib/render` - provides a renderer and a simple frame graph to orchestrate scene rendering
- `@gglib/ecs` - a bare-bones Entity Component System for scene management
  - `@gglib/components` - common components for the ECS

## Why?

The project is primarily meant for personal reasearch and education in 3D programming.

Ever since the early days of [XNA](<https://de.wikipedia.org/wiki/XNA_(Microsoft)>), I have been avidly reading literature about
graphics and game engine programming, and spending my free time exploring graphics APIs.

::: warning
It's a spare time project. Frequently changed, occasionally maintained.
:::

## Should i use it?

If you're curious and want to try something new for your toy project, then maybe. However, if you need something solid and production ready with strong community support,
I suggest reaching for something like [Three.js](https://threejs.org/), [Babylon.js](https://www.babylonjs.com/), [PlayCanvas](https://playcanvas.com/)
