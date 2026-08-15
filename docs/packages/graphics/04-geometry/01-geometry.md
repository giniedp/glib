---
title: Geometry
order: 10
---

# Geometry

:::tabs
== WebGPU
<Example platform="webgpu" />
== WebGL
<Example platform="webgl2" />
:::

Until now we created an index and vertex buffer and called the appropriet methods
on a pass instance to configure and issue a draw command. This can be grouped in
a `Geometry` instance to offload the geometry related pass composition to that class.

So instead of doing

```ts
pass.setIndexBuffer(iBuf)
pass.setVertexBuffer(vBuf)
pass.setPrimitiveType(primitiveType)
pass.drawIndexed(indexCount, instanceCount, indexOffset, baseVertex, instanceOffset)
```

we can just call

```ts
pass.render(geometry)
```

and can do it repeatedly

## Source

<ExampleCode />
