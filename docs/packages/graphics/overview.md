---
order: 0
---

# Overview

`@gglib/graphics` is an abstraction layer over WebGPU and WebGL2. It provides access to both backends through a uniform API.
The implementation is WebGPU focused. Features that exist in WebGL2 but not in WebGPU are not exposed.

## Device

The `Device` is the entry point. It provides an API for resource creation and also exposes `Capabilities` of the current platform. Simple render loops and async tasks can be scheduled via `device.schedule`.

## Resources

**`Buffer`** holds vertex, index, uniform and storage data. Storage buffers for WebGL2 are emulated with textures.

**`Texture`** holds image data for sampled images and render targets.

**`ShaderModule`** compiles shader source into a `Program`. Accepts raw `glsl` and `wgsl` shader code. Resolves inputs via reflection and comment annotations. Preprocessor utilities exist, but must be run by the user if needed. Reflection preprocesses internally, the compiled source stays untouched.

## States

Fixed function pipeline settings are grouped by domain and provided as cacheable objects with common presets.
These are `BlendState`, `DepthState`, `CullState`, `StencilState`, `SamplerState`, `ViewportState` and `ScissorState`.

## Encoders

Work is recorded into encoders.

A `RenderEncoder` (for example `device.renderPass`) sets render targets, states, buffers and programs, then issues draw calls.
On WebGL2, the encoder executes immediately. On WebGPU, commands are recorded and pipelines are cached and reused.

On WebGPU, a separate `computePass` dispatches compute shaders.

## Geometry and Materials

- `Geometry` bundles vertex and index buffers with a draw range and topology.
  - `GeometryBuilder` and the shape helpers are provided to compose geometry on the CPU.
- `Effect` and `Material` combine a program with parameters and render states.
  - `BasicMaterial` is provided for simple rendering, just enough to get started.
- `Mesh` pairs geometries with materials into one drawable unit.

## Sprites

`SpriteBatch` draws many textured quads in few draw calls. `SpriteFont` renders text on top of it.

## Resource Lifetime

GPU memory is not garbage collected. A resource is freed when it is disposed explicitly or when its last owner releases it.
A `ResourceScope` owns resources and disposes them all at once.
Resources created without a scope are held by the global `device.scope` until another owner claims them.
Custom scopes are created with `device.createScope()`.
