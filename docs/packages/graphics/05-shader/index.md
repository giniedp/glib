---
order: 20
---

# Shader

Vertex buffers describe geometry that mostly stays the same frame to frame.
To move, rotate or recolor that geometry - or to feed a shader any value
that isn't per-vertex - shaders read from **uniforms**, values pushed from
the CPU right before a draw call.

1. [Uniforms Basics](./01-uniforms-basics/) — `program.set` / `commit`, without any matrix math yet.
2. [2D Transformations](./02-transformations-2d/) — composing translate, rotate and scale with `Mat4`.
3. [3D Transformations](./03-transformations-3d/) — World, View and Projection matrices, and depth testing.
