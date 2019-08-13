import { BoundingBox } from './BoundingBox'
import { BoundingSphere } from './BoundingSphere'
import {
  rayIntersectsBox,
  rayIntersectsBoxAt,
  rayIntersectsPlane,
  rayIntersectsPlaneAt,
  rayIntersectsSphere,
  rayIntersectsSphereAt,
  rayIntersectsTriangle,
  rayIntersectsTriangleAt,
} from './Collision'
import { IVec3, IVec4 } from './Types'
import { Vec3 } from './Vec3'

/**
 * A ray with a starting position and a pointing direction.
 *
 * @public
 */
export class Ray {
  /**
   * The ray origin
   */
  public readonly position: Vec3
  /**
   * The ray direction
   */
  public readonly direction: Vec3

  /**
   * Constructs a new instance of {@link Ray}
   */
  constructor(pX?: number, pY?: number, pZ?: number, dX?: number, dY?: number, dZ?: number) {
    this.position = Vec3.create(pX, pY, pZ)
    this.direction = Vec3.create(dX, dY, dZ)
  }

  /**
   * Initializes the ray to given components
   *
   * @param pX - x component of ray origin
   * @param pY - y component of ray origin
   * @param pZ - z component of ray origin
   * @param dX - x component of ray direction
   * @param dY - y component of ray direction
   * @param dZ - z component of ray direction
   */
  public init(pX?: number, pY?: number, pZ?: number, dX?: number, dY?: number, dZ?: number): Ray {
    this.position.x = pX || 0
    this.position.y = pY || 0
    this.position.z = pZ || 0
    this.direction.x = dX || 0
    this.direction.y = dY || 0
    this.direction.z = dZ || 0
    return this
  }

  /**
   * Creates a new ray from given components
   *
   * @param pX - x component of ray origin
   * @param pY - y component of ray origin
   * @param pZ - z component of ray origin
   * @param dX - x component of ray direction
   * @param dY - y component of ray direction
   * @param dZ - z component of ray direction
   */
  public static create(pX?: number, pY?: number, pZ?: number, dX?: number, dY?: number, dZ?: number): Ray {
    return new Ray(pX, pY, pZ, dX, dY, dZ)
  }

  /**
   * Initializes the ray by copying the given vectors
   *
   * @param position - the ray position to copy
   * @param direction - the ray direction to copy
   */
  public initV(position: IVec3, direction: IVec3): Ray {
    this.position.x = position.x
    this.position.y = position.y
    this.position.z = position.z
    this.direction.x = direction.x
    this.direction.y = direction.y
    this.direction.z = direction.z
    return this
  }

  /**
   * Creates a new ray by copying the given vectors
   *
   * @param position - the ray position to copy
   * @param direction - the ray direction to copy
   */
  public static createV(position: IVec3, direction: IVec3): Ray {
    return new Ray(
      position.x,
      position.y,
      position.z,
      direction.x,
      direction.y,
      direction.z,
    )
  }

  /**
   * Initializes the ray by copying the given ray
   *
   * @param ray - the ray to copy
   */
  public initFrom(ray: Ray): Ray {
    return this.initV(ray.position, ray.direction)
  }

  /**
   * Creates a new ray by copying the given ray
   *
   * @param ray - the ray to copy
   */
  public static createFrom(ray: Ray): Ray {
    return this.createV(ray.position, ray.direction)
  }

  /**
   * Clones this ray
   *
   * @param out - where the result should be written to
   * @returns - the given `out` parameter or a new vector
   */
  public clone(out?: Ray): Ray {
    out = out || new Ray()
    return out.initFrom(this)
  }

  /**
   * Clones the given ray
   *
   * @param ray - the ray to clone
   * @param out - where the result should be written to
   * @returns - the given `out` parameter or a new ray
   */
  public static clone(ray: Ray, out?: Ray): Ray {
    out = out || new Ray()
    return out.initFrom(ray)
  }

  /**
   * Compares this to another ray for component wise equality
   *
   * @param other - the ray to compare with
   */
  public equals(other: Ray): boolean {
    return Vec3.equals(this.position, other.position) && Vec3.equals(this.direction, other.direction)
  }

  /**
   * Compares two rays for component wise equality
   *
   * @param a - the first ray to compare
   * @param b - the second ray to compare
   */
  public static equals(a: Ray, b: Ray): boolean {
    return Vec3.equals(a.position, b.position) && Vec3.equals(a.direction, b.direction)
  }

  /**
   * Calculates the position at given distance from ray origin along ray direction
   *
   * @param distance - the distance from ray origin
   * @returns - a new Vector
   */
  public positionAt(distance: number): Vec3
  /**
   * Calculates the position at given distance from ray origin along ray direction
   *
   * @param distance - the distance from ray origin
   * @param out - where the result should be written to
   * @returns - the given `out` parameter or a new vector
   */
  public positionAt<T>(distance: number, out?: T): T & IVec3
  public positionAt(distance: number, out?: IVec3): IVec3 {
    out = out || new Vec3() as any
    out.x = this.direction.x * distance + this.position.x
    out.y = this.direction.y * distance + this.position.y
    out.z = this.direction.z * distance + this.position.z
    return out
  }

  /**
   * Calculates the position at given distance from ray origin along ray direction
   *
   * @param ray - the ray in question
   * @param distance - the distance from ray origin
   * @returns - a new Vector
   */
  public static positionAt(ray: Ray, distance: number): Vec3
  /**
   * Calculates the position at given distance from ray origin along ray direction
   *
   * @param ray - the ray in question
   * @param distance - the distance from ray origin
   * @param out - where the result should be written to
   * @returns - the given `out` parameter or a new vector
   */
  public static positionAt<T>(ray: Ray, distance: number, out?: T): T & IVec3
  public static positionAt(ray: Ray, distance: number, out?: IVec3): IVec3 {
    out = out || new Vec3() as any
    out.x = ray.direction.x * distance + ray.position.x
    out.y = ray.direction.y * distance + ray.position.y
    out.z = ray.direction.z * distance + ray.position.z
    return out
  }

  public intersectsSphere(sphere: BoundingSphere): boolean {
    return rayIntersectsSphere(this.position, this.direction, sphere.center, sphere.radius)
  }
  public intersectsBox(box: BoundingBox): boolean {
    return rayIntersectsBox(this.position, this.direction, box.min, box.max)
  }
  public intersectsPlane(plane: IVec4): boolean {
    return rayIntersectsPlane(this.position, this.direction, plane)
  }
  public intersectsTriangle(a: IVec3, b: IVec3, c: IVec3): boolean {
    return rayIntersectsTriangle(this.position, this.direction, a, b, c)
  }

  public intersectsSphereAt(sphere: BoundingSphere): number {
    return rayIntersectsSphereAt(this.position, this.direction, sphere.center, sphere.radius)
  }
  public intersectsBoxAt(box: BoundingBox): number {
    return rayIntersectsBoxAt(this.position, this.direction, box.min, box.max)
  }
  public intersectsPlaneAt(plane: IVec4): number {
    return rayIntersectsPlaneAt(this.position, this.direction, plane)
  }
  public intersectsTriangleAt(a: IVec3, b: IVec3, c: IVec3): number {
    return rayIntersectsTriangleAt(this.position, this.direction, a, b, c)
  }
}
