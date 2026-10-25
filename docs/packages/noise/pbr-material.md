---
title: PBR Material
aside: false
order: 3
---

# PBR Material

Bakes the maps of a PBR material from noise fields: base color, normals, occlusion / roughness / metallic and
emissive. `seamless` makes the fields repeat with the baked region, so the maps tile over the mesh.

- **lava** is a continuous texture. One fbm is made seamless, cracks, crust, height and glow are derived from it.
- **marble tiles** is a pattern. The `tiles` source repeats by itself, only the marble veins need `seamless`.

Turn off `seamless` to see the seams.

<Example  />

:::tabs variant:code
== example.ts
<ExampleCode />
:::
