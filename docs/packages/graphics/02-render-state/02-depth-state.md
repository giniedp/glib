---
title: Depth State
aside: false
order: 20
---

# Depth State

Two overlapping quads at different distances from the camera. Toggle depth
testing and draw order independently to see why 3D scenes need a depth
buffer instead of relying on submission order.

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
