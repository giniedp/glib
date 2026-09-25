---
title: Post-Processing
aside: false
order: 40
---

# Post-Processing

The scene is rendered to a texture exactly as before, but the second pass
now runs an actual image effect over it instead of just displaying it.

:::tabs variant:code
== WebGPU
<Example platform="webgpu" />
== WebGL
<Example platform="webgl2" />
:::

:::tabs variant:code
== example.ts
<ExampleCode />
:::
