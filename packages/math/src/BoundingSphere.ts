import { BoundingBox } from './BoundingBox'
import { BoundingFrustum } from './BoundingFrustum'
import { BoundingVolume } from './BoundingVolume'
import {
  boxContainsSphere,
  boxIntersectSphere,
  frustumContainsSphere,
  frustumIntersectsSphere,
  IntersectionType,
  rayIntersectsSphere,
  sphereContainsBox,
  sphereContainsFrustum,
  sphereContainsSphere,
  sphereIntersectsPlane,
  sphereIntersectsPoint,
  sphereIntersectsSphere,
} from './Collision'
import { Mat4 } from './Mat4'
import { Ray } from './Ray'
import { ArrayLike, IVec3, IVec4 } from './Types'
import { Vec3 } from './Vec3'

/**
 * Defines sphere volume.
 *
 * @public
 */
export class BoundingSphere implements BoundingVolume {
  /**
   * The sphere center
   */
  public readonly center: Vec3

  /**
   * The sphere radius
   */
  public radius: number

  /**
   * Constructs a new instance of {@link BoundingSphere}
   *
   * @param x - component of the center point
   * @param y - component of the center point
   * @param z - component of the center point
   * @param r - the radius
   */
  constructor(x?: number, y?: number, z?: number, r?: number) {
    this.center = Vec3.create(x, y, z)
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
  public init(x?: number, y?: number, z?: number, r?: number): this {
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
    return new BoundingSphere(other.center.x, other.center.y, other.center.z, other.radius)
  }

  /**
   * Initializes this instance by copying given instance
   *
   * @param other - the instance to copy from
   */
  public initFrom(other: BoundingSphere): this {
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
    return new BoundingSphere(center.x, center.y, center.z, radius)
  }

  /**
   * Initializes this instance by copying given parameters
   *
   * @param center - the sphere center pooint to copy
   * @param radius - the sphere radius
   */
  public initFromCenterRadius(center: IVec3, radius: number): this {
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
  public initFromBox(box: BoundingBox): this {
    this.radius = Vec3.distance(box.min, box.max) * 0.5
    Vec3.lerp(box.min, box.max, 0.5, this.center)
    return this
  }

  /**
   * Deserializes a new instance from a numbers array
   *
   * @param array - the numbers array containing a serialized sphere
   * @param offset - offset at which to start reading in array. Default is `0`
   */
  public static createFromArray(array: ArrayLike<number>, offset?: number): BoundingSphere {
    return new BoundingSphere().initFromArray(array, offset)
  }

  /**
   * Initializes this instance by deserializeng an instance from array
   *
   * @param array - the numbers array containing a serialized sphere
   * @param offset - offset at which to start reading in array. Default is `0`
   */
  public initFromArray(array: ArrayLike<number>, offset: number = 0): this {
    this.center.x = array[offset + 0]
    this.center.y = array[offset + 1]
    this.center.z = array[offset + 2]
    this.radius = array[offset + 3]
    return this
  }

  /**
   * Creates a new instance from a numbers array
   *
   * @param array - the numbers array forming a point list
   * @param offset - offset at which to start reading in array. Default is `0`
   * @param stride - step size for each iteration. Default is `3`
   */
  public static createFromPointsBuffer(array: ArrayLike<number>, offset?: number, stride?: number): BoundingSphere {
    return new BoundingSphere().initFromPointsBuffer(array, offset, stride)
  }

  /**
   * Initializes this instance from a numbers array
   *
   * @param array - the numbers array forming a point list
   * @param offset - offset at which to start reading in array. Default is `0`
   * @param stride - step size for each iteration. Default is `3`
   */
  public initFromPointsBuffer(array: ArrayLike<number>, offset: number = 0, stride: number = 3): this {
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
  public initFromPoints(P: ArrayLike<IVec3>): this {

    // bounding box extremes
    let xmax: number
    let ymax: number
    let zmax: number
    let xmin: number
    let ymin: number
    let zmin: number
    // index of  P[] at box extreme
    let Pxmax: number = 0
    let Pymax: number = 0
    let Pzmax: number = 0
    let Pxmin: number = 0
    let Pymin: number = 0
    let Pzmin: number = 0
    // find a large diameter to start with
    // first get the bounding box and P[] extreme points for it
    xmin = xmax = P[0].x
    ymin = ymax = P[0].y
    zmin = zmax = P[0].z


    for (let i = 1; i < P.length; i++) {
      let Pi = P[i]
      if (Pi.x < xmin) {
        xmin = Pi.x
        Pxmin = i
      } else if (Pi.x > xmax) {
        xmax = Pi.x
        Pxmax = i
      }
      if (Pi.y < ymin) {
        ymin = Pi.y
        Pymin = i
      } else if (Pi.y > ymax) {
        ymax = Pi.y
        Pymax = i
      }
      if (Pi.z < zmin) {
        zmin = Pi.z
        Pzmin = i
      } else if (Pi.z > zmax) {
        zmax = Pi.z
        Pzmax = i
      }
    }

    // select the largest extent as an initial diameter for the  ball
    let dPx = Vec3.subtract(P[Pxmax], P[Pxmin], {}) // diff of Px max and min
    let dPy = Vec3.subtract(P[Pymax], P[Pymin], {}) // diff of Py max and min
    let dPz = Vec3.subtract(P[Pzmax], P[Pzmin], {}) // diff of Pz max and min
    let dx2 = Vec3.lengthSquared(dPx) // Px diff squared
    let dy2 = Vec3.lengthSquared(dPy) // Py diff squared
    let dz2 = Vec3.lengthSquared(dPz) // Pz diff squared

    let d = dx2
    let dP = dPx
    let iMax = Pxmax
    let iMin = Pxmin

    if (dy2 > d) {
      d = dy2
      iMax = Pymax
      iMin = Pymin
    }
    if (dz2 > d) {
      d = dz2
      iMax = Pzmax
      iMin = Pzmin
    }

    // Center = midpoint of extremes
    let C = Vec3.addScaled(P[iMin], dP, 0.5, {})
    // radius squared
    let rad2 = Vec3.distanceSquared(P[iMax], C)
    let rad = Math.sqrt(rad2)

    // now check that all points P[i] are in the ball
    // and if not, expand the ball just enough to include them
    let dist
    let dist2
    for (let i = 0; i < P.length; i++) {
      Vec3.subtract(P[i], C, dP)
      dist2 = Vec3.lengthSquared(dP)
      if (dist2 <= rad2) {
        // P[i] is inside the ball already
        continue
      }
      // P[i] not in ball, so expand ball  to include it
      dist = Math.sqrt(dist2)
      // enlarge radius just enough
      rad = (rad + dist) / 2.0
      rad2 = rad * rad
      // shift Center toward P[i]
      Vec3.addScaled(C, dP, (dist - rad) / dist, C)
    }

    this.initFromCenterRadius(C, rad)
    return this
  }

  /**
   * Clones this instance into a new or an existing one
   *
   * @param sphere - the volume to clone
   * @param out - where the result is written to
   * @returns the given `out` parameter or a new instance
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
   * @returns the given `out` parameter or a new instance
   */
  public clone(out?: BoundingSphere): BoundingSphere {
    out = out || new BoundingSphere()
    Vec3.clone(this.center, out.center)
    out.radius = this.radius
    return out
  }

  /**
   * Transforms this sphere with given matrix
   *
   * @param sphere - the sphere to transform
   * @param m - the matrix to transform with
   * @param out - where the result is written to
   * @returns the given `out` parameter or a new instance
   */
  public static transform(sphere: BoundingSphere, m: Mat4, out?: BoundingSphere): BoundingSphere {
    out = out || new BoundingSphere()
    out.radius = sphere.radius * Math.sqrt(
      Math.max(
        m.m00 * m.m00 + m.m01 * m.m01 + m.m02 * m.m02,
        m.m10 * m.m10 + m.m11 * m.m11 + m.m12 * m.m12,
        m.m20 * m.m20 + m.m21 * m.m21 + m.m22 * m.m22,
      )
    )
    m.transformV3(sphere.center, out.center)
    return out
  }

  /**
   * Transforms this sphere with given matrix
   *
   * @param m - the matrix to transform with
   */
  public transform(m: Mat4): this {
    this.radius = this.radius * Math.sqrt(
      Math.max(
        m.m00 * m.m00 + m.m01 * m.m01 + m.m02 * m.m02,
        m.m10 * m.m10 + m.m11 * m.m11 + m.m12 * m.m12,
        m.m20 * m.m20 + m.m21 * m.m21 + m.m22 * m.m22,
      )
    )
    m.transformV3(this.center, this.center)
    return this
  }

  /**
   * Dumps the min and max points into an array
   */
  public toArray(): number[]
  /**
   * Dumps the min and max points into an array at given offset
   */
  public toArray<T extends ArrayLike<number>>(array: T, offset?: number): T
  public toArray(array: number[] = [], offset: number = 0): number[] {
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
  public mergePoint(point: IVec3): this {
    const distance = Vec3.distance(this.center, point)
    if (this.radius < distance) {
      this.radius = distance
    }
    return this
  }

  /**
   * Merges two spheres
   *
   * @param a - the sphere to merge
   * @param b - another sphere to merge
   * @param out - where the result should be written to
   * @returns the given `out` parameter or a new instance
   */
  public static mergeSphere(a: BoundingSphere, b: BoundingSphere, out?: BoundingSphere): BoundingSphere {
    out = out || new BoundingSphere()
    const vx = a.center.x - b.center.x
    const vy = a.center.y - b.center.y
    const vz = a.center.z - b.center.z
    const d = Math.sqrt(vx * vx + vy * vy + vz * vz)
    const r1 = a.radius
    const r2 = b.radius

    if (d <= r1 + r2) {
      if (d <= r1 - r2) {
        // a contains b
        out.initFrom(a)
        return out;
      }
      if (d <= r2 - r1) {
        // b contains a
        out.initFrom(b)
        return out;
      }
    }

    const rl = Math.max(r1 - d, r2);
    const rr = Math.max(r1 + d, r2);
    const s = ((rl - rr) / (2 * d))
    out.center.x = a.center.x + vx * s
    out.center.y = a.center.y + vy * s
    out.center.z = a.center.z + vz * s
    out.radius = (rl + rr) / 2
    return out
  }

  /**
   * Merges another sphere into this
   *
   * @param other - another sphere to merge
   */
  public mergeSphere(other: BoundingSphere): this {
    const vx = this.center.x - other.center.x
    const vy = this.center.y - other.center.y
    const vz = this.center.z - other.center.z
    const d = Math.sqrt(vx * vx + vy * vy + vz * vz)
    const r1 = this.radius
    const r2 = other.radius

    if (d <= r1 + r2) {
      if (d <= r1 - r2) {
        // this contains other
        return this;
      }
      if (d <= r2 - r1) {
        // other contains this
        this.initFrom(other)
        return this;
      }
    }

    const rl = Math.max(r1 - d, r2);
    const rr = Math.max(r1 + d, r2);
    const s = ((rl - rr) / (2 * d))
    this.center.x += vx * s
    this.center.y += vy * s
    this.center.z += vz * s
    this.radius = (rl + rr) / 2
    return this;
  }

  /**
   * Checks whether the given point intersects this volume
   */
  public intersectsPoint(point: IVec3): boolean {
    return sphereIntersectsPoint(this.center, this.radius, point)
  }
  /**
   * Checks whether the given ray intersects this volume
   */
  public intersectsRay(ray: Ray): boolean {
    return rayIntersectsSphere(ray.position, ray.direction, this.center, this.radius)
  }
  /**
   * Checks whether the given plane intersects this volume
   */
  public intersectsPlane(plane: IVec4): boolean {
    return sphereIntersectsPlane(this.center, this.radius, plane)
  }
  /**
   * Checks whether the given box intersects this volume
   */
  public intersectsBox(box: BoundingBox): boolean {
    return boxIntersectSphere(box.min, box.max, this.center, this.radius)
  }
  /**
   * Checks whether the given sphere intersects this volume
   */
  public intersectsSphere(sphere: BoundingSphere): boolean {
    return sphereIntersectsSphere(this.center, this.radius, sphere.center, sphere.radius)
  }
  /**
   * Checks whether the frustum intersects this volume
   */
  public intersectsFrustum(frustum: BoundingFrustum): boolean {
    return frustumIntersectsSphere(frustum, this.center, this.radius)
  }

  /**
   * Checks whether the given box is contained by this volume
   */
  public containsBox(box: BoundingBox): boolean {
    return sphereContainsBox(this.center, this.radius, box.min, box.max) === 2
  }
  /**
   * Checks whether the given sphere is contained by this volume
   */
  public containsSphere(sphere: BoundingSphere): boolean {
    return sphereContainsSphere(this.center, this.radius, sphere.center, sphere.radius) === 2
  }
  /**
   * Checks whether the given frustum is contained by this volume
   */
  public containsFrustum(frustum: BoundingFrustum): boolean {
    return sphereContainsFrustum(this.center, this.radius, frustum) === 2
  }

  /**
   * Checks for collision with another box and returns the containment type
   */
  public containmentOfBox(box: BoundingBox): IntersectionType {
    return sphereContainsBox(this.center, this.radius, box.min, box.max)
  }
  /**
   * Checks for collision with another sphere and returns the containment type
   */
  public containmentOfSphere(sphere: BoundingSphere): IntersectionType {
    return sphereContainsSphere(this.center, this.radius, sphere.center, sphere.radius)
  }
  /**
   * Checks for collision with another frustum and returns the containment type
   */
  public containmentOfFrustum(frustum: BoundingFrustum): IntersectionType {
    return sphereContainsFrustum(this.center, this.radius, frustum)
  }

  /**
   * Checks whether the given box contains this volume
   */
  public containedByBox(box: BoundingBox): boolean {
    return boxContainsSphere(box.min, box.max, this.center, this.radius) === IntersectionType.Contains
  }

  /**
   * Checks whether the given sphere contains this volume
   */
  public containedBySphere(sphere: BoundingSphere): boolean {
    return sphereContainsSphere(sphere.center, sphere.radius, this.center, this.radius) === IntersectionType.Contains
  }

  /**
   * Checks whether the given frustum contains this volume
   */
  public containedByFrustum(frustum: BoundingFrustum): boolean {
    return frustumContainsSphere(frustum, this.center, this.radius) === IntersectionType.Contains
  }

  /**
   * Checks for collision with another box and returns the intersection type
   */
  public containmentByBox(box: BoundingBox): IntersectionType {
    return boxContainsSphere(box.min, box.max, this.center, this.radius)
  }

  /**
   * Checks for collision with another sphere and returns the intersection type
   */
  public containmentBySphere(sphere: BoundingSphere): IntersectionType {
    return sphereContainsSphere(sphere.center, sphere.radius, this.center, this.radius)
  }

  /**
   * Checks for collision with another frustum and returns the intersection type
   */
  public containmentByFrustum(frustum: BoundingFrustum): IntersectionType {
    return frustumContainsSphere(frustum, this.center, this.radius)
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
