---
order: 0
---

# @gglib/math

A 3D math library providing vectors (`Vec2`, `Vec3`, `Vec4`), quaternions (`Quat`), matrices (`Mat2`, `Mat3`, `Mat4`), bounding volumes, collision utilities, and supporting helpers.

This guide covers the design principles shared by these types, so that once you understand one class, you understand them all. It assumes you're already familiar with 3D math concepts (vectors, matrices, quaternions, bounding volumes). The focus here is the API shape, not the math itself.

## Interfaces and classes

Every compute structure has both a class and a plain-object interface:

| Class                | Interface | Shape                             |
| -------------------- | --------- | --------------------------------- |
| `Vec2`               | `IVec2`   | `{ x, y }`                        |
| `Vec3`               | `IVec3`   | `{ x, y, z }`                     |
| `Vec4`               | `IVec4`   | `{ x, y, z, w }`                  |
| `Quat`               | `IVec4`   | `{ x, y, z, w }`                  |
| `Mat2`/`Mat3`/`Mat4` | `IMat`    | `{ elements: ArrayLike<number> }` |

The classes provide instance methods and static utility functions. Majority of them operates on _any_ object matching the interface shape. This means you can run vector math over plain `{ x, y, z }` objects (e.g. data coming from JSON, a physics engine, or a GPU readback) without first wrapping them in a `Vec3`.

```ts
Vec3.add({ x: 1, y: 2, z: 3 }, { x: 4, y: 5, z: 6 }) // works, no Vec3 instances involved
```

## Instance methods vs. static methods

Many operations are exposed twice

- **Instance methods** mutate `this` in place and return `this`, so calls can be chained.

  ```ts
  v1.add(v2).multiplyScalar(0.5).normalize()
  ```

- **Static methods** are pure with respect to their inputs. They take the operands and an optional trailing `out` parameter:
  - if `out` is omitted, a new instance is created and returned;
  - if `out` is given (a class instance or a plain object), the result is written into it and it is returned.

  ```ts
  Vec3.add(v1, v2) // -> new Vec3
  Vec3.add(v1, v2, v3) // writes into v3, returns v3
  Vec3.add(v1, v2, {}) // writes into the given plain object, returns it
  ```

## Descriptive method names

Rather than overloading one method name for every possible combination of arguments, each variant has its own descriptive name that states what it expects as input. For example, on `Mat4`:

```ts
m.setTranslation(vec) // from a vector
m.setTranslationXYZ(x, y, z) // from three numbers
m.setTranslationX(value) // a single component
```

The same pattern shows up across all structures. When looking for an operation, look for the base name first, then check for `*XYZ`/`*X`/`*Array`/`*Scalar` variants that match the data you already have on hand.

## Creation and initialization

Two complementary sets of factory methods exist on every structure:

- **`create*`** — static methods that allocate and return a **new** instance: `Vec3.create(x, y, z)`, `Vec3.createZero()`, `Vec3.createFrom(other)`, `Mat4.createRotationX(angle)`, `Quat.createAxisAngle(axis, angle)`, `BoundingBox.createFromCenterExtent(center, extent)`, etc.
- **`init*`** — (re-)initialize an existing instance in place, avoiding an allocation:
  - as a static method, taking an arbitrary `out` object as the first argument: `Vec3.init(out, x, y, z)`, `Vec3.initZero(out)`, `Vec3.initFrom(out, other)`
  - as an instance method operating on `this`: `v.init(x, y, z)`, `v.initZero()`, `v.initFrom(other)`

Prefer `create*` when you need a brand new value, and `init*` when you already own an instance (e.g. a pooled or pre-allocated object) and want to overwrite its contents without allocating.

## Copying

Every structure exposes a `.copy(out)` method, both as instance and static variant:

```ts
v.copy() // new Vec3 with the same values
v.copy(out) // values written into `out`, `out` returned

Vec3.copy(v) // new Vec3
Vec3.copy(v, out) // values written into `out`, `out` returned
```

## Vector shape helpers

Each vector type also exports a lowercase helper function that builds a plain object (not a class instance) with flexible argument shapes, useful for quickly constructing literal data:

```ts
vec2(1) // { x: 1, y: 1 }
vec3(1, 2, 3) // { x: 1, y: 2, z: 3 }
vec3(v2, 3) // spreads an existing IVec2 and appends z
vec4([1, 2, 3, 4]) // from an array
```

## Scratch instances (`$0`, `$1`, ...)

Hot classes (`Vec3`, `Mat4`, `Quat`, ...) expose a few static scratch instances (`Vec3.$0`, `Vec3.$1`, `Mat4.$0`, ...) for short-lived intermediate calculations that would otherwise require a temporary allocation. They are shared, mutable, and **not safe to hold onto**, treat them as write-only scratch space for the duration of a single expression, and never store a reference to one beyond that.

## Arrays, equality, and formatting

All structures additionally support:

- `toArray(array?, offset?)` / `createFromArray(array, offset?)` / `initFromArray(array, offset?)` - flatten to/from a plain array or typed array at a given offset, useful for interop with GPU buffers.
- `equals(other)` - component-wise equality check.
- `format(fractionDigits?)` - human-readable string, intended for debugging/logging only (not serialization).

## Matrices

`Mat2`, `Mat3`, and `Mat4` all store their elements in a typed array (`Float32Array`/`Float64Array`) using **column-major** layout, the same layout GPU shader languages expect (`mat4` in GLSL/WGSL), so `elements` can be uploaded to a GPU buffer directly.

## Quaternions

`Quat` represents a rotation and follows the exact same conventions as the vector types (it implements `IVec4`, so it can be passed anywhere an `IVec4` is expected). In addition to the shared API it provides rotation-specific operations: `createAxisAngle`, `multiply` (concatenate rotations), `invert`, and `slerp` for spherical interpolation. Convert between representations via `Mat4.createFromQuat(q)` and `Mat4.decompose(mat, scale, rotationOut, translationOut)`.

## `SpaceBasis`: coordinate space conventions

3D tools and engines don't agree on which axis is "up" or which direction is "forward" (Y-up vs. Z-up, etc.). `SpaceBasis` captures a coordinate space as three orthonormal axes (`up`, `right`, `forward`) and provides ready-made conventions as static instances, e.g. `SpaceBasis.Y_UP_NEG_Z` (OpenGL/WebGPU/glTF/three.js convention) or `SpaceBasis.Z_UP_POS_Y`. Each instance also exposes `fromViewSpace`/`toViewSpace` matrices for converting between GPU view space and the described world space — useful when importing assets authored in a different up-axis convention.

## `Transform`: hierarchical transforms

`Transform` is a scene-graph node: it holds `translation`/`rotation`/`scale` (an `ITransformBase`), derives a local `matrix`, and supports `parent`/`children` links to build hierarchies. It tracks a `version` counter (`hasChanged`) so consumers can cheaply detect whether a transform (or its subtree) changed since it was last read, instead of recomputing world matrices every frame unconditionally.

## Bounding volumes

`BoundingBox`, `BoundingSphere`, `BoundingCapsule`, and `BoundingFrustum` all follow the same construction/API conventions as the vector/matrix types (`create*`, `init*`, `copy`), and (except `BoundingCapsule`) implement the shared `BoundingVolume` interface:

```ts
interface BoundingVolume {
  copy(): BoundingVolume
  intersectsPoint(point: IVec3): boolean
  intersectsRay(ray: Ray): boolean
  intersectsPlane(plane: IVec4): boolean
  intersectsBox(box: BoundingBox): boolean
  intersectsSphere(sphere: BoundingSphere): boolean
  intersectsFrustum(frustum: BoundingFrustum): boolean
  containsBox(box: BoundingBox): boolean
  containsSphere(sphere: BoundingSphere): boolean
  containsFrustum(frustum: BoundingFrustum): boolean
  intersectionBox(box: BoundingBox): IntersectionType
  intersectionSphere(sphere: BoundingSphere): IntersectionType
  intersectionFrustum(frustum: BoundingFrustum): IntersectionType
}
```

This gives every volume a consistent, symmetric API: any volume can be asked whether it intersects or contains any other supported volume, without needing to know which concrete pair of shapes is involved. `intersects*` answers a yes/no question; `intersection*` returns an `IntersectionType` (`Disjoint`, `Intersects`, or `Contains`) when you need to distinguish a partial overlap from full containment.

## Collision utilities

`Collision.ts` is the low-level engine behind the bounding volume methods above, and can be used directly for tighter control or when working with raw min/max points, centers/radii, etc. instead of volume instances. It's organized in three layers:

1. **Free functions** doing the actual math, named `<shapeA><shapeB>Intersects` (boolean) or `<shapeA><shapeB>Intersection` (`IntersectionType`), taking primitive components directly, e.g. `rayBoxIntersects(rayPos, rayDir, boxMin, boxMax)`, `sphereSphereIntersection(c1, r1, c2, r2)`. There are also `*IntersectsAt` variants returning the ray parameter `t` of the hit instead of a boolean, and `closestPointOnSegment`/`closestPointOnPlane`/`closestPointOnTriangle` helpers.
2. **`Intersects`** — a namespace of convenience functions keyed by shape-pair name (`Intersects.boxSphere(box, sphere)`, `Intersects.rayBox(ray, box)`, ...) that accept actual volume instances (`BoundingBox`, `BoundingSphere`, `Ray`, ...) and return a boolean, delegating to the free functions above.
3. **`Intersection`** — the same idea as `Intersects`, but returning an `IntersectionType` instead of a boolean, for callers that need to distinguish partial overlap from full containment.

`PlaneIntersectionType` (`Back` / `Front` / `Intersects`) is the plane-specific counterpart of `IntersectionType`, used by the `plane*Intersection` functions to say which side of a plane a shape is on (or that it straddles it).

## Transform utilities for bounding volumes

The `utils/transform*` functions (`transformBox`, `transformSphere`, `transformCapsule`, `transformFrustum`, `transformPlane`) recompute a bounding volume after a `Mat4` transform has been applied — e.g. `transformBox(box, matrix, out)` finds the new axis-aligned box that encloses the transformed corners of `box`. These are the tools to use when moving a precomputed local-space bounding volume into world space.

## Other utilities

The `utils` folder rounds out the package with small standalone helpers used throughout the structures above and by consumers of the library: `lerp`, `hermite`, `ease` (easing curves), `clamp`, `toRadians`/`toDegrees`, `srgb` (color space conversion), and `time`. The `random` folder provides seedable pseudo-random number generators (`MersenneTwister`, `PCG32`) for when `Math.random()`'s lack of seeding is a problem (e.g. reproducible procedural generation).
