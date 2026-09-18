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

:::tabs variant:code
== WebGPU
<Example platform="webgpu" />
== WebGL
<Example platform="webgl2" />
The WebGL example renders always the same, regardless of chosen settings
:::

:::tabs variant:code
== example.ts
<ExampleCode />
:::
