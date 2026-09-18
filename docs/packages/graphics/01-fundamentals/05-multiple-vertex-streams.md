---
title: Multiple Vertex Streams
aside: false
order: 50
---

# Multiple Vertex Streams

The same rectangle as before, but position and color now live in two
separate vertex buffers instead of one interleaved buffer. Color is also
packed as 4 bytes per vertex instead of 3 floats.

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
