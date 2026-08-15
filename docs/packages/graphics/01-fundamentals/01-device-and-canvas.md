---
title: Device & Canvas
aside: false
order: 10
---

# Device & Canvas

Every `@gglib/graphics` program starts the same way: create a `Device` for a
canvas, and drive a render loop that clears the screen. This example has no
shaders and no geometry yet - it only covers the device lifecycle.

:::tabs
== WebGPU
<Example platform="webgpu" />
== WebGL
<Example platform="webgl2" />
:::

## Source

<ExampleCode />
