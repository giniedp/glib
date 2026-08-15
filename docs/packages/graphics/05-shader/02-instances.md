---
title: Instances
order: 20
---

# Instances

Multiple objects, that require different uniform values must have an own instance
of a shader program in order to hold an own set of uniforms.

Technically not necessary for WebGL, since WebGL renders immediatley, before calling `.submit()`
and instantly consumes and applies all given uniform values.

For WebGPU, the same result can be achieved by callin `.submit()` after eacht `.draw()`
but at the cost of performance.

:::tabs
== WebGPU
<Example platform="webgpu" />
== WebGL
The WebGL example renders always the same, regardless of chosen settings
<Example platform="webgl2" />
:::

## Source

<ExampleCode />
