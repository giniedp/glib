---
title: Interop
order: 30
---

# Interop

The library does scan the shader source code for annotation comments and allows to expose renamed uniform and vertex inputs.
This allows you to have different conventions for shader and javascript code or to integrate a any shader without doing a full refactor on it.

To rename a vertex input `vPosition` to `position` do

:::tabs
== glsl

```glsl
// @alias position
in vec3 vPosition;
```

== wgsl

```wgsl
struct VertexInput {
  // @alias position
  @location(0) vPosition : vec3f,
};
```

:::

:::tabs
== WebGPU
<Example platform="webgpu" />
== WebGL
<Example platform="webgl2" />
:::

### Source

<ExampleCode />
