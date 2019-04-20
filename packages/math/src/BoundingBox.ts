import { BoundingFrustum } from './BoundingFrustum'
import { BoundingSphere } from './BoundingSphere'
import * as Collision from './Collision'
import { Ray } from './Ray'
import { ArrayLike, IVec2, IVec3, IVec4 } from './Types'
import { Vec3 } from './Vec3'

/**
 * Defines an axis aligned box volume.
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
   * Checks if every component is zero
   */
  public get isZero() {
    return this.min.x === 0 && this.min.y === 0 && this.min.z === 0 && this.max.x === 0 && this.max.y === 0 && this.max.z
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
  constructor(minX?: number, minY?: number, minZ?: number, maxX?: number, maxY?: number, maxZ?: number) {
    this.min.x = minX || 0
    this.min.y = minY || 0
    this.min.z = minZ || 0
    this.max.x = maxX || 0
    this.max.y = maxY || 0
    this.max.z = maxZ || 0
  }

  /**
   * Initialises the instance {@link BoundingBox}
   *
   * @param minX - x component of the minimum point
   * @param minY - y component of the minimum point
   * @param minZ - z component of the minimum point
   * @param maxX - x component of the maximum point
   * @param maxY - y component of the maximum point
   * @param maxZ - z component of the maximum point
   */
  public init(minX?: number, minY?: number, minZ?: number, maxX?: number, maxY?: number, maxZ?: number): BoundingBox {
    this.min.x = minX || 0
    this.min.y = minY || 0
    this.min.z = minZ || 0
    this.max.x = maxX || 0
    this.max.y = maxY || 0
    this.max.z = maxZ || 0
    return this
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

  public initFrom(box: BoundingBox): BoundingBox {
    this.min.x = box.min.x
    this.min.y = box.min.y
    this.min.z = box.min.z
    this.max.x = box.max.x
    this.max.y = box.max.y
    this.max.z = box.max.z
    return this
  }

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

  public initFromMinMax(min: IVec3, max: IVec3): BoundingBox {
    this.min.x = min.x
    this.min.y = min.y
    this.min.z = min.z
    this.max.x = max.x
    this.max.y = max.y
    this.max.z = max.z
    return this
  }

  public static createFromMinMax(min: IVec3, max: IVec3) {
    return new BoundingBox(
      min.x,
      min.y,
      min.z,
      max.x,
      max.y,
      max.z,
    )
  }

  public initFromSphere(sphere: BoundingSphere): BoundingBox {
    this.min.x = sphere.center.x - sphere.radius
    this.min.y = sphere.center.y - sphere.radius
    this.min.z = sphere.center.z - sphere.radius
    this.max.x = sphere.center.x + sphere.radius
    this.max.y = sphere.center.y + sphere.radius
    this.max.z = sphere.center.z + sphere.radius
    return this
  }

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

  public initFromBuffer(buffer: ArrayLike<number>, offset: number = 0, stride: number = 3): BoundingBox {
    let zero = true
    const min = this.min
    const max = this.max
    min.x = min.y = min.z = Number.MAX_VALUE
    max.x = max.y = max.z = Number.MIN_VALUE
    let index = offset
    while (index + 2 < buffer.length) {
      zero = false
      min.x = Math.min(min.x, buffer[index])
      min.y = Math.min(min.y, buffer[index + 1])
      min.z = Math.min(min.z, buffer[index + 2])
      max.x = Math.max(max.x, buffer[index])
      max.y = Math.max(max.y, buffer[index + 1])
      max.z = Math.max(max.z, buffer[index + 2])
      index += stride
    }
    return this
  }

  public static createFromBuffer(buffer: ArrayLike<number>, offset?: number, stride?: number): BoundingBox {
    return new BoundingBox().initFromBuffer(buffer, offset, stride)
  }

  public initFromVec3Buffer(buffer: IVec3[]): BoundingBox {
    let zero = true
    const min = this.min
    const max = this.max
    min.x = min.y = min.z = Number.MAX_VALUE
    max.x = max.y = max.z = Number.MIN_VALUE
    for (const vec of buffer) {
      zero = false
      min.x = Math.min(min.x, vec.x)
      min.y = Math.min(min.y, vec.y)
      min.z = Math.min(min.z, vec.z)
      max.x = Math.max(max.x, vec.x)
      max.y = Math.max(max.y, vec.y)
      max.z = Math.max(max.z, vec.z)
    }
    return this
  }

  public static createFromVec3Buffer(buffer: IVec3[]): BoundingBox {
    return new BoundingBox().initFromVec3Buffer(buffer)
  }

  public clone(out?: BoundingBox): BoundingBox {
    out = out || new BoundingBox()
    Vec3.clone(this.min, out.min)
    Vec3.clone(this.max, out.max)
    return out
  }

  public static clone(box: BoundingBox, out?: BoundingBox): BoundingBox {
    out = out || new BoundingBox()
    Vec3.clone(box.min, out.min)
    Vec3.clone(box.max, out.max)
    return out
  }

  public toArray<T extends ArrayLike<number>>(buffer: T, offset: number= 0): T {
    Vec3.toArray(this.min, buffer, offset)
    Vec3.toArray(this.max, buffer, offset + 3)
    return buffer
  }

  public static toArray<T extends ArrayLike<number>>(src: BoundingBox, buffer: T, offset: number= 0): T {
    Vec3.toArray(src.min, buffer, offset)
    Vec3.toArray(src.max, buffer, offset + 3)
    return buffer
  }

  public equals(other: BoundingBox): boolean {
    return Vec3.equals(this.min, other.min) && Vec3.equals(this.max, other.max)
  }

  public static equals(a: BoundingBox, b: BoundingBox): boolean {
    return Vec3.equals(a.min, b.min) && Vec3.equals(a.max, b.max)
  }

  public merge(other: BoundingBox): BoundingBox {
    Vec3.min(this.min, other.min, this.min)
    Vec3.max(this.max, other.max, this.max)
    return this
  }

  public static merge(box1: BoundingBox, box2: BoundingBox, out?: BoundingBox): BoundingBox {
    out = out || new BoundingBox()
    Vec3.min(box1.min, box2.min, out.min)
    Vec3.max(box1.max, box2.max, out.max)
    return out
  }

  public mergePoint(point: IVec3): BoundingBox {
    Vec3.min(this.min, point, this.min)
    Vec3.max(this.max, point, this.max)
    return this
  }

  public static mergePoint(box: BoundingBox, point: IVec3, out?: BoundingBox): BoundingBox {
    out = out || new BoundingBox()
    Vec3.min(box.min, point, out.min)
    Vec3.max(box.max, point, out.max)
    return out
  }

  public intersectsRay(ray: Ray): boolean {
    return Collision.rayIntersectsBox(ray.position, ray.direction, this.min, this.max)
  }
  public intersectsPlane(plane: IVec4): boolean {
    return Collision.boxIntersectsPlane(this.min, this.max, plane)
  }
  public intersectsBox(box: BoundingBox): boolean {
    return Collision.boxIntersectBox(this.min, this.max, box.min, box.max)
  }
  public intersectsSphere(sphere: BoundingSphere): boolean {
    return Collision.boxIntersectSphere(sphere.center, sphere.radius, this.min, this.max)
  }

  public containsPoint(point: IVec3): boolean {
    return Collision.boxIntersectsPoint(this.min, this.max, point)
  }
  public containsBox(box: BoundingBox): boolean {
    return Collision.boxBoxIntersection(this.min, this.max, box.min, box.max) === 2
  }
  public containsSphere(sphere: BoundingSphere): boolean {
    return Collision.boxSphereIntersection(this.min, this.max, sphere.center, sphere.radius) === 2
  }
  public containsFrustum(frustum: BoundingFrustum): boolean {
    return Collision.boxFrustumIntersection(this.min, this.max, frustum) === 2
  }

  public intersectionWithBox(box: BoundingBox): number {
    return Collision.boxBoxIntersection(this.min, this.max, box.min, box.max)
  }
  public intersectionWithSphere(sphere: BoundingSphere): number {
    return Collision.boxSphereIntersection(this.min, this.max, sphere.center, sphere.radius)
  }
  public intersectionWithFrustum(frustum: BoundingFrustum): number {
    return Collision.boxFrustumIntersection(this.min, this.max, frustum)
  }

  public static convert(item: BoundingBox|number[]): BoundingBox {
    if (item instanceof BoundingBox) {
      return item
    } else if (Array.isArray(item)) {
      return new BoundingBox(item[0], item[1], item[2], item[3], item[4], item[5])
    } else {
      return new BoundingBox()
    }
  }

  public dump(): number[] {
    return [this.min.x, this.min.y, this.min.z, this.max.x, this.max.y, this.max.z]
  }

  public getCorner<T extends IVec3 = Vec3>(index: 0|1|2|3|4|5|6|7, out?: T|Vec3): T {
    return BoundingBox.getCorner(index, this.min, this.max, out)
  }

  public static getCorner<T extends IVec3 = Vec3>(index: 0|1|2|3|4|5|6|7, min: IVec3, max: IVec3, out?: T|Vec3): T {
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
    return out as T
  }
}
