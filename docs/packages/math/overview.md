---
order: 1
title: Overview
---

# @gglib/math overview

A 3D math library with vectors, quaternions, matrices, bounding volumes, rays, planes and collision helpers.

This page explains the conventions of the API. It does not explain the math. Once you know the conventions for one type, you know them for all types.

## Data types

All data types are plain data. Functions do the work. There are no methods on the data.

| Type          | Shape                                  |
| ------------- | -------------------------------------- |
| `IVec2`       | `{ x, y }`                             |
| `IVec3`       | `{ x, y, z }`                          |
| `IVec4`       | `{ x, y, z, w }` (also used for quats) |
| `Mat2/3/4`    | `ArrayLike<number>`, column major      |

Because the types are only shapes, the functions accept any object that matches. This includes data from JSON, a physics engine or a GPU buffer. You do not need to wrap it first.

```ts
vec3Add({ x: 1, y: 2, z: 3 }, { x: 4, y: 5, z: 6 }) // no wrapper needed
```

## Naming

Function names start with the type, for example `vec3Add`, `mat4Invert` or `quatCreateAxisAngle`.

A `$` after the type marks a function that **mutates** its first argument.

```ts
vec3Add(a, b)   // pure, returns a new vector
vec3$add(a, b)  // mutating, a += b, returns a
```

## Pure functions

A pure function does not change its inputs. Most pure functions take an optional `out` as the **last** argument:

- without `out` the result goes into a new object
- with `out` the result is written into `out` and `out` is returned

```ts
const c = vec3Add(a, b)  // allocates c
vec3Add(a, b, c)         // reuses c, no allocation
vec3Add(a, b, a)         // same as vec3$add(a, b)
```

Pass `out` in hot code paths such as render loops, so you avoid garbage collection.

## Mutating functions

A mutating function takes the target as the **first** argument, named `out`. It changes `out` in place and returns it. Because of this, you can nest calls:

```ts
vec3$normalize(vec3$add(position, offset))
```

## Create and init

Constructors follow the same rule:

- `xxxCreate...` returns a new object, for example `mat4CreateLookAt(eye, target, up)`
- `xxx$init...` writes into an existing object, for example `mat4$initLookAt(out, eye, target, up)`

The short helpers `vec2()`, `vec3()`, `vec4()` and `mat4()` create new values with defaults.

## Matrix order

Matrices are column major. `mat4Multiply(a, b)` computes `a * b`. The `$` variants have two forms:

- `mat4$multiply(out, b)` computes `out = out * b`
- `mat4$premultiply(out, b)` computes `out = b * out`

The same pattern applies to rotations, for example `mat4$rotateByQuat` and `mat4$preRotateByQuat`.
