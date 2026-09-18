---
title: Texture Cube
aside: false
order: 30
---

# Texture Cube

A cube map packs 6 images into one texture, sampled by a 3D direction
instead of a 2D UV coordinate. The same shader draws it two ways: once as
a skybox surrounding the camera, and once as a reflection on a tumbling
cube in front of it - a single `mode` uniform switches between the two.

:::tabs variant:code
== WebGL
<Example platform="webgl2" />
== WebGPU
<Example platform="webgpu" />
:::

:::tabs variant:code
== example.ts
<ExampleCode />
:::
