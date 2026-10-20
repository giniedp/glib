---
order: 0
---

# Overview

`@gglib/noise` builds procedural noise as a graph of fields. The same graph is evaluated on the CPU and compiled to WGSL and GLSL.
Both sides produce the same values, so for example a terrain rendered on the GPU matches the heights a game queries on the CPU.

## Fields

A `Field` is a node that returns a value for a point in 3D space. Fields are composed with pipeable operators:

```ts
const terrain = perlin().pipe(ridged({ octaves: 6 }), scale(2))
```

- **Sources** generate noise, for example perlin, simplex, value or cell noise.
- **Modifiers** transform the input point, for example scale, shift or warp.
- **Fractals** layer octaves, for example fbm or ridged.
- **Math and combinators** remap, clamp or blend fields.
- **Color nodes** turn values into colors, for example with a gradient.

Every field is a vec4. A grayscale value `v` stands for `(v, v, v, v)`, so it also ends up in the alpha channel. Use `opaque()` to set alpha to 1, for example before drawing the texture with blending.

## Constants and Uniforms

A plain number is a constant and is baked into the generated shader.
A `uniform` becomes a typed parameter in `field.params`. It can be changed at runtime without recompiling the shader.

## CPU and GPU

- `field.sample(x, y, z)` evaluates the graph in JavaScript.
- `toWgsl(field)` and `toGlsl(field)` generate shader functions that can be called from custom shaders.

Noise functions use integer hashing, which is exact on both sides and keeps the results in sync.

## Procedural Textures

`ProceduralTexture` bakes a field into a texture on the GPU, for example a heightmap or a cloud texture.
Changing uniforms and calling `update` re-renders the texture without a shader recompile.

## Custom Nodes

A custom node extends `Field` and implements code generation and CPU evaluation. The emit context hides the differences between WGSL and GLSL, so a node is written once for both.
