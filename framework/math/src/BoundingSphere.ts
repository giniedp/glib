import { BoundingBox } from './BoundingBox'
import { BoundingFrustum } from './BoundingFrustum'
import * as Collision from './Collision'
import { Ray } from './Ray'
import { ArrayLike, IVec2, IVec3, IVec4 } from './Types'
import { Vec3 } from './Vec3'

export class BoundingSphere {
  public center: IVec3
  public radius: number

  constructor(center?: IVec3, radius?: number) {
    this.center = new Vec3()
    if (center) {
      Vec3.clone(center, this.center)
    }
    this.radius = radius === void 0 ? 0 : radius
  }

  public clone(): BoundingSphere {
    return new BoundingSphere(this.center, this.radius)
  }
  public copy(other: BoundingSphere): BoundingSphere {
    Vec3.clone(this.center, other.center)
    other.radius = this.radius
    return other
  }
  public merge(other: BoundingSphere): BoundingSphere {
    const distance = Vec3.distance(this.center, other.center)
    if (this.radius >= distance + other.radius) {
      return this
    }
    this.radius = distance + other.radius
    return this
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
    return Collision.intersectsRaySphere(ray, this)
  }
  public intersectsBox(box: BoundingBox): boolean {
    return Collision.intersectsSphereBox(this, box)
  }
  public intersectsSphere(sphere: BoundingSphere): boolean {
    return Collision.intersectsSphereSphere(sphere, this)
  }
  public intersectsPlane(plane: IVec4): boolean {
    return Collision.intersectsSpherePlane(this, plane)
  }

  public containsSphere(sphere: BoundingSphere): number {
    return Collision.sphereContainsSphere(this, sphere)
  }
  public containsBox(box: BoundingBox): number {
    return Collision.sphereContainsBox(this, box)
  }
  public containsPoint(point: IVec3): number {
    return Collision.sphereContainsPoint(this, point)
  }
  public containsFrustum(frustum: BoundingFrustum): number {
    return Collision.sphereContainsFrustum(this, frustum)
  }

  public static createFromPoints(points: ArrayLike<number>, offset: number= 0, stride: number= 3): BoundingSphere {
    let zero = true
    const min = { x: 0, y: 0, z: 0 }
    const max = { x: 0, y: 0, z: 0 }
    min.x = min.y = min.z = Number.MAX_VALUE
    max.x = max.y = max.z = Number.MIN_VALUE
    let index = offset
    while (index + 2 < points.length) {
      zero = false
      min.x = Math.min(min.x, points[index])
      min.y = Math.min(min.y, points[index + 1])
      min.z = Math.min(min.z, points[index + 2])
      max.x = Math.max(max.x, points[index])
      max.y = Math.max(max.y, points[index + 1])
      max.z = Math.max(max.z, points[index + 2])
      index += stride
    }
    const radius = Vec3.distance(min, max) * 0.5
    const center = Vec3.lerp(min, max, 0.5)
    return new BoundingSphere(min, radius)
  }

  public static createFromBox(box: BoundingBox): BoundingSphere {
    const radius = Vec3.distance(box.min, box.max) * 0.5
    const center = Vec3.lerp(box.min, box.max, 0.5)
    return new BoundingSphere(center, radius)
  }

  public static convert(item: any): BoundingSphere {
    if (item instanceof BoundingSphere) {
      return item
    } else if (Array.isArray(item)) {
      return new BoundingSphere({ x: item[0], y: item[1], z: item[2] }, item[3])
    } else {
      return new BoundingSphere()
    }
  }
}
