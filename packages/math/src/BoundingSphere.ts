import { BoundingBox } from './BoundingBox'
import { BoundingFrustum } from './BoundingFrustum'
import {
  boxIntersectSphere,
  rayIntersectsSphere,
  sphereBoxIntersection,
  sphereFrustumIntersection,
  sphereIntersectsPlane,
  sphereIntersectsPoint,
  sphereIntersectsSphere,
  sphereSphereIntersection,
} from './Collision'
import { Ray } from './Ray'
import { ArrayLike, IVec3, IVec4 } from './Types'
import { Vec3 } from './Vec3'

/**
 * Defines sphere volume.
 *
 * @public
 */
export class BoundingSphere {

  /**
   * The sphere center
   */
  public center: IVec3 = { x: 0, y: 0, z: 0}

  /**
   * The sphere radius
   */
  public radius: number = 0

  /**
   * Constructs a new instance of {@link BoundingSphere}
   *
   * @param x - component of the center point
   * @param y - component of the center point
   * @param z - component of the center point
   * @param r - the radius
   */
  constructor(x?: number, y?: number, z?: number, r?: number) {
    this.center.x = x || 0
    this.center.y = y || 0
    this.center.z = z || 0
    this.radius = r || 0
  }

  /**
   * Creates a new instance with given parameters
   *
   * @param x - x coordinate of sphere center
   * @param y - y coordinate of sphere center
   * @param z - z coordinate of sphere center
   * @param r - radius of the sphere
   */
  public static create(x?: number, y?: number, z?: number, r?: number) {
    return new BoundingSphere(x, y, z, r)
  }

  /**
   * Initializes this instance with given parameters
   *
   * @param x - x coordinate of sphere center
   * @param y - y coordinate of sphere center
   * @param z - z coordinate of sphere center
   * @param r - radius of the sphere
   */
  public init(x?: number, y?: number, z?: number, r?: number): BoundingSphere {
    this.center.x = x || 0
    this.center.y = y || 0
    this.center.z = z || 0
    this.radius = r || 0
    return this
  }

  /**
   * Creates a new instance by copying given instance
   *
   * @param other - the instance to copy from
   */
  public static createFrom(other: BoundingSphere): BoundingSphere {
    return new BoundingSphere(
      other.center.x,
      other.center.y,
      other.center.z,
      other.radius,
    )
  }

  /**
   * Initializes this instance by copying given instance
   *
   * @param other - the instance to copy from
   */
  public initFrom(other: BoundingSphere): BoundingSphere {
    this.center.x = other.center.x
    this.center.y = other.center.y
    this.center.z = other.center.z
    this.radius = other.radius
    return this
  }

  /**
   * Creates a new instance by copying given parameters
   *
   * @param center - the sphere center pooint to copy
   * @param radius - the sphere radius
   */
  public static createFromCenterRadius(center: IVec3, radius: number): BoundingSphere {
    return new BoundingSphere(
      center.x,
      center.y,
      center.z,
      radius,
    )
  }

  /**
   * Initializes this instance by copying given parameters
   *
   * @param center - the sphere center pooint to copy
   * @param radius - the sphere radius
   */
  public initFromCenterRadius(center: IVec3, radius: number): BoundingSphere {
    this.center.x = center.x
    this.center.y = center.y
    this.center.z = center.z
    this.radius = radius
    return this
  }

  /**
   * Creates a new instance that contains the given volume
   *
   * @param box - the box volume to containe
   */
  public static createFromBox(box: BoundingBox): BoundingSphere {
    const out = new BoundingSphere()
    out.radius = Vec3.distance(box.min, box.max) * 0.5
    Vec3.lerp(box.min, box.max, 0.5, out.center)
    return out
  }

  /**
   * Initializes this instance to contain the given volume
   *
   * @param box - the box volume to containe
   */
  public initFromBox(box: BoundingBox): BoundingSphere {
    this.radius = Vec3.distance(box.min, box.max) * 0.5
    Vec3.lerp(box.min, box.max, 0.5, this.center)
    return this
  }

  /**
   * Creates a new instance from a numbers array
   *
   * @param array - the numbers array forming a point list
   * @param offset - offset at which to start reading in array. Default is `0`
   * @param stride - step size for each iteration. Default is `3`
   */
  public static createFromArray(array: ArrayLike<number>, offset?: number, stride?: number): BoundingSphere {
    return new BoundingSphere().initFromArray(array, offset, stride)
  }

  /**
   * Initializes this instance from a numbers array
   *
   * @param array - the numbers array forming a point list
   * @param offset - offset at which to start reading in array. Default is `0`
   * @param stride - step size for each iteration. Default is `3`
   */
  public initFromArray(array: ArrayLike<number>, offset: number = 0, stride: number = 3): BoundingSphere {
    let zero = true
    const min = { x: 0, y: 0, z: 0 }
    const max = { x: 0, y: 0, z: 0 }
    min.x = min.y = min.z = Number.MAX_VALUE
    max.x = max.y = max.z = Number.MIN_VALUE
    let index = offset
    while (index + 2 < array.length) {
      zero = false
      min.x = Math.min(min.x, array[index])
      min.y = Math.min(min.y, array[index + 1])
      min.z = Math.min(min.z, array[index + 2])
      max.x = Math.max(max.x, array[index])
      max.y = Math.max(max.y, array[index + 1])
      max.z = Math.max(max.z, array[index + 2])
      index += stride
    }
    if (zero) {
      this.init(0, 0, 0, 0)
    } else {
      this.radius = Vec3.distance(min, max) * 0.5
      Vec3.lerp(min, max, 0.5, this.center)
    }
    return this
  }

  /**
   * Creates a new instance from a point list
   *
   * @param array - the point list
   * @param offset - the offset in `array`
   */
  public static createFromPoints(array: IVec3[]): BoundingSphere {
    return new BoundingSphere().initFromPoints(array)
  }

  /**
   * Initializes this instance from a point list
   *
   * @param array - the point list
   * @param offset - the offset in `array`
   */
  public initFromPoints(array: IVec3[]): BoundingSphere {
    let zero = true
    const min = { x: 0, y: 0, z: 0 }
    const max = { x: 0, y: 0, z: 0 }
    min.x = min.y = min.z = Number.MAX_VALUE
    max.x = max.y = max.z = Number.MIN_VALUE
    for (const vec of array) {
      zero = false
      min.x = Math.min(min.x, vec.x)
      min.y = Math.min(min.y, vec.y)
      min.z = Math.min(min.z, vec.z)
      max.x = Math.max(max.x, vec.x)
      max.y = Math.max(max.y, vec.y)
      max.z = Math.max(max.z, vec.z)
    }
    this.radius = Vec3.distance(min, max) * 0.5
    Vec3.lerp(min, max, 0.5, this.center)
    return this
  }

  /**
   * Clones this instance into a new or an existing one
   *
   * @param sphere - the volume to clone
   * @param out - where the result is written to
   * @retruns the given `out` parameter or a new instance
   */
  public static clone(sphere: BoundingSphere, out?: BoundingSphere): BoundingSphere {
    out = out || new BoundingSphere()
    out.initFrom(sphere)
    return out
  }

  /**
   * Clones this instance into a new or an existing one
   *
   * @param out - where the result is written to
   * @retruns the given `out` parameter or a new instance
   */
  public clone(out?: BoundingSphere): BoundingSphere {
    out = out || new BoundingSphere()
    Vec3.clone(this.center, out.center)
    out.radius = this.radius
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
  public toArray(array: number[] = [], offset: number= 0): number[] {
    Vec3.toArray(this.center, array, offset)
    array[offset + 3] = this.radius
    return array
  }

  /**
   * Dumps the min and max points into an array
   */
  public static toArray(box: BoundingSphere): number[]
  /**
   * Dumps the min and max points into an array at given offset
   */
  public static toArray<T>(sphere: BoundingSphere, array: T, offset?: number): T
  public static toArray(sphere: BoundingSphere, array: number[] = [], offset: number = 0): number[] {
    Vec3.toArray(sphere.center, array, offset)
    array[offset + 3] = sphere.radius
    return array
  }

  /**
   * Checks whether two instances are equal
   */
  public static equals(a: BoundingSphere, b: BoundingSphere): boolean {
    return Vec3.equals(a.center, b.center) && a.radius === b.radius
  }

  /**
   * Checks for equality with another instance
   */
  public equals(other: BoundingSphere): boolean {
    return Vec3.equals(this.center, other.center) && this.radius === other.radius
  }

  /**
   * Creates a instance by merging a sphere and a point by expanding the volume if necessary
   *
   * @param sphere - the sphere to merge
   * @param point - the point to merge
   * @param out - where the result should be written to
   * @returns the given `out` parameter or a new instance
   */
  public static mergePoint(sphere: BoundingSphere, point: IVec3, out?: BoundingSphere): BoundingSphere {
    out = out || new BoundingSphere()
    out.initFrom(sphere)
    out.mergePoint(point)
    return out
  }

  /**
   * Merges a point into this volume by expanding the volume if necessary
   *
   * @param point - the point to merge
   */
  public mergePoint(point: IVec3): BoundingSphere {
    const distance = Vec3.distance(this.center, point)
    if (this.radius < distance) {
      this.radius = distance
    }
    return this
  }

  /**
   * Checks whether the given ray intersects this volume
   */
  public intersectsRay(ray: Ray): boolean {
    return rayIntersectsSphere(ray.position, ray.direction, this.center, this.radius)
  }
  /**
   * Checks whether the given box intersects this volume
   */
  public intersectsBox(box: BoundingBox): boolean {
    return boxIntersectSphere(this.center, this.radius, box.min, box.max)
  }
  /**
   * Checks whether the given sphere intersects this volume
   */
  public intersectsSphere(sphere: BoundingSphere): boolean {
    return sphereIntersectsSphere(this.center, this.radius, sphere.center, sphere.radius)
  }
  /**
   * Checks whether the given plane intersects this volume
   */
  public intersectsPlane(plane: IVec4): boolean {
    return sphereIntersectsPlane(this.center, this.radius, plane)
  }

  /**
   * Checks whether the given point is contained by this volume
   */
  public containsPoint(point: IVec3): boolean {
    return sphereIntersectsPoint(this.center, this.radius, point)
  }
  /**
   * Checks whether the given box is contained by this volume
   */
  public containsBox(box: BoundingBox): boolean {
    return sphereBoxIntersection(this.center, this.radius, box.min, box.max) === 2
  }
  /**
   * Checks whether the given sphere is contained by this volume
   */
  public containsSphere(sphere: BoundingSphere): boolean {
    return sphereSphereIntersection(this.center, this.radius, sphere.center, sphere.radius) === 2
  }
  /**
   * Checks whether the given frustum is contained by this volume
   */
  public containsFrustum(frustum: BoundingFrustum): boolean {
    return sphereFrustumIntersection(this.center, this.radius, frustum) === 2
  }

  /**
   * Checks for collosion with another box and returns the intersection type
   */
  public intersectionWithBox(box: BoundingBox): number {
    return sphereBoxIntersection(this.center, this.radius, box.min, box.max)
  }
  /**
   * Checks for collosion with another sphere and returns the intersection type
   */
  public intersectionWithSphere(sphere: BoundingSphere): number {
    return sphereSphereIntersection(this.center, this.radius, sphere.center, sphere.radius)
  }
  /**
   * Checks for collosion with another frustum and returns the intersection type
   */
  public intersectionWithFrustum(frustum: BoundingFrustum): number {
    return sphereFrustumIntersection(this.center, this.radius, frustum)
  }

  /**
   * Converts an array into a BoundingSphere.
   *
   * @remarks
   * For convenience the method accepts a `BoundingSphere` instance as a parameter
   * which is instantly returned.
   *
   * @param item - the data to convert
   * @returns a BoundingSphere instance or `null` if conversion fails
   */
  public static convert(item: BoundingSphere | number[] | Float32Array): BoundingSphere {
    if (item instanceof BoundingSphere) {
      return item
    } else if (Array.isArray(item)) {
      return BoundingSphere.createFromArray(item)
    } else {
      return null
    }
  }

}
