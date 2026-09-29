---
order: 1
title: Overview
---

# @gglib/math overview

A 3D math library providing vectors (`IVec2`, `IVec3`, `IVec4`), quaternions (`Quat`), matrices (`Mat2`, `Mat3`, `Mat4`), bounding volumes, collision utilities, and supporting helpers.

This guide covers the design principles shared by these types, so that once you understand one class, you understand them all. It assumes you're already familiar with 3D math concepts (vectors, matrices, quaternions, bounding volumes). The focus here is the API shape, not the math itself.

## Interfaces

Every compute structure has both a class and a plain-object interface:

| Interface | Shape               |
| --------- | ------------------- |
| `IVec2`   | `{ x, y }`          |
| `IVec3`   | `{ x, y, z }`       |
| `IVec4`   | `{ x, y, z, w }`    |
| `IVec4`   | `{ x, y, z, w }`    |
| `IMat`    | `ArrayLike<number>` |

The classes provide instance methods and static utility functions. Majority of them operates on _any_ object matching the interface shape. This means you can run vector math over plain `{ x, y, z }` objects (e.g. data coming from JSON, a physics engine, or a GPU readback) without first wrapping them in a `Vec3`.

```ts
Vec3.add({ x: 1, y: 2, z: 3 }, { x: 4, y: 5, z: 6 }) // works, no Vec3 instances involved
```

## Pure vs Mutation functions

TODO:
