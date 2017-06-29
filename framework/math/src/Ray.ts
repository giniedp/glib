import { BoundingBox } from './BoundingBox'
import { BoundingSphere } from './BoundingSphere'
import * as Collision from './Collision'
import { IVec2, IVec3, IVec4 } from './Types'
import { Vec3 } from './Vec3'

export class Ray {
  public position: IVec3
  public direction: IVec3

  constructor(pX?: number, pY?: number, pZ?: number, dX?: number, dY?: number, dZ?: number) {
    this.position = {
      x: pX || 0,
      y: pY || 0,
      z: pZ || 0,
    }
    this.direction = {
      x: dX || 0,
      y: dY || 0,
      z: dZ || 0,
    }
  }

  public init(pX?: number, pY?: number, pZ?: number, dX?: number, dY?: number, dZ?: number): Ray {
    this.position.x = pX || 0
    this.position.y = pY || 0
    this.position.z = pZ || 0
    this.direction.x = dX || 0
    this.direction.y = dY || 0
    this.direction.z = dZ || 0
    return this
  }

  public static create(pX?: number, pY?: number, pZ?: number, dX?: number, dY?: number, dZ?: number): Ray {
    return new Ray(pX, pY, pZ, dX, dY, dZ)
  }

  public initFrom(ray: Ray): Ray {
    return this.initFromVectors(ray.position, ray.direction)
  }

  public static createFrom(ray: Ray): Ray {
    return this.createFromVectors(ray.position, ray.direction)
  }

  public initFromVectors(position: IVec3, direction: IVec3): Ray {
    this.position.x = position.x
    this.position.y = position.y
    this.position.z = position.z
    this.direction.x = direction.x
    this.direction.y = direction.y
    this.direction.z = direction.z
    return this
  }

  public static createFromVectors(position: IVec3, direction: IVec3): Ray {
    return new Ray(
      position.x,
      position.y,
      position.z,
      direction.x,
      direction.y,
      direction.z,
    )
  }

  public clone(out?: Ray): Ray {
    out = out || new Ray()
    return out.initFrom(this)
  }

  public static clone(src: Ray, out?: Ray): Ray {
    out = out || new Ray()
    return out.initFrom(src)
  }

  public equals(other: Ray): boolean {
    return Vec3.equals(this.position, other.position) && Vec3.equals(this.direction, other.direction)
  }

  public static equals(a: Ray, b: Ray): boolean {
    return Vec3.equals(a.position, b.position) && Vec3.equals(a.direction, b.direction)
  }

  public positionAt<T extends IVec3>(distance: number, result?: T): T {
    result = result || new Vec3() as any
    result.x = this.direction.x * distance + this.position.x
    result.y = this.direction.y * distance + this.position.y
    result.z = this.direction.z * distance + this.position.z
    return result
  }

  public static positionAt<T extends IVec3>(ray: Ray, distance: number, result?: T): T {
    result = result || new Vec3() as any
    result.x = ray.direction.x * distance + ray.position.x
    result.y = ray.direction.y * distance + ray.position.y
    result.z = ray.direction.z * distance + ray.position.z
    return result
  }

  public intersectsSphere(sphere: BoundingSphere): boolean {
    return Collision.intersectsRaySphere(this, sphere)
  }
  public intersectsBox(box: BoundingBox): boolean {
    return Collision.intersectsRayBox(this, box)
  }
  public intersectsPlane(plane: IVec4): boolean {
    return Collision.intersectsRayPlane(this, plane)
  }
  public intersectsTriangle(a: IVec3, b: IVec3, c: IVec3): boolean {
    return Collision.intersectsRayTriangle(this, a, b, c)
  }

  public intersectsSphereAt(sphere: BoundingSphere): number {
    return Collision.intersectionRaySphere(this, sphere)
  }
  public intersectsBoxAt(box: BoundingBox): number {
    return Collision.intersectionRayBox(this, box)
  }
  public intersectsPlaneAt(plane: IVec4): number {
    return Collision.intersectionRayPlane(this, plane)
  }
  public intersectsTriangleAt(a: IVec3, b: IVec3, c: IVec3): number {
    return Collision.intersectionRayTriangle(this, a, b, c)
  }
}
