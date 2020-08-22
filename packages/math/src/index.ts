/**
 * A 3d math library
 *
 * @packageDocumentation
 * @remarks
 * This package implements common structures used in 3D computations like
 *
 * - {@link Vec2}
 * - {@link Vec3}
 * - {@link Vec4}
 * - {@link Mat2}
 * - {@link Mat3}
 * - {@link Mat4}
 * - {@link Quat}
 *
 * The api offers various operations among these structures as static functions and as instance methods.
 * All structures share the same API design principles
 *
 * Functions starting with `create` do create a new instance of a structure, for example:
 *
 * ```ts
 * Vec3.create(1, 2, 3)
 * Vec3.createZero()
 * ```
 *
 * Function starting with `init` do initialize an existing instance or object
 *
 * ```ts
 * Vec3.init({}, 1, 2, 3) // initializes the given object `{}`
 * Vec3.init(v, 1, 2, 3)  // initializes the given instance `v`
 * v.init(1, 2, 3)        // initializes the instance `v`
 * ```
 *
 * Operations as instance methods modify the instance
 *
 * ```ts
 * v1.multiply(v2) // writes the result into `v1`
 * ```
 *
 * Operations as static methods create a new instance or write the result to the optional `out` parameter
 *
 * ```ts
 * Vec3.multiply(v1, v2)     // creates and returns a new Vec3 instance
 * Vec3.multiply(v1, v2, v3) // writes result into the given instance `v3` and retruns it
 * Vec3.multiply(v1, v2, {}) // writes result into the given instance `{}` and returns it
 * ```
 */

export * from './BoundingBox'
export * from './BoundingCapsule'
export * from './BoundingFrustum'
export * from './BoundingSphere'
export * from './BoundingVolume'
export * from './Collision'
export * from './Mat2'
export * from './Mat3'
export * from './Mat4'
export * from './Plane'
export * from './Quat'
export * from './Ray'
export * from './Rect'
export * from './Types'
export * from './Vec2'
export * from './Vec3'
export * from './Vec4'
