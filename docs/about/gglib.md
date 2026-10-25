---
title: What is GGlib
order: 0
---

# What is GGlib

GGlib is a collection of libraries, or packages, for creating real-time 3D web applications, such as games or anything else that requires 3D rendering in the browser.

Each package solves a specific problem domain while staying as independent as possible. When working with GGlib, you decide what level of abstraction your project needs, and where you draw the line to bring in your own custom architecture.

<div :class="$style.stack">
  <div :class="[$style.block, $style.app]" style="grid-column: 1 / 7; grid-row: 1">viewer</div>
  <div :class="[$style.block, $style.high]" style="grid-column: 1 / 7; grid-row: 2">components</div>
  <div :class="[$style.block, $style.mid]" style="grid-column: 1; grid-row: 3 / 5">game</div>
  <div :class="[$style.block, $style.high]" style="grid-column: 2 / 5; grid-row: 3">render</div>
  <div :class="[$style.block, $style.mid]" style="grid-column: 5; grid-row: 3">loaders</div>
  <div :class="[$style.block, $style.high]" style="grid-column: 6; grid-row: 3 / 6">ecs</div>
  <div :class="[$style.block, $style.mid]" style="grid-column: 2; grid-row: 4">effects</div>
  <div :class="[$style.block, $style.mid]" style="grid-column: 3; grid-row: 4">noise</div>
  <div :class="[$style.block, $style.mid]" style="grid-column: 4; grid-row: 4">model</div>
  <div :class="[$style.block, $style.mid]" style="grid-column: 5; grid-row: 4">content</div>
  <div :class="[$style.block, $style.base]" style="grid-column: 1 / 6; grid-row: 5">graphics</div>
  <div :class="[$style.block, $style.base]" style="grid-column: 1 / 4; grid-row: 6">utils</div>
  <div :class="[$style.block, $style.base]" style="grid-column: 4 / 7; grid-row: 6">math</div>
</div>

<p :class="$style.caption">Each block builds on the blocks below it.</p>

<style module>
.stack {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 4px;
  margin: 24px 0 8px;
}
.block {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 4px;
  border-radius: 6px;
  font-family: var(--vp-font-family-mono);
  font-size: 13px;
  font-weight: 600;
  overflow-wrap: anywhere;
  text-align: center;
}
.base {
  border: 1px solid var(--vp-button-brand-border);
  background: var(--vp-button-brand-bg);
  color: var(--vp-button-brand-text);
}
.mid {
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-text-1);
}
.high {
  background: var(--vp-c-default-soft);
  color: var(--vp-c-text-1);
}
.app {
  border: 1px dashed var(--vp-c-divider);
  color: var(--vp-c-text-2);
}
.caption {
  text-align: center;
  font-size: 13px;
  color: var(--vp-c-text-2);
}
@media (max-width: 480px) {
  .block {
    padding: 2px;
    font-size: 10px;
  }
}
</style>

## Why?

GGlib is a personal project. It is where I do my research and experiments in graphics and game engine
programming, a hobby that started back in the days of [XNA](<https://de.wikipedia.org/wiki/XNA_(Microsoft)>)
and never really stopped.

Engines and frameworks make many decisions for you, and that is a good thing until you want to try something
they were not designed for. I wanted a codebase where I own the whole frame: resource creation, scene traversal
and visibility detection, render pass orchestration and what ends up on the GPU. When an idea needs a change in
the internals, I change the internals, instead of working around them.

GGlib is not meant to compete with [Three.js](https://threejs.org/), [Babylon.js](https://www.babylonjs.com/)
or [PlayCanvas](https://playcanvas.com/). Those are mature projects built by large communities, and GGlib
borrows ideas from them.

## Should I use it?

::: warning
GGlib is not stable. APIs change whenever an idea needs them to, often without a migration path.
:::

Maybe, if you want to learn from it. You can take pieces for your own engine, fork it or just use some
of the GGlib's packages as a foundation if you feel experimental.

Don't, if you need something stable and production ready with strong documentation and community support.
In that case reach for [Three.js](https://threejs.org/), [Babylon.js](https://www.babylonjs.com/)
or [PlayCanvas](https://playcanvas.com/).

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
