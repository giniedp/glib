import { BoundingBox } from './BoundingBox'
import { BoundingCapsule } from './BoundingCapsule'
import { BoundingSphere } from './BoundingSphere'
import type { BoundingVolume } from './BoundingVolume'
import { Intersection, IntersectionType, Intersects, planePlanePlaneIntersection } from './Collision'
import { Mat4 } from './Mat4'
import { Ray } from './Ray'
import type { IVec3, IVec4 } from './Types'
import { Vec3 } from './Vec3'
import { Vec4 } from './Vec4'

const X_NEG: BoundingFrustumPlane = 0
const X_POS: BoundingFrustumPlane = 1
const Y_NEG: BoundingFrustumPlane = 2
const Y_POS: BoundingFrustumPlane = 3
const Z_NEG: BoundingFrustumPlane = 4
const Z_POS: BoundingFrustumPlane = 5

export type BoundingFrustumPlane = number
/**
 * Enumeration of bounding frustum planes
 *
 * @public
 */
export const BoundingFrustumPlane = {
  X_NEG,
  X_POS,
  Y_NEG,
  Y_POS,
  Z_NEG,
  Z_POS,
}

/**
 * Describes a frustum volume
 *
 * @public
 */
export class BoundingFrustum implements BoundingVolume {
  /**
   * Gets and sets the frustum matrix
   *
   * @remarks
   * On `set` the values of the given matrix are copied to the internal matrix
   * and `update` is called.
   */
  public get matrix() {
    return this.$matrix
  }
  public set matrix(mat: Mat4) {
    this.update(mat)
  }

  /**
   * Gets a vector describing the near plane (in Y-UP coordinate system)
   */
  public get planePosZ(): Readonly<IVec4> {
    return this.planes[Z_POS]
  }
  /**
   * Gets a vector describing the far plane (in Y-UP coordinate system)
   */
  public get planeNegZ(): Readonly<IVec4> {
    return this.planes[Z_NEG]
  }
  /**
   * Gets a vector describing the left plane (in Y-UP coordinate system)
   */
  public get planeNegX(): Readonly<IVec4> {
    return this.planes[X_NEG]
  }
  /**
   * Gets a vector describing the right plane (in Y-UP coordinate system)
   */
  public get planePosX(): Readonly<IVec4> {
    return this.planes[X_POS]
  }
  /**
   * Gets a vector describing the top plane (in Y-UP coordinate system)
   */
  public get planePosY(): Readonly<IVec4> {
    return this.planes[Y_POS]
  }
  /**
   * Gets a vector describing the bottom plane (in Y-UP coordinate system)
   */
  public get planeNegY(): Readonly<IVec4> {
    return this.planes[Y_NEG]
  }

  /**
   * 6 planes of the bounding frustum. Normals point OUTWARD
   *
   * A point P is inside the frustum if `(dot(plane, P) + plane.w) <= 0` for all six planes.
   */
  public readonly planes: IVec4[]

  /**
   * 8 corners of the bounding frustum
   */
  public readonly corners: IVec3[]

  private $matrix: Mat4 = Mat4.createIdentity()

  /**
   * Constructs a new instance of {@link BoundingFrustum}
   *
   * @param matrix - The matrix to initialize with.
   */
  constructor(matrix?: Mat4) {
    this.planes = []
    for (let i = 0; i < 6; i++) {
      this.planes[i] = { x: 0, y: 0, z: 0, w: 0 }
    }
    this.corners = []
    for (let i = 0; i < 8; i++) {
      this.corners[i] = { x: 0, y: 0, z: 0 }
    }
    if (matrix) {
      this.$matrix.initFrom(matrix)
    }
    this.matrix = matrix || Mat4.createIdentity()
  }

  public updateFromViewProjection(view: Mat4, projection: Mat4) {
    Mat4.premultiply(view, projection, this.matrix)
    this.update()
  }

  /**
   * Calculates the frustum planes and corners
   *
   * @remarks
   * This is called automatically when a new {@link BoundingFrustum.matrix} is set.
   * However if the matrix has been modified afterwards this method must be called
   * manually.
   */
  public update(transform?: Mat4) {
    if (transform) {
      this.$matrix.initFrom(transform)
    }
    this.updatePlanes()
    this.updateCorners()
  }

  private updatePlanes() {
    // index layout
    // 0 4 8  12
    // 1 5 9  13
    // 2 6 10 14
    // 3 7 11 15
    const m = this.matrix.elements
    let plane: IVec4

    plane = this.planes[X_NEG]
    plane.x = -m[3] - m[0]
    plane.y = -m[7] - m[4]
    plane.z = -m[11] - m[8]
    plane.w = -m[15] - m[12]

    plane = this.planes[X_POS]
    plane.x = -m[3] + m[0]
    plane.y = -m[7] + m[4]
    plane.z = -m[11] + m[8]
    plane.w = -m[15] + m[12]

    plane = this.planes[Y_NEG]
    plane.x = -m[3] - m[1]
    plane.y = -m[7] - m[5]
    plane.z = -m[11] - m[9]
    plane.w = -m[15] - m[13]

    plane = this.planes[Y_POS]
    plane.x = -m[3] + m[1]
    plane.y = -m[7] + m[5]
    plane.z = -m[11] + m[9]
    plane.w = -m[15] + m[13]

    plane = this.planes[Z_NEG]
    plane.x = -m[3] - m[2]
    plane.y = -m[7] - m[6]
    plane.z = -m[11] - m[10]
    plane.w = -m[15] - m[14]

    plane = this.planes[Z_POS]
    plane.x = -m[3] + m[2]
    plane.y = -m[7] + m[6]
    plane.z = -m[11] + m[10]
    plane.w = -m[15] + m[14]

    for (let i = 0; i < 6; i++) {
      plane = this.planes[i]
      const l = 1.0 / Vec3.len(plane)
      plane.x = plane.x * l
      plane.y = plane.y * l
      plane.z = plane.z * l
      plane.w = plane.w * l
    }
  }

  private updateCorners() {
    planePlanePlaneIntersection(this.planePosZ, this.planePosY, this.planeNegX, this.corners[0])
    planePlanePlaneIntersection(this.planePosZ, this.planePosY, this.planePosX, this.corners[1])
    planePlanePlaneIntersection(this.planePosZ, this.planeNegY, this.planeNegX, this.corners[2])
    planePlanePlaneIntersection(this.planePosZ, this.planeNegY, this.planePosX, this.corners[3])

    planePlanePlaneIntersection(this.planeNegZ, this.planePosY, this.planeNegX, this.corners[4])
    planePlanePlaneIntersection(this.planeNegZ, this.planePosY, this.planePosX, this.corners[5])
    planePlanePlaneIntersection(this.planeNegZ, this.planeNegY, this.planeNegX, this.corners[6])
    planePlanePlaneIntersection(this.planeNegZ, this.planeNegY, this.planePosX, this.corners[7])
  }

  /**
   * Creates a clone of this frustum
   */
  public clone(): BoundingFrustum {
    return new BoundingFrustum(this.matrix)
  }

  /**
   * Checks for intersaction with a ray
   */
  public intersectsRay(ray: Ray): boolean {
    return Intersects.frustumRay(this, ray)
  }
  /**
   * Checks for intersaction with a point
   */
  public intersectsPoint(point: IVec3): boolean {
    return Intersects.frustumPoint(this, point)
  }
  /**
   * Checks for intersaction with a plane
   */
  public intersectsPlane(plane: IVec4): boolean {
    return Intersects.frustumPlane(this, plane)
  }
  /**
   * Checks for intersaction with a sphere
   */
  public intersectsSphere(sphere: BoundingSphere): boolean {
    return Intersects.frustumSphere(this, sphere)
  }
  /**
   * Checks for intersaction with a bounding box
   */
  public intersectsBox(box: BoundingBox): boolean {
    return Intersects.frustumBox(this, box)
  }
  /**
   * Checks for intersaction with a capsule
   */
  public intersectsCapsule(capsule: BoundingCapsule): boolean {
    return Intersects.frustumCapsule(this, capsule)
  }
  /**
   * Checks for intersaction with another frustum
   */
  public intersectsFrustum(other: BoundingFrustum): boolean {
    return Intersects.frustumFrustum(this, other)
  }

  /**
   * Checks whether this frustum contains the given volume
   */
  public containsBox(box: BoundingBox): boolean {
    return Intersection.frustumBox(this, box) === IntersectionType.Contains
  }
  /**
   * Checks whether this frustum contains the given volume
   */
  public containsSphere(sphere: BoundingSphere): boolean {
    return Intersection.frustumSphere(this, sphere) === IntersectionType.Contains
  }
  /**
   * Checks whether this frustum contains the given volume
   */
  public containsCapsule(capsule: BoundingCapsule): boolean {
    return Intersection.frustumCapsule(this, capsule) === IntersectionType.Contains
  }
  /**
   * Checks whether this frustum contains the given volume
   */
  public containsFrustum(frustum: BoundingFrustum): boolean {
    return Intersection.frustumFrustum(this, frustum) === IntersectionType.Contains
  }

  /**
   * Checks for intersection type with given volume
   */
  public intersectionBox(box: BoundingBox): IntersectionType {
    return Intersection.frustumBox(this, box)
  }
  /**
   * Checks for intersection type with given volume
   */
  public intersectionSphere(sphere: BoundingSphere): IntersectionType {
    return Intersection.frustumSphere(this, sphere)
  }
  /**
   * Checks for intersection type with given volume
   */
  public intersectionCapsule(capsule: BoundingCapsule): IntersectionType {
    return Intersection.frustumCapsule(this, capsule)
  }
  /**
   * Checks for intersection type with given volume
   */
  public intersectionFrustum(frustum: BoundingFrustum): IntersectionType {
    return Intersection.frustumFrustum(this, frustum)
  }

  public format(fractionDigits?: number) {
    let result = 'matrix:\n' + this.matrix.format(fractionDigits) + '\n'
    result += 'planes:\n'
    for (const plane of this.planes) {
      result += Vec4.format(plane, fractionDigits) + '\n'
    }
    result += 'corners:\n'
    for (const corner of this.corners) {
      result += Vec3.format(corner, fractionDigits) + '\n'
    }
    return result
  }
}
