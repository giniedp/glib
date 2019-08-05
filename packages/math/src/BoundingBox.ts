import { BoundingFrustum } from './BoundingFrustum'
import { BoundingSphere } from './BoundingSphere'
import {
  boxBoxIntersection,
  boxFrustumIntersection,
  boxIntersectBox,
  boxIntersectSphere,
  boxIntersectsPlane,
  boxIntersectsPoint,
  boxSphereIntersection,
  rayIntersectsBox,
} from './Collision'

import { Ray } from './Ray'
import { ArrayLike, IVec3, IVec4 } from './Types'
import { Vec3 } from './Vec3'

/**
 * An axis aligned box volume.
 *
 * @public
 */
export class BoundingBox {
  /**
   * The minimum contained point
   */
  public min: IVec3 = { x: 0, y: 0, z: 0}
  /**
   * The maximum contained point
   */
  public max: IVec3 = { x: 0, y: 0, z: 0}

  /**
   * Constructs a new instance of {@link BoundingBox}
   *
   * @param minX - x component of the minimum point
   * @param minY - y component of the minimum point
   * @param minZ - z component of the minimum point
   * @param maxX - x component of the maximum point
   * @param maxY - y component of the maximum point
   * @param maxZ - z component of the maximum point
   */
  constructor(minX?: number, minY?: number, minZ?: number, maxX?: number, maxY?: number, maxZ?: number) {
    this.min.x = minX || 0
    this.min.y = minY || 0
    this.min.z = minZ || 0
    this.max.x = maxX || 0
    this.max.y = maxY || 0
    this.max.z = maxZ || 0
  }

  /**
   * Constructs a new instance of {@link BoundingBox}
   *
   * @param minX - x component of the minimum point
   * @param minY - y component of the minimum point
   * @param minZ - z component of the minimum point
   * @param maxX - x component of the maximum point
   * @param maxY - y component of the maximum point
   * @param maxZ - z component of the maximum point
   */
  public static create(minX?: number, minY?: number, minZ?: number, maxX?: number, maxY?: number, maxZ?: number): BoundingBox {
    return new BoundingBox(minX, minY, minZ, maxX, maxY, maxZ)
  }

  /**
   * Initializes the {@link BoundingBox} instance with values
   *
   * @param minX - x component of the minimum point
   * @param minY - y component of the minimum point
   * @param minZ - z component of the minimum point
   * @param maxX - x component of the maximum point
   * @param maxY - y component of the maximum point
   * @param maxZ - z component of the maximum point
   */
  public init(minX?: number, minY?: number, minZ?: number, maxX?: number, maxY?: number, maxZ?: number): this {
    this.min.x = minX || 0
    this.min.y = minY || 0
    this.min.z = minZ || 0
    this.max.x = maxX || 0
    this.max.y = maxY || 0
    this.max.z = maxZ || 0
    return this
  }

  /**
   * Creates a new instance and copies values from given box
   *
   * @param box - the box to initialize from
   */
  public static createFrom(box: BoundingBox): BoundingBox {
    return new BoundingBox(
      box.min.x,
      box.min.y,
      box.min.z,
      box.max.x,
      box.max.y,
      box.max.z,
    )
  }

  /**
   * Initializes this instance by copying the values from given box
   *
   * @param box - the box to initialize from
   */
  public initFrom(box: BoundingBox): this {
    this.min.x = box.min.x
    this.min.y = box.min.y
    this.min.z = box.min.z
    this.max.x = box.max.x
    this.max.y = box.max.y
    this.max.z = box.max.z
    return this
  }

  /**
   * Creates a new instance by copying the given min and max points
   *
   * @param min - the min point
   * @param max - the max point
   */
  public static createFromMinMax(min: IVec3, max: IVec3): BoundingBox {
    return new BoundingBox(
      min.x,
      min.y,
      min.z,
      max.x,
      max.y,
      max.z,
    )
  }

  /**
   * Initializes this instance by copying the given min and max points
   *
   * @param min - the min point
   * @param max - the max point
   */
  public initFromMinMax(min: IVec3, max: IVec3): this {
    this.min.x = min.x
    this.min.y = min.y
    this.min.z = min.z
    this.max.x = max.x
    this.max.y = max.y
    this.max.z = max.z
    return this
  }

  /**
   * Creates a new instance that contains the given sphere
   *
   * @param sphere - the sphere volume to contain
   */
  public static createFromSphere(sphere: BoundingSphere): BoundingBox {
    return new BoundingBox(
      sphere.center.x - sphere.radius,
      sphere.center.y - sphere.radius,
      sphere.center.z - sphere.radius,
      sphere.center.x + sphere.radius,
      sphere.center.y + sphere.radius,
      sphere.center.z + sphere.radius,
    )
  }

  /**
   * Initializes this instance to contain the given sphere
   *
   * @param sphere - the sphere volume to contain
   */
  public initFromSphere(sphere: BoundingSphere): this {
    this.min.x = sphere.center.x - sphere.radius
    this.min.y = sphere.center.y - sphere.radius
    this.min.z = sphere.center.z - sphere.radius
    this.max.x = sphere.center.x + sphere.radius
    this.max.y = sphere.center.y + sphere.radius
    this.max.z = sphere.center.z + sphere.radius
    return this
  }

  /**
   * Creates a new instance from a numbers array
   *
   * @param array - the numbers array forming a point list
   * @param offset - offset at which to start reading in array. Default is `0`
   * @param stride - step size for each iteration. Default is `3`
   */
  public static createFromArray(array: ArrayLike<number>, offset?: number, stride?: number): BoundingBox {
    return new BoundingBox().initFromArray(array, offset, stride)
  }

  /**
   * Initializes this instance from a numbers array
   *
   * @param array - the numbers array forming a point list
   * @param offset - offset at which to start reading in array. Default is `0`
   * @param stride - step size for each iteration. Default is `3`
   */
  public initFromArray(array: ArrayLike<number>, offset: number = 0, stride: number = 3): BoundingBox {
    let zero = true
    const min = this.min
    const max = this.max
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
      this.init(0, 0, 0, 0, 0, 0)
    }
    return this
  }

  /**
   * Creates a new instance from a point list
   *
   * @param array - the point list
   * @param offset - the offset in `array`
   */
  public static createFromPoints(array: IVec3[], offset?: number): BoundingBox {
    return new BoundingBox().initFromPoints(array, offset)
  }

  /**
   * Initializes this instance from a point list
   *
   * @param array - the point list
   * @param offset - the offset in `array`
   */
  public initFromPoints(array: IVec3[], offset = 0): BoundingBox {
    let zero = true
    const min = this.min
    const max = this.max
    min.x = min.y = min.z = Number.MAX_VALUE
    max.x = max.y = max.z = Number.MIN_VALUE
    for (let i = offset; i < array.length; i++) {
      zero = false
      const vec = array[i]
      min.x = Math.min(min.x, vec.x)
      min.y = Math.min(min.y, vec.y)
      min.z = Math.min(min.z, vec.z)
      max.x = Math.max(max.x, vec.x)
      max.y = Math.max(max.y, vec.y)
      max.z = Math.max(max.z, vec.z)
    }
    if (zero) {
      this.init(0, 0, 0, 0, 0, 0)
    }
    return this
  }

  /**
   * Clones this instance into a new or an existing one
   *
   * @param box - the box to clone
   * @param out - where the result is written to
   * @retruns the given `out` parameter or a new instance
   */
  public static clone(box: BoundingBox, out?: BoundingBox): BoundingBox {
    out = out || new BoundingBox()
    out.initFrom(box)
    return out
  }

  /**
   * Clones this instance into a new or an existing one
   *
   * @param out - where the result is written to
   * @retruns the given `out` parameter or a new instance
   */
  public clone(out?: BoundingBox): BoundingBox {
    out = out || new BoundingBox()
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
  public toArray(array: number[] = [], offset: number= 0): number[] {
    Vec3.toArray(this.min, array, offset)
    Vec3.toArray(this.max, array, offset + 3)
    return array
  }

  /**
   * Dumps the min and max points into an array
   */
  public static toArray(box: BoundingBox): number[]
  /**
   * Dumps the min and max points into an array at given offset
   */
  public static toArray<T>(box: BoundingBox, array: T, offset?: number): T
  public static toArray(box: BoundingBox, array: number[] = [], offset: number = 0): number[] {
    Vec3.toArray(box.min, array, offset)
    Vec3.toArray(box.max, array, offset + 3)
    return array
  }

  /**
   * Checks whether two instances are equal
   */
  public static equals(a: BoundingBox, b: BoundingBox): boolean {
    return Vec3.equals(a.min, b.min) && Vec3.equals(a.max, b.max)
  }

  /**
   * Checks for equality with another instance
   */
  public equals(other: BoundingBox): boolean {
    return Vec3.equals(this.min, other.min) && Vec3.equals(this.max, other.max)
  }

  /**
   * Merges another volume into this by expanding this volume if necessary
   *
   * @param other - the volume to merge
   */
  public merge(other: BoundingBox): this {
    Vec3.min(this.min, other.min, this.min)
    Vec3.max(this.max, other.max, this.max)
    return this
  }

  /**
   * Creates a new box by merging two volumes
   *
   * @param box1 - the first volume
   * @param box2 - the second volume
   * @param out - where the result should be written to
   * @returns the given `out` parameter or a new instance
   */
  public static merge(box1: BoundingBox, box2: BoundingBox, out?: BoundingBox): BoundingBox {
    out = out || new BoundingBox()
    Vec3.min(box1.min, box2.min, out.min)
    Vec3.max(box1.max, box2.max, out.max)
    return out
  }

  /**
   * Merges a point into this volume by expanding the volume if necessary
   *
   * @param point - the point to merge
   */
  public mergePoint(point: IVec3): this {
    Vec3.min(this.min, point, this.min)
    Vec3.max(this.max, point, this.max)
    return this
  }

  /**
   * Creates a new box by merging a box and a point by expanding the volume if necessary
   *
   * @param box - the box to merge
   * @param point - the point to merge
   * @param out - where the result should be written to
   * @returns the given `out` parameter or a new instance
   */
  public static mergePoint(box: BoundingBox, point: IVec3, out?: BoundingBox): BoundingBox {
    out = out || new BoundingBox()
    Vec3.min(box.min, point, out.min)
    Vec3.max(box.max, point, out.max)
    return out
  }

  /**
   * Checks whether the given ray intersects this volume
   */
  public intersectsRay(ray: Ray): boolean {
    return rayIntersectsBox(ray.position, ray.direction, this.min, this.max)
  }
  /**
   * Checks whether the given plane intersects this volume
   */
  public intersectsPlane(plane: IVec4): boolean {
    return boxIntersectsPlane(this.min, this.max, plane)
  }
  /**
   * Checks whether the given box intersects this volume
   */
  public intersectsBox(box: BoundingBox): boolean {
    return boxIntersectBox(this.min, this.max, box.min, box.max)
  }
  /**
   * Checks whether the given sphere intersects this volume
   */
  public intersectsSphere(sphere: BoundingSphere): boolean {
    return boxIntersectSphere(sphere.center, sphere.radius, this.min, this.max)
  }

  /**
   * Checks whether the given point is contained by this volume
   */
  public containsPoint(point: IVec3): boolean {
    return boxIntersectsPoint(this.min, this.max, point)
  }
  /**
   * Checks whether the given box is contained by this volume
   */
  public containsBox(box: BoundingBox): boolean {
    return boxBoxIntersection(this.min, this.max, box.min, box.max) === 2
  }
  /**
   * Checks whether the given sphere is contained by this volume
   */
  public containsSphere(sphere: BoundingSphere): boolean {
    return boxSphereIntersection(this.min, this.max, sphere.center, sphere.radius) === 2
  }
  /**
   * Checks whether the given frustum is contained by this volume
   */
  public containsFrustum(frustum: BoundingFrustum): boolean {
    return boxFrustumIntersection(this.min, this.max, frustum) === 2
  }

  /**
   * Checks for collosion with another box and returns the intersection type
   */
  public intersectionWithBox(box: BoundingBox): number {
    return boxBoxIntersection(this.min, this.max, box.min, box.max)
  }
  /**
   * Checks for collosion with another sphere and returns the intersection type
   */
  public intersectionWithSphere(sphere: BoundingSphere): number {
    return boxSphereIntersection(this.min, this.max, sphere.center, sphere.radius)
  }
  /**
   * Checks for collosion with another frustum and returns the intersection type
   */
  public intersectionWithFrustum(frustum: BoundingFrustum): number {
    return boxFrustumIntersection(this.min, this.max, frustum)
  }

  /**
   * Converts an array into a BoundingBox.
   *
   * @remarks
   * For convenience the method accepts a `BoundingBox` instance as a parameter
   * which is instantly returned.
   *
   * @param item - the data to convert
   * @returns a BoundingBox instance or `null` if conversion fails
   */
  public static convert(item: BoundingBox | number[] | Float32Array): BoundingBox {
    if (item instanceof BoundingBox) {
      return item
    } else if (item instanceof Float32Array || Array.isArray(item)) {
      return BoundingBox.createFromArray(item)
    }
    return null
  }

  /**
   * Gets the 3D-coordinate of a corner of the box
   *
   * @param index - the corner index
   */
  public getCorner(index: number): Vec3
  /**
   * Gets the 3D-coordinate of a corner of the box
   *
   * @param index - the corner index
   * @param out - where the result should be written to
   */
  public getCorner<T>(index: number, out?: T): T & IVec3
  public getCorner(index: number, out?: IVec3): IVec3 {
    return BoundingBox.getCorner(index, this.min, this.max, out)
  }

  /**
   * Gets the 3D-coordinate of a corner of the box
   *
   * @param index - the corner index
   * @param min - this min point in box
   * @param max - this max point in box
   */
  public static getCorner(index: number, min: IVec3, max: IVec3): Vec3
  /**
   * Gets the 3D-coordinate of a corner of the box
   *
   * @param index - the corner index
   * @param min - this min point in box
   * @param max - this max point in box
   * @param out - where the result should be written to
   */
  public static getCorner<T>(index: number, min: IVec3, max: IVec3, out?: T): T & IVec3
  public static getCorner(index: number, min: IVec3, max: IVec3, out?: IVec3): IVec3 {
    out = out || new Vec3()
    if (index === 0) {
      out.x = min.x
      out.y = max.y
      out.z = max.z
    } else if (index === 1) {
      out.x = max.x
      out.y = max.y
      out.z = max.z
    } else if (index === 2) {
      out.x = max.x
      out.y = min.y
      out.z = max.z
    } else if (index === 3) {
      out.x = min.x
      out.y = min.y
      out.z = max.z
    } else if (index === 4) {
      out.x = min.x
      out.y = max.y
      out.z = min.z
    } else if (index === 5) {
      out.x = max.x
      out.y = max.y
      out.z = min.z
    } else if (index === 6) {
      out.x = max.x
      out.y = min.y
      out.z = min.z
    } else if (index === 7) {
      out.x = min.x
      out.y = min.y
      out.z = min.z
    } else {
      throw new Error('index out of range')
    }
    return out
  }
}
