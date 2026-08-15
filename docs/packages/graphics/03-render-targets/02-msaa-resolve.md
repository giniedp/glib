---
title: MSAA & Resolve
aside: false
order: 20
---

# MSAA & Resolve

Toggle multisampling on and off and look closely at the cube's edges - MSAA
renders each pixel at 4 sub-sample positions and averages them, softening
the jagged "staircase" look of a single-sampled render.

:::tabs
== WebGL
<Example platform="webgl2" />
== WebGPU
<Example platform="webgpu" />
:::

## Source

<ExampleCode />
