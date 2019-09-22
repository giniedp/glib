import { BoundingBox } from './BoundingBox'
import { BoundingSphere } from './BoundingSphere'
import { boxIntersectsCapsule, PlaneIntersectionType, planeIntersectsCapsule, sphereIntersectsCapsule } from './Collision'
import { IVec3, IVec4 } from './Types'
import { Vec3 } from './Vec3'

/**
 * @public
 */
export class BoundingCapsule {
  /**
   * The start point of medial line
   */
  public readonly start: Vec3
  /**
   * The end point of medial line
   */
  public readonly end: Vec3
  /**
   * The radius
   */
  public radius: number

  /**
   * Constructs a new {@link BoundingCapsule}
   *
   * @param startX - x component of start point
   * @param startY - y component of start point
   * @param startZ - z component of start point
   * @param endX - x component of end point
   * @param endY - y component of end point
   * @param endZ - z component of end point
   * @param radius - the radius
   */
  constructor(
    startX?: number,
    startY?: number,
    startZ?: number,
    endX?: number,
    endY?: number,
    endZ?: number,
    radius?: number,
  ) {
    this.start = new Vec3(startX, startY, startZ)
    this.end = new Vec3(endX, endY, endZ)
    this.radius = radius || 0
  }

  /**
   * Creates a new {@link BoundingCapsule}
   *
   * @param startX - x component of start point
   * @param startY - y component of start point
   * @param startZ - z component of start point
   * @param endX - x component of end point
   * @param endY - y component of end point
   * @param endZ - z component of end point
   * @param radius - the radius
   */
  public static create(
    startX?: number,
    startY?: number,
    startZ?: number,
    endX?: number,
    endY?: number,
    endZ?: number,
    radius?: number,
  ) {
    return new BoundingCapsule(
      startX,
      startY,
      startZ,
      endX,
      endY,
      endZ,
      radius,
    )
  }

  /**
   * Initializes this instance with given values
   *
   * @param startX - x component of start point
   * @param startY - y component of start point
   * @param startZ - z component of start point
   * @param endX - x component of end point
   * @param endY - y component of end point
   * @param endZ - z component of end point
   * @param radius - the radius
   */
  public init(
    startX?: number,
    startY?: number,
    startZ?: number,
    endX?: number,
    endY?: number,
    endZ?: number,
    radius?: number,
  ) {
    this.start.x = startX
    this.start.y = startY
    this.start.z = startZ
    this.end.x = endX
    this.end.y = endY
    this.end.z = endZ
    this.radius = radius
    return this
  }

  /**
   * Creates a new {@link BoundingCapsule}
   *
   * @param start - the start point
   * @param end - the end point
   * @param radius - the radius
   */
  public static createV(start: IVec3, end: IVec3, radius: number): BoundingCapsule {
    return new BoundingCapsule(
      start.x,
      start.y,
      start.z,
      end.x,
      end.y,
      end.z,
      radius,
    )
  }

  /**
   * Initializes this instance with given values
   *
   * @param start - the start point
   * @param end - the end point
   * @param radius - the radius
   */
  public initV(start: IVec3, end: IVec3, radius: number) {
    this.start.x = start.x
    this.start.y = start.y
    this.start.z = start.z
    this.end.x = end.x
    this.end.y = end.y
    this.end.z = end.z
    this.radius = radius
    return this
  }

  /**
   * Creates a new instance and copies values from given box
   *
   * @param other - the capsule to initialize from
   */
  public static createFrom(other: BoundingCapsule): BoundingCapsule {
    return new BoundingCapsule(
      other.start.x,
      other.start.y,
      other.start.z,
      other.end.x,
      other.end.y,
      other.end.z,
      other.radius,
    )
  }

  /**
   * Initializes this instance by copying the values from given box
   *
   * @param other - the capsule to initialize from
   */
  public initFrom(other: BoundingCapsule): this {
    this.start.x = other.start.x
    this.start.y = other.start.y
    this.start.z = other.start.z
    this.end.x = other.end.x
    this.end.y = other.end.y
    this.end.z = other.end.z
    this.radius = other.radius
    return this
  }

  /**
   * Creates a new instance from a numbers array
   *
   * @param array - the numbers array forming a serialized bounding capsule
   * @param offset - offset at which to start reading in array. Default is `0`
   * @param stride - step size for each iteration. Default is `3`
   */
  public static createFromArray(array: ArrayLike<number>, offset?: number, stride?: number): BoundingCapsule {
    return new BoundingCapsule().initFromArray(array, offset, stride)
  }

  /**
   * Initializes this instance from a numbers array
   *
   * @param array - the numbers array forming a serialized bounding capsule
   * @param offset - offset at which to start reading in array. Default is `0`
   * @param stride - step size for each iteration. Default is `3`
   */
  public initFromArray(array: ArrayLike<number>, offset: number = 0, stride: number = 3): BoundingCapsule {
    this.start.x = array[offset + 0]
    this.start.y = array[offset + 1]
    this.start.z = array[offset + 2]
    this.end.x = array[offset + 3]
    this.end.y = array[offset + 4]
    this.end.z = array[offset + 5]
    this.radius = array[offset + 6]
    return this
  }

  // public static createFromSphere(sphere: BoundingSphere): BoundingCapsule {
  //   // TODO:
  //   throw new Error('not implemented')
  // }

  // public initFromSphere(sphere: BoundingSphere): this {
  //   // TODO:
  //   throw new Error('not implemented')
  //   return this
  // }

  // public static createFromBox(box: BoundingBox): BoundingCapsule {
  //   // TODO:
  //   throw new Error('not implemented')
  // }

  // public initFromBox(box: BoundingBox): this {
  //   // TODO:
  //   throw new Error('not implemented')
  //   return this
  // }

  // public static createFromPoints(points: IVec3[], offset?: number): BoundingCapsule {
  //   // TODO:
  //   throw new Error('not implemented')
  // }

  // public initFromPoints(points: IVec3[], offset?: number): this {
  //   // TODO:
  //   throw new Error('not implemented')
  //   return this
  // }

  /**
   * Clones this instance into a new or an existing one
   *
   * @param capsule - the box to clone
   * @param out - where the result is written to
   * @returns the given `out` parameter or a new instance
   */
  public static clone(capsule: BoundingCapsule, out?: BoundingCapsule): BoundingCapsule {
    out = out || new BoundingCapsule()
    out.initFrom(capsule)
    return out
  }

  /**
   * Clones this instance into a new or an existing one
   *
   * @param out - where the result is written to
   * @returns the given `out` parameter or a new instance
   */
  public clone(out?: BoundingCapsule): BoundingCapsule {
    out = out || new BoundingCapsule()
    out.initFrom(this)
    return out
  }

  /**
   * Dumps the min and max points into an array
   */
  public toArray(): number[]
  /**
   * Dumps the min and max points into an array at given offset
   */
  public toArray<T extends ArrayLike<number>>(array: T, offset?: number): T
  public toArray(array: number[] = [], offset: number = 0): number[] {
    Vec3.toArray(this.start, array, offset)
    Vec3.toArray(this.end, array, offset + 3)
    array[offset + 6] = this.radius
    return array
  }

  /**
   * Dumps the min and max points into an array
   */
  public static toArray(capsule: BoundingCapsule): number[]
  /**
   * Dumps the min and max points into an array at given offset
   */
  public static toArray<T>(capsule: BoundingCapsule, array: T, offset?: number): T
  public static toArray(capsule: BoundingCapsule, array: number[] = [], offset: number = 0): number[] {
    Vec3.toArray(capsule.start, array, offset)
    Vec3.toArray(capsule.end, array, offset + 3)
    array[offset + 6] = capsule.radius
    return array
  }

  /**
   * Checks whether two instances are equal
   */
  public static equals(a: BoundingCapsule, b: BoundingCapsule): boolean {
    return Vec3.equals(a.start, b.start) && Vec3.equals(a.end, b.end) && a.radius === b.radius
  }

  /**
   * Checks for equality with another instance
   */
  public equals(other: BoundingCapsule): boolean {
    return Vec3.equals(this.start, other.start) && Vec3.equals(this.end, other.end) && this.radius === other.radius
  }

  /**
   * Converts an array into a BoundingCapsule.
   *
   * @remarks
   * For convenience the method accepts a `BoundingCapsule` instance as a parameter
   * which is instantly returned.
   *
   * @param item - the data to convert
   * @returns a BoundingCapsule instance or `null` if conversion fails
   */
  public static convert(item: BoundingCapsule | number[] | Float32Array): BoundingCapsule {
    if (item instanceof BoundingCapsule) {
      return item
    } else if (item instanceof Float32Array || Array.isArray(item)) {
      return BoundingCapsule.createFromArray(item)
    }
    return null
  }

  // /**
  //  * Checks whether the given point intersects this volume
  //  */
  // public intersectsPoint(point: IVec3): boolean {
  //   // TODO:
  //   throw new Error('not implemented')
  // }
  // /**
  //  * Checks whether the given ray intersects this volume
  //  */
  // public intersectsRay(ray: Ray): boolean {
  //   // TODO:
  //   throw new Error('not implemented')
  // }
  /**
   * Checks whether the given plane intersects this volume
   */
  public intersectsPlane(plane: IVec4): boolean {
    return planeIntersectsCapsule(plane, this.start, this.end, this.radius) === PlaneIntersectionType.Intersects
  }

  /**
   * Checks whether the given box intersects this volume
   */
  public intersectsBox(box: BoundingBox): boolean {
    return boxIntersectsCapsule(box.min, box.max, this.start, this.end, this.radius)
  }
  /**
   * Checks whether the given sphere intersects this volume
   */
  public intersectsSphere(sphere: BoundingSphere): boolean {
    return sphereIntersectsCapsule(sphere.center, sphere.radius, this.start, this.end, this.radius)
  }

  // /**
  //  * Checks whether the given box is contained by this volume
  //  */
  // public containsBox(box: BoundingBox): boolean {
  //   // TODO:
  //   throw new Error('not implemented')
  // }
  // /**
  //  * Checks whether the given sphere is contained by this volume
  //  */
  // public containsSphere(sphere: BoundingSphere): boolean {
  //   // TODO:
  //   throw new Error('not implemented')
  // }
  // /**
  //  * Checks whether the given frustum is contained by this volume
  //  */
  // public containsFrustum(frustum: BoundingFrustum): boolean {
  //   // TODO:
  //   throw new Error('not implemented')
  // }

  // /**
  //  * Checks for collision with another sphere and returns the intersection type
  //  */
  // public containmentOfSphere(sphere: BoundingSphere): ContainmentType {
  //   // TODO:
  //   throw new Error('not implemented')
  // }
  // /**
  //  * Checks for collision with another box and returns the intersection type
  //  */
  // public containmentOfBox(box: BoundingBox): ContainmentType {
  //   // TODO:
  //   throw new Error('not implemented')
  // }
  // /**
  //  * Checks for collision with another sphere and returns the intersection type
  //  */
  // public containmentOfCapsule(capsule: BoundingCapsule): ContainmentType {
  //   // TODO:
  //   throw new Error('not implemented')
  // }
  // /**
  //  * Checks for collision with another frustum and returns the intersection type
  //  */
  // public containmentOfFrustum(frustum: BoundingFrustum): ContainmentType {
  //   // TODO:
  //   throw new Error('not implemented')
  // }
}
