---
title: Noise Terrain
aside: false
order: 1
---

# Noise Terrain

`@gglib/noise` builds noise as a graph of fields. The same graph runs on the CPU with `field.sample(x, y, z)` and
generates WGSL and GLSL with `toWgsl(field)` / `toGlsl(field)`. Both produce the same values, so a terrain rendered
on the GPU matches the heights a game queries on the CPU.

```ts
import { perlin, pipe, ridged, remap, scale, shift, uniform } from '@gglib/noise'

const terrain = pipe(
  perlin(),
  shift(uniform('seed', 0)),
  ridged({ octaves: uniform('octaves', 6), gain: 0.5 }),
  remap(0, 1.4, 0, 1),
  scale(uniform('frequency', 1, { min: 0.2, max: 4 })),
)
terrain.params.frequency = 2 // typed, the names come from the graph
terrain.sample(1.5, 2.5)     // CPU value
```

- Fields are composed with operators, `pipe(source, ...operators)` or `source.pipe(...operators)`. Sources are
  `perlin`, `simplex`, `value`, `cell` and `constant`. Operators transform the point (`scale`, `shift`, `warp`),
  build fractals (`fbm`, `ridged`, `hybrid`, `multifractal`), do math (`abs`, `clamp`, `pow`, `remap`, `smoothstep`, …)
  or combine fields (`add`, `mul`, `min`, `max`, `mix`). Combinators accept fields, numbers and uniforms.
- A plain number is a constant, it is baked into the shader. A `uniform(name, value)` becomes a field of a uniform
  block and is changed through `field.params` without recompiling. Options like `maxOctaves` or the cell `distance`
  change the generated code and only accept plain values.
- `toWgsl` / `toGlsl` return the functions, the name of the entry function and the uniform block. Calling the
  generated code from your own shader is up to you. `inline: true` emits the current uniform values as literals.
- `ProceduralTexture` bakes a field into a texture. `update()` renders it again with the current `params`.
- A custom node is a class that extends `Field` and implements `emit(ctx)` and `evaluate(ctx, x, y, z)`. The
  `EmitContext` hides the differences between WGSL and GLSL, so a node is written once for both.

In the example, the sliders under _Uniforms_ re-render the heightmap without a recompile. The options under _Graph_
build a new graph and compile a new shader. The terrain material is part of the example: it reads the heightmap in
the vertex shader, displaces the grid and derives the normals from neighbouring texels. Switch the mode to _CPU_ to
sample the same field in JavaScript, the terrain looks the same. Drag to rotate, scroll to zoom.

<Example  />

:::tabs variant:code
== example.ts
<ExampleCode />
:::
