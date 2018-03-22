import { BoundingBox } from './BoundingBox'
import { BoundingFrustum } from './BoundingFrustum'
import * as Collision from './Collision'
import { Ray } from './Ray'
import { ArrayLike, IVec2, IVec3, IVec4 } from './Types'
import { Vec3 } from './Vec3'

/**
 * @public
 */
export class BoundingSphere {
  public center: IVec3 = { x: 0, y: 0, z: 0}
  public radius: number

  constructor(x?: number, y?: number, z?: number, r?: number) {
    this.center.x = x || 0
    this.center.y = y || 0
    this.center.z = z || 0
    this.radius = r || 0
  }

  public init(x?: number, y?: number, z?: number, r?: number): BoundingSphere {
    this.center.x = x || 0
    this.center.y = y || 0
    this.center.z = z || 0
    this.radius = r || 0
    return this
  }

  public static create(x?: number, y?: number, z?: number, r?: number) {
    return new BoundingSphere(x, y, z, r)
  }

  public initFrom(other: BoundingSphere): BoundingSphere {
    this.center.x = other.center.x
    this.center.y = other.center.y
    this.center.z = other.center.z
    this.radius = other.radius
    return this
  }

  public static createFrom(other: BoundingSphere): BoundingSphere {
    return new BoundingSphere(
      other.center.x,
      other.center.y,
      other.center.z,
      other.radius,
    )
  }

  public initFromCenterRadius(center: IVec3, radius: number): BoundingSphere {
    this.center.x = center.x
    this.center.y = center.y
    this.center.z = center.z
    this.radius = radius
    return this
  }

  public static createFromCenterRadius(center: IVec3, radius: number): BoundingSphere {
    return new BoundingSphere(
      center.x,
      center.y,
      center.z,
      radius,
    )
  }

  public initFromBox(box: BoundingBox): BoundingSphere {
    this.radius = Vec3.distance(box.min, box.max) * 0.5
    Vec3.lerp(box.min, box.max, 0.5, this.center)
    return this
  }

  public static createFromBox(box: BoundingBox): BoundingSphere {
    const out = new BoundingSphere()
    out.radius = Vec3.distance(box.min, box.max) * 0.5
    Vec3.lerp(box.min, box.max, 0.5, out.center)
    return out
  }

  public initFromBuffer(buffer: ArrayLike<number>, offset: number = 0, stride: number = 3): BoundingSphere {
    let zero = true
    const min = { x: 0, y: 0, z: 0 }
    const max = { x: 0, y: 0, z: 0 }
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
    this.radius = Vec3.distance(min, max) * 0.5
    Vec3.lerp(min, max, 0.5, this.center)
    return this
  }

  public static createFromBuffer(buffer: ArrayLike<number>, offset?: number, stride?: number): BoundingSphere {
    return new BoundingSphere().initFromBuffer(buffer, offset, stride)
  }

  public initFromVec3Buffer(buffer: IVec3[]): BoundingSphere {
    let zero = true
    const min = { x: 0, y: 0, z: 0 }
    const max = { x: 0, y: 0, z: 0 }
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
    this.radius = Vec3.distance(min, max) * 0.5
    Vec3.lerp(min, max, 0.5, this.center)
    return this
  }

  public static createFromVec3Buffer(buffer: IVec3[]): BoundingSphere {
    return new BoundingSphere().initFromVec3Buffer(buffer)
  }

  public clone(out?: BoundingSphere): BoundingSphere {
    out = out || new BoundingSphere()
    Vec3.clone(this.center, out.center)
    out.radius = this.radius
    return out
  }

  public static clone(src: BoundingSphere, out?: BoundingSphere): BoundingSphere {
    out = out || new BoundingSphere()
    Vec3.clone(src.center, out.center)
    out.radius = src.radius
    return out
  }

  public copy<T extends ArrayLike<number>>(buffer: T, offset: number= 0): T {
    Vec3.copy(this.center, buffer, offset)
    buffer[offset + 3] = this.radius
    return buffer
  }

  public static copy<T extends ArrayLike<number>>(src: BoundingSphere, buffer: T, offset: number= 0): T {
    Vec3.copy(src.center, buffer, offset)
    buffer[offset + 3] = src.radius
    return buffer
  }

  public equals(other: BoundingSphere): boolean {
    return Vec3.equals(this.center, other.center) && this.radius === other.radius
  }

  public static equals(a: BoundingSphere, b: BoundingSphere): boolean {
    return Vec3.equals(a.center, b.center) && a.radius === b.radius
  }

  public mergePoint(point: IVec3): BoundingSphere {
    const distance = Vec3.distance(this.center, point)
    if (this.radius >= distance) {
      return this
    }
    this.radius = distance
    return this
  }

  public intersectsRay(ray: Ray): boolean {
    return Collision.rayIntersectsSphere(ray.position, ray.direction, this.center, this.radius)
  }
  public intersectsBox(box: BoundingBox): boolean {
    return Collision.boxIntersectSphere(this.center, this.radius, box.min, box.max)
  }
  public intersectsSphere(sphere: BoundingSphere): boolean {
    return Collision.sphereIntersectsSphere(this.center, this.radius, sphere.center, sphere.radius)
  }
  public intersectsPlane(plane: IVec4): boolean {
    return Collision.sphereIntersectsPlane(this.center, this.radius, plane)
  }

  public containsPoint(point: IVec3): boolean {
    return Collision.sphereIntersectsPoint(this.center, this.radius, point)
  }
  public containsBox(box: BoundingBox): boolean {
    return Collision.sphereBoxIntersection(this.center, this.radius, box.min, box.max) === 2
  }
  public containsSphere(sphere: BoundingSphere): boolean {
    return Collision.sphereSphereIntersection(this.center, this.radius, sphere.center, sphere.radius) === 2
  }
  public containsFrustum(frustum: BoundingFrustum): boolean {
    return Collision.sphereFrustumIntersection(this.center, this.radius, frustum) === 2
  }

  public intersectionWithBox(box: BoundingBox): number {
    return Collision.sphereBoxIntersection(this.center, this.radius, box.min, box.max)
  }
  public intersectionWithSphere(sphere: BoundingSphere): number {
    return Collision.sphereSphereIntersection(this.center, this.radius, sphere.center, sphere.radius)
  }
  public intersectionWithFrustum(frustum: BoundingFrustum): number {
    return Collision.sphereFrustumIntersection(this.center, this.radius, frustum)
  }

  public static convert(item: any): BoundingSphere {
    if (item instanceof BoundingSphere) {
      return item
    } else if (Array.isArray(item)) {
      return new BoundingSphere(item[0], item[1], item[2], item[3])
    } else {
      return new BoundingSphere()
    }
  }
}
