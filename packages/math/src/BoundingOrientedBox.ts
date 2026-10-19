import { BoundingBox } from './BoundingBox'
import type { BoundingCylinder } from './BoundingCylinder'
import { BoundingSphere } from './BoundingSphere'
import { gjkIntersects } from './Gjk'
import { Mat4, mat4ApplyToVec3, mat4TransformNormal3 } from './Mat4'
import { IRay } from './Ray'
import type { IVec3 } from './Types'
import { RayInterval } from './utils/rayInterval'
import { vec3, vec3DistanceSquared } from './Vec3'

const tmp = vec3()

/**
 * Defines a box volume with arbitrary orientation
 *
 * @public
 */
export class BoundingOrientedBox {
  /**
   * The box center
   */
  public center: IVec3 = vec3()

  /**
   * Half the box size along each of its axes
   */
  public halfExtents: IVec3 = vec3()

  /**
   * The local x axis of the box. Unit length
   */
  public axisX: IVec3 = vec3(1, 0, 0)

  /**
   * The local y axis of the box. Unit length
   */
  public axisY: IVec3 = vec3(0, 1, 0)

  /**
   * The local z axis of the box. Unit length
   */
  public axisZ: IVec3 = vec3(0, 0, 1)

  /**
   * Creates an axis aligned box with given center and half extents
   */
  public static create(center?: IVec3, halfExtents?: IVec3): BoundingOrientedBox {
    return new BoundingOrientedBox().init(center, halfExtents)
  }

  /**
   * Initializes as axis aligned box with given center and half extents
   */
  public init(center?: IVec3, halfExtents?: IVec3): this {
    this.center.x = center?.x ?? 0
    this.center.y = center?.y ?? 0
    this.center.z = center?.z ?? 0
    this.halfExtents.x = halfExtents?.x ?? 0
    this.halfExtents.y = halfExtents?.y ?? 0
    this.halfExtents.z = halfExtents?.z ?? 0
    initAxis(this.axisX, 1, 0, 0)
    initAxis(this.axisY, 0, 1, 0)
    initAxis(this.axisZ, 0, 0, 1)
    return this
  }

  /**
   * Creates a new instance by copying given instance
   */
  public static createFrom(other: BoundingOrientedBox): BoundingOrientedBox {
    return new BoundingOrientedBox().initFrom(other)
  }

  /**
   * Initializes this instance by copying given instance
   */
  public initFrom(other: BoundingOrientedBox): this {
    copy(other.center, this.center)
    copy(other.halfExtents, this.halfExtents)
    copy(other.axisX, this.axisX)
    copy(other.axisY, this.axisY)
    copy(other.axisZ, this.axisZ)
    return this
  }

  /**
   * Creates an oriented box from an axis aligned box that is transformed by a matrix
   *
   * @param box - the box in local space
   * @param transform - the transform from local to target space
   */
  public static createFromBox(box: BoundingBox, transform?: Mat4): BoundingOrientedBox {
    return new BoundingOrientedBox().initFromBox(box, transform)
  }

  /**
   * Initializes from an axis aligned box that is transformed by a matrix
   *
   * @remarks
   * Rotation and scale of the matrix are applied. Shear is not supported, the axes are assumed to be orthogonal.
   *
   * @param box - the box in local space
   * @param transform - the transform from local to target space
   */
  public initFromBox(box: BoundingBox, transform?: Mat4): this {
    const c = this.center
    c.x = (box.min.x + box.max.x) * 0.5
    c.y = (box.min.y + box.max.y) * 0.5
    c.z = (box.min.z + box.max.z) * 0.5
    const h = this.halfExtents
    h.x = (box.max.x - box.min.x) * 0.5
    h.y = (box.max.y - box.min.y) * 0.5
    h.z = (box.max.z - box.min.z) * 0.5
    if (!transform) {
      initAxis(this.axisX, 1, 0, 0)
      initAxis(this.axisY, 0, 1, 0)
      initAxis(this.axisZ, 0, 0, 1)
      return this
    }
    mat4ApplyToVec3(transform, c, c)
    h.x *= transformAxis(transform, this.axisX, 1, 0, 0)
    h.y *= transformAxis(transform, this.axisY, 0, 1, 0)
    h.z *= transformAxis(transform, this.axisZ, 0, 0, 1)
    return this
  }

  /**
   * Calculates the axis aligned box that encloses this box
   */
  public getBoundingBox(out?: BoundingBox): BoundingBox {
    out ||= new BoundingBox()
    const { center: c, halfExtents: h, axisX: x, axisY: y, axisZ: z } = this
    const ex = Math.abs(x.x) * h.x + Math.abs(y.x) * h.y + Math.abs(z.x) * h.z
    const ey = Math.abs(x.y) * h.x + Math.abs(y.y) * h.y + Math.abs(z.y) * h.z
    const ez = Math.abs(x.z) * h.x + Math.abs(y.z) * h.y + Math.abs(z.z) * h.z
    out.min.x = c.x - ex
    out.min.y = c.y - ey
    out.min.z = c.z - ez
    out.max.x = c.x + ex
    out.max.y = c.y + ey
    out.max.z = c.z + ez
    return out
  }

  /**
   * Calculates the point on or inside the box that is closest to given point
   */
  public closestPoint(point: IVec3, out?: IVec3): IVec3 {
    out ||= vec3()
    const { center: c, halfExtents: h } = this
    const dx = point.x - c.x
    const dy = point.y - c.y
    const dz = point.z - c.z
    const u = clamp(dot(dx, dy, dz, this.axisX), h.x)
    const v = clamp(dot(dx, dy, dz, this.axisY), h.y)
    const w = clamp(dot(dx, dy, dz, this.axisZ), h.z)
    out.x = c.x + this.axisX.x * u + this.axisY.x * v + this.axisZ.x * w
    out.y = c.y + this.axisX.y * u + this.axisY.y * v + this.axisZ.y * w
    out.z = c.z + this.axisX.z * u + this.axisY.z * v + this.axisZ.z * w
    return out
  }

  /**
   * Calculates the point of the box that is furthest along given direction
   *
   * @remarks
   * This is the support function used by {@link gjkIntersects}
   */
  public support(direction: IVec3, out?: IVec3): IVec3 {
    out ||= vec3()
    const { center: c, halfExtents: h, axisX: x, axisY: y, axisZ: z } = this
    const u = sign(direction.x * x.x + direction.y * x.y + direction.z * x.z) * h.x
    const v = sign(direction.x * y.x + direction.y * y.y + direction.z * y.z) * h.y
    const w = sign(direction.x * z.x + direction.y * z.y + direction.z * z.z) * h.z
    out.x = c.x + x.x * u + y.x * v + z.x * w
    out.y = c.y + x.y * u + y.y * v + z.y * w
    out.z = c.z + x.z * u + y.z * v + z.z * w
    return out
  }

  /**
   * Checks whether given point is inside the box
   */
  public intersectsPoint(point: IVec3): boolean {
    const { center: c, halfExtents: h } = this
    const dx = point.x - c.x
    const dy = point.y - c.y
    const dz = point.z - c.z
    return (
      Math.abs(dot(dx, dy, dz, this.axisX)) <= h.x &&
      Math.abs(dot(dx, dy, dz, this.axisY)) <= h.y &&
      Math.abs(dot(dx, dy, dz, this.axisZ)) <= h.z
    )
  }

  /**
   * Checks whether given sphere intersects the box
   */
  public intersectsSphere(sphere: BoundingSphere): boolean {
    this.closestPoint(sphere.center, vec3.$0)
    const d = vec3DistanceSquared(vec3.$0, sphere.center)
    return d <= sphere.radius * sphere.radius
  }

  /**
   * Checks whether given oriented box intersects this box
   */
  public intersectsOrientedBox(box: BoundingOrientedBox): boolean {
    return gjkIntersects(this, box)
  }

  /**
   * Checks whether given cylinder intersects this box
   */
  public intersectsCylinder(cylinder: BoundingCylinder): boolean {
    return gjkIntersects(this, cylinder)
  }

  /**
   * Checks whether given ray intersects the box
   */
  public intersectsRay(ray: IRay): boolean {
    return !Number.isNaN(this.intersectsRayAt(ray))
  }

  /**
   * Calculates the distance along the ray where it enters the box
   *
   * @returns the distance in units of the ray direction, `0` if the ray starts inside the box or `NaN` if the ray misses
   */
  public intersectsRayAt(ray: IRay): number {
    const { center: c, halfExtents: h } = this
    const { position: p, direction: d } = ray
    const ox = p.x - c.x
    const oy = p.y - c.y
    const oz = p.z - c.z
    const slab = slabs.reset()
    if (
      !slab.clip(dot(ox, oy, oz, this.axisX), dot(d.x, d.y, d.z, this.axisX), -h.x, h.x) ||
      !slab.clip(dot(ox, oy, oz, this.axisY), dot(d.x, d.y, d.z, this.axisY), -h.y, h.y) ||
      !slab.clip(dot(ox, oy, oz, this.axisZ), dot(d.x, d.y, d.z, this.axisZ), -h.z, h.z)
    ) {
      return Number.NaN
    }
    return slab.result()
  }
}

const slabs = new RayInterval()

function initAxis(out: IVec3, x: number, y: number, z: number) {
  out.x = x
  out.y = y
  out.z = z
}

function copy(src: IVec3, out: IVec3) {
  out.x = src.x
  out.y = src.y
  out.z = src.z
}

/**
 * Transforms a unit axis, normalizes the result in place and returns its length before normalization
 */
function transformAxis(transform: Mat4, out: IVec3, x: number, y: number, z: number): number {
  initAxis(out, x, y, z)
  mat4TransformNormal3(transform, out, out)
  const length = Math.sqrt(out.x * out.x + out.y * out.y + out.z * out.z)
  if (length > 0) {
    out.x /= length
    out.y /= length
    out.z /= length
  } else {
    initAxis(out, x, y, z)
  }
  return length
}

function dot(x: number, y: number, z: number, v: IVec3) {
  return x * v.x + y * v.y + z * v.z
}

function clamp(value: number, extent: number) {
  return value < -extent ? -extent : value > extent ? extent : value
}

function sign(value: number) {
  return value < 0 ? -1 : 1
}
