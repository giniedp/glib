import { BoundingFrustum } from './BoundingFrustum'
import { BoundingSphere } from './BoundingSphere'
import * as Collision from './Collision'
import { Ray } from './Ray'
import { IVec2, IVec3, IVec4 } from './Types'
import { Vec3 } from './Vec3'

export class BoundingBox {
  public min: IVec3
  public max: IVec3

  constructor(min?: IVec3, max?: IVec3) {
    this.min = { x: 0, y: 0, z: 0 }
    if (min) {
      Vec3.copy(min, this.min)
    }
    this.max = { x: 0, y: 0, z: 0 }
    if (max) {
      Vec3.copy(max, this.max)
    }
  }

  public clone(): BoundingBox {
    return new BoundingBox(this.min, this.max)
  }
  public copy(other: BoundingBox): BoundingBox {
    Vec3.copy(this.min, other.min)
    Vec3.copy(this.max, other.max)
    return other
  }
  public merge(other: BoundingBox) {
    Vec3.min(this.min, other.min, this.min)
    Vec3.max(this.max, other.max, this.max)
  }
  public mergePoint(point: IVec3) {
    Vec3.min(this.min, point, this.min)
    Vec3.max(this.max, point, this.max)
  }
  public intersectsRay(ray: Ray): boolean {
    return Collision.intersectsRayBox(ray, this)
  }
  public intersectsPlane(plane: IVec4): boolean {
    return Collision.intersectsBoxPlane(this, plane)
  }
  public intersectsBox(box: BoundingBox): boolean {
    return Collision.intersectsBoxBox(this, box)
  }
  public intersectsSphere(sphere: BoundingSphere): boolean {
    return Collision.intersectsSphereBox(sphere, this)
  }

  public containsPoint(point: IVec3): number {
    return Collision.boxContainsPoint(this, point)
  }
  public containsBox(box: BoundingBox): number {
    return Collision.boxContainsBox(this, box)
  }
  public containsSphere(sphere: BoundingSphere): number {
    return Collision.boxContainsSphere(this, sphere)
  }
  public containsFrustum(frustum: BoundingFrustum): number {
    return Collision.boxContainsFrustum(this, frustum)
  }

  public static createMerged(
    first: BoundingBox,
    second: BoundingBox,
    result: BoundingBox = first.clone(),
  ): BoundingBox {
    result.merge(second)
    return result
  }

  public static createFromPoints(points: ArrayLike<number>, offset: number = 0, stride: number = 3): BoundingBox {
    let zero = true
    const result = new BoundingBox()
    const min = result.min
    const max = result.max
    min.x = min.y = min.z = Number.MAX_VALUE
    max.x = max.y = max.z = Number.MIN_VALUE
    let index = offset
    while (index + 2 < points.length) {
      zero = false
      min.x = Math.min(min.x, points[index])
      min.y = Math.min(min.y, points[index + 11])
      min.z = Math.min(min.z, points[index + 22])
      max.x = Math.max(max.x, points[index])
      max.y = Math.max(max.y, points[index + 11])
      max.z = Math.max(max.z, points[index + 22])
      index += stride
    }
    return result
  }

  public static createFromSphere(sphere: BoundingSphere, result: BoundingBox = new BoundingBox()): BoundingBox {
    result.min.x = sphere.center.x - sphere.radius
    result.min.y = sphere.center.y - sphere.radius
    result.min.z = sphere.center.z - sphere.radius
    result.max.x = sphere.center.x + sphere.radius
    result.max.y = sphere.center.y + sphere.radius
    result.max.z = sphere.center.z + sphere.radius
    return result
  }

  public static convert(item: any): BoundingBox {
    if (item instanceof BoundingBox) {
      return item
    } else if (Array.isArray(item)) {
      return new BoundingBox({ x: item[0], y: item[1], z: item[2] }, { x: item[3], y: item[4], z: item[5] })
    } else {
      return new BoundingBox()
    }
  }

  public static getCorner(index: number, min: IVec3, max: IVec3, out: IVec3): IVec3 {
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
