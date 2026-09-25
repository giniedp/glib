---
title: Multiple Render Targets
aside: false
order: 30
---

# Multiple Render Targets

One draw call, two output images: the fragment shader writes a color to
one texture and a brightness mask to another, in the same pass.

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
