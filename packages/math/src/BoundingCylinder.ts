import { BoundingBox } from './BoundingBox'
import type { BoundingOrientedBox } from './BoundingOrientedBox'
import { BoundingSphere } from './BoundingSphere'
import { gjkIntersects } from './Gjk'
import { Mat4, mat4ApplyToVec3, mat4TransformNormal3 } from './Mat4'
import { IRay } from './Ray'
import type { IVec3 } from './Types'
import { RayInterval } from './utils/rayInterval'
import { vec3 } from './Vec3'

const tmp = vec3()
const tmpAxis = vec3()
const slabs = new RayInterval()

/**
 * Defines a cylinder volume with arbitrary orientation
 *
 * @public
 */
export class BoundingCylinder {
  /**
   * The center point, half way between the two caps
   */
  public center: IVec3 = vec3()

  /**
   * The direction from the center to the top cap. Unit length
   */
  public axis: IVec3 = vec3(0, 1, 0)

  /**
   * The cylinder radius
   */
  public radius: number = 0

  /**
   * Half the cylinder height, the distance from the center to each cap
   */
  public halfHeight: number = 0

  /**
   * Creates a cylinder with given center, radius and height, aligned to the y axis
   */
  public static create(center?: IVec3, radius?: number, height?: number): BoundingCylinder {
    return new BoundingCylinder().init(center, radius, height)
  }

  /**
   * Initializes with given center, radius and height, aligned to the y axis
   */
  public init(center?: IVec3, radius?: number, height?: number): this {
    this.center.x = center?.x ?? 0
    this.center.y = center?.y ?? 0
    this.center.z = center?.z ?? 0
    this.axis.x = 0
    this.axis.y = 1
    this.axis.z = 0
    this.radius = radius ?? 0
    this.halfHeight = (height ?? 0) * 0.5
    return this
  }

  /**
   * Creates a new instance by copying given instance
   */
  public static createFrom(other: BoundingCylinder): BoundingCylinder {
    return new BoundingCylinder().initFrom(other)
  }

  /**
   * Initializes this instance by copying given instance
   */
  public initFrom(other: BoundingCylinder): this {
    this.center.x = other.center.x
    this.center.y = other.center.y
    this.center.z = other.center.z
    this.axis.x = other.axis.x
    this.axis.y = other.axis.y
    this.axis.z = other.axis.z
    this.radius = other.radius
    this.halfHeight = other.halfHeight
    return this
  }

  /**
   * Initializes from a y aligned cylinder in local space that is transformed by a matrix
   *
   * @remarks
   * The height is scaled along the transformed y axis. The radius is scaled by the larger
   * of the x and z axis scales, a non uniform radial scale does not produce an elliptic cylinder.
   *
   * @param center - the center in local space
   * @param radius - the radius in local space
   * @param height - the height in local space
   * @param transform - the transform from local to target space
   */
  public initFromTransform(center: IVec3, radius: number, height: number, transform: Mat4): this {
    mat4ApplyToVec3(transform, center, this.center)

    const axis = this.axis
    axis.x = 0
    axis.y = 1
    axis.z = 0
    mat4TransformNormal3(transform, axis, axis)
    const scaleY = Math.sqrt(axis.x * axis.x + axis.y * axis.y + axis.z * axis.z)
    if (scaleY > 0) {
      axis.x /= scaleY
      axis.y /= scaleY
      axis.z /= scaleY
    } else {
      axis.y = 1
    }

    tmpAxis.x = 1
    tmpAxis.y = 0
    tmpAxis.z = 0
    const scaleX = length(mat4TransformNormal3(transform, tmpAxis, tmpAxis))
    tmpAxis.x = 0
    tmpAxis.y = 0
    tmpAxis.z = 1
    const scaleZ = length(mat4TransformNormal3(transform, tmpAxis, tmpAxis))

    this.radius = radius * Math.max(scaleX, scaleZ)
    this.halfHeight = height * 0.5 * scaleY
    return this
  }

  /**
   * Calculates the axis aligned box that encloses this cylinder
   */
  public getBoundingBox(out?: BoundingBox): BoundingBox {
    out ||= new BoundingBox()
    const { center: c, axis: a, radius: r, halfHeight: h } = this
    const ex = h * Math.abs(a.x) + r * Math.sqrt(Math.max(0, 1 - a.x * a.x))
    const ey = h * Math.abs(a.y) + r * Math.sqrt(Math.max(0, 1 - a.y * a.y))
    const ez = h * Math.abs(a.z) + r * Math.sqrt(Math.max(0, 1 - a.z * a.z))
    out.min.x = c.x - ex
    out.min.y = c.y - ey
    out.min.z = c.z - ez
    out.max.x = c.x + ex
    out.max.y = c.y + ey
    out.max.z = c.z + ez
    return out
  }

  /**
   * Calculates the point on or inside the cylinder that is closest to given point
   */
  public closestPoint(point: IVec3, out?: IVec3): IVec3 {
    out ||= vec3()
    const { center: c, axis: a, radius: r, halfHeight: h } = this
    const dx = point.x - c.x
    const dy = point.y - c.y
    const dz = point.z - c.z
    const t = dx * a.x + dy * a.y + dz * a.z
    // radial offset from the axis
    let rx = dx - a.x * t
    let ry = dy - a.y * t
    let rz = dz - a.z * t
    const rl = Math.sqrt(rx * rx + ry * ry + rz * rz)
    if (rl > r) {
      const s = r / rl
      rx *= s
      ry *= s
      rz *= s
    }
    const tc = t < -h ? -h : t > h ? h : t
    out.x = c.x + a.x * tc + rx
    out.y = c.y + a.y * tc + ry
    out.z = c.z + a.z * tc + rz
    return out
  }

  /**
   * Calculates the point of the cylinder that is furthest along given direction
   *
   * @remarks
   * This is the support function used by {@link gjkIntersects}
   */
  public support(direction: IVec3, out?: IVec3): IVec3 {
    out ||= vec3()
    const { center: c, axis: a, radius: r, halfHeight: h } = this
    const t = direction.x * a.x + direction.y * a.y + direction.z * a.z
    const cap = t < 0 ? -h : h
    // direction projected onto the cap plane
    let rx = direction.x - a.x * t
    let ry = direction.y - a.y * t
    let rz = direction.z - a.z * t
    const rl = Math.sqrt(rx * rx + ry * ry + rz * rz)
    if (rl > 1e-12) {
      const s = r / rl
      rx *= s
      ry *= s
      rz *= s
    } else {
      rx = ry = rz = 0
    }
    out.x = c.x + a.x * cap + rx
    out.y = c.y + a.y * cap + ry
    out.z = c.z + a.z * cap + rz
    return out
  }

  /**
   * Checks whether given point is inside the cylinder
   */
  public intersectsPoint(point: IVec3): boolean {
    const { center: c, axis: a, radius: r, halfHeight: h } = this
    const dx = point.x - c.x
    const dy = point.y - c.y
    const dz = point.z - c.z
    const t = dx * a.x + dy * a.y + dz * a.z
    if (Math.abs(t) > h) {
      return false
    }
    const rx = dx - a.x * t
    const ry = dy - a.y * t
    const rz = dz - a.z * t
    return rx * rx + ry * ry + rz * rz <= r * r
  }

  /**
   * Checks whether given sphere intersects the cylinder
   */
  public intersectsSphere(sphere: BoundingSphere): boolean {
    const p = this.closestPoint(sphere.center, tmp)
    const dx = p.x - sphere.center.x
    const dy = p.y - sphere.center.y
    const dz = p.z - sphere.center.z
    return dx * dx + dy * dy + dz * dz <= sphere.radius * sphere.radius
  }

  /**
   * Checks whether given oriented box intersects this cylinder
   */
  public intersectsOrientedBox(box: BoundingOrientedBox): boolean {
    return gjkIntersects(this, box)
  }

  /**
   * Checks whether given cylinder intersects this cylinder
   */
  public intersectsCylinder(cylinder: BoundingCylinder): boolean {
    return gjkIntersects(this, cylinder)
  }

  /**
   * Checks whether given ray intersects the cylinder
   */
  public intersectsRay(ray: IRay): boolean {
    return !Number.isNaN(this.intersectsRayAt(ray))
  }

  /**
   * Calculates the distance along the ray where it enters the cylinder
   *
   * @returns the distance in units of the ray direction, `0` if the ray starts inside the cylinder or `NaN` if the ray misses
   */
  public intersectsRayAt(ray: IRay): number {
    const { center: c, axis: a, radius: r, halfHeight: h } = this
    const { position: p, direction: d } = ray
    const ox = p.x - c.x
    const oy = p.y - c.y
    const oz = p.z - c.z
    const oa = ox * a.x + oy * a.y + oz * a.z
    const da = d.x * a.x + d.y * a.y + d.z * a.z

    const interval = slabs.reset()
    // between the two caps
    if (!interval.clip(oa, da, -h, h)) {
      return Number.NaN
    }

    // inside the infinite cylinder: |radial(origin) + t * radial(direction)|^2 <= r^2
    const orx = ox - a.x * oa
    const ory = oy - a.y * oa
    const orz = oz - a.z * oa
    const drx = d.x - a.x * da
    const dry = d.y - a.y * da
    const drz = d.z - a.z * da
    const qa = drx * drx + dry * dry + drz * drz
    const qb = orx * drx + ory * dry + orz * drz
    const qc = orx * orx + ory * ory + orz * orz - r * r
    if (qa < 1e-12) {
      // parallel to the axis
      if (qc > 0) {
        return Number.NaN
      }
    } else {
      const disc = qb * qb - qa * qc
      if (disc < 0) {
        return Number.NaN
      }
      const sq = Math.sqrt(disc)
      if (!interval.intersect((-qb - sq) / qa, (-qb + sq) / qa)) {
        return Number.NaN
      }
    }
    return interval.result()
  }
}

function length(v: IVec3) {
  return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z)
}
