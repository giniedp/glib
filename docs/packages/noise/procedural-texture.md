---
title: Procedural Texture
aside: false
order: 2
---

# Procedural Texture

A `ProceduralTexture` bakes a noise field into a texture on the GPU. The shader is generated from the field, so any
graph built with `@gglib/noise` can be baked, including custom nodes.

```ts
import { fbm, perlin, ProceduralTexture, remap, uniform } from '@gglib/noise'

const clouds = perlin().pipe(fbm({ gain: uniform('gain', 0.5) }), remap(-0.7, 0.7, 0, 1))
const texture = new ProceduralTexture(device, clouds, {
  width: 512,
  height: 512,
  format: 'rgba8unorm',
  region: [0, 0, 4, 4],
})

clouds.params.gain = 0.6
texture.update()
spriteBatch.next(texture.texture)
```

- `region` is the area of the field that is baked, `[x0, y0, x1, y1]`. Texel row 0 is at `y0`. The texel at column `i`
  and row `j` holds the field at its center, `x0 + (i + 0.5) / width * (x1 - x0)` and the same for `y`, so
  `field.sample(x, y, z)` on the CPU gives the same value.
- `z` selects the slice of the 3D noise. Moving it over time animates the texture, as in the example.
- `update()` renders the texture with the current `field.params`, `region` and `z`. It does not recompile the shader.
  It draws into the texture and flushes the render pass, so call it before setting up the pass for your own drawing.
  It returns `false` while the shader is still compiling, try again in the next frame.
- Setting `texture.field` to another graph compiles a new shader. Uniforms of the old graph are not carried over.
- `format` defaults to `r32float`, which keeps negative values and the full range, e.g. for heightmaps. `rgba8unorm`
  clamps to `[0, 1]`, which is handy for display and colors. 32 bit float textures
  are not filterable on every device, read them with `textureLoad` / `texelFetch` or use `r16float`.
- `dispose()` releases the texture and the shader. The texture is owned by the `ProceduralTexture`, keep the
  `ProceduralTexture` alive while the texture is in use.

## Colors

Every field is a vec4. Noise sources produce a single value `v`, which stands for `(v, v, v, v)`, and operators work
on all four channels. Color nodes produce real colors:

```ts
import { cell, color, fbm, gradient, mix, perlin, remap, rgba, simplex, uniform } from '@gglib/noise'

const sky = perlin().pipe(
  fbm(),
  remap(-0.7, 0.7, 0, 1),
  gradient([[0, '#1b3a6b'], [uniform('clouds', 0.5), '#5b8fd6'], [1, '#ffffff']]),
)
const glass = rgba(perlin(), simplex(), 0.6).pipe(mix(color('#101418'), cell()))
```

- `color(value)` is a constant color: a hex string like `#ff8800`, an rgba vector in `[0, 1]` or a vec4 uniform.
- `gradient(stops)` maps the value (its first channel) to colors. Stops are `[position, color]` with increasing
  positions, both can be uniforms. Below the first and above the last stop the end colors are used.
- `rgba(r, g, b, a)` composes a color from fields, numbers or uniforms. `channel(i)` extracts one channel again, e.g.
  to use a color field as height.
- Combinators like `mix`, `add` and `mul` accept colors, e.g. `mix(color('#335'), mask)`.
- `opaque()` sets alpha to 1. A grayscale field has its value in the alpha channel too, which matters if the texture
  is drawn with blending.
- `field.sample(x, y)` returns the first channel, `field.sampleColor(x, y)` all four.

Only fields that depend on a color compute four channels. Grayscale graphs, e.g. heightmaps, compute one value and
cost the same as before on CPU and GPU. `toWgsl(field).type` tells whether the entry function returns a `float` or a
`vec4`.

To sample noise directly in your own shader instead of a texture, use `toWgsl(field)` / `toGlsl(field)` and call the
returned `entry` function. The [terrain](./terrain) page shows a baked heightmap displacing a mesh.

<Example  />

:::tabs variant:code
== example.ts
<ExampleCode />
:::
