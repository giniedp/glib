import { BoundingBox } from './BoundingBox'
import { BoundingSphere } from './BoundingSphere'
import { BoundingVolume } from './BoundingVolume'
import {
  boxContainsFrustum,
  frustumContainsBox,
  frustumContainsSphere,
  frustumIntersectsBox,
  frustumIntersectsPlane,
  frustumIntersectsPoint,
  frustumIntersectsSphere,
  IntersectionType,
  planePlanePlaneIntersection,
  sphereContainsFrustum,
} from './Collision'
import { Mat4 } from './Mat4'
import { Plane } from './Plane'
import { Ray } from './Ray'
import { IVec3, IVec4 } from './Types'
import { Vec3 } from './Vec3'
import { Vec4 } from './Vec4'

const LEFT = 0
const RIGHT = 1
const BOTTOM = 2
const TOP = 3
const FAR = 4
const NEAR = 5

/**
 * Enumeration of bounding frustum planes
 *
 * @public
 */
export enum BoundingFrustumPlane {
  Left = LEFT,
  Right = RIGHT,
  Bottom = BOTTOM,
  Top = TOP,
  Far = FAR,
  Near = NEAR,
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
   * Gets a vector describing the near plane
   */
  public get near(): Readonly<IVec4> {
    return this.planes[NEAR]
  }
  /**
   * Gets a vector describing the far plane
   */
  public get far(): Readonly<IVec4> {
    return this.planes[FAR]
  }
  /**
   * Gets a vector describing the left plane
   */
  public get left(): Readonly<IVec4> {
    return this.planes[LEFT]
  }
  /**
   * Gets a vector describing the right plane
   */
  public get right(): Readonly<IVec4> {
    return this.planes[RIGHT]
  }
  /**
   * Gets a vector describing the top plane
   */
  public get top(): Readonly<IVec4> {
    return this.planes[TOP]
  }
  /**
   * Gets a vector describing the bottom plane
   */
  public get bottom(): Readonly<IVec4> {
    return this.planes[BOTTOM]
  }

  /**
   * 6 planes of the bounding frustum
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

  /**
   * Gets a copy of the near plane
   */
  public getNearPlane(): Plane
  /**
   * Gets a copy of the near plane
   */
  public getNearPlane<T>(out: IVec4): T & IVec4
  public getNearPlane(out?: IVec4): IVec4 {
    return Vec4.clone(this.planes[NEAR], out || new Plane())
  }
  /**
   * Gets a copy of the far plane
   */
  public getFarPlane(): Plane
  /**
   * Gets a copy of the far plane
   */
  public getFarPlane<T>(out: IVec4): T & IVec4
  public getFarPlane(out?: IVec4): IVec4 {
    return Vec4.clone(this.planes[FAR], out || new Plane())
  }
  /**
   * Gets a copy of the left plane
   */
  public getLeftPlane(): Plane
  /**
   * Gets a copy of the left plane
   */
  public getLeftPlane<T>(out: IVec4): T & IVec4
  public getLeftPlane(out?: IVec4): IVec4 {
    return Vec4.clone(this.planes[LEFT], out || new Plane())
  }
  /**
   * Gets a copy of the right plane
   */
  public getRightPlane(): Plane
  /**
   * Gets a copy of the right plane
   */
  public getRightPlane<T>(out: IVec4): T & IVec4
  public getRightPlane(out?: IVec4): IVec4 {
    return Vec4.clone(this.planes[RIGHT], out || new Plane())
  }
  /**
   * Gets a copy of the top plane
   */
  public getTopPlane(): Plane
  /**
   * Gets a copy of the top plane
   */
  public getTopPlane<T>(out: IVec4): T & IVec4
  public getTopPlane(out?: IVec4): IVec4 {
    return Vec4.clone(this.planes[TOP], out || new Plane())
  }
  /**
   * Gets a copy of the bottom plane
   */
  public getBottomPlane(): Plane
  /**
   * Gets a copy of the bottom plane
   */
  public getBottomPlane<T>(out: IVec4): T & IVec4
  public getBottomPlane(out?: IVec4): IVec4 {
    return Vec4.clone(this.planes[BOTTOM], out || new Plane())
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
    const m = this.matrix.m
    let plane: IVec4

    plane = this.planes[LEFT]
    plane.x = - m[3] - m[0]
    plane.y = - m[7] - m[4]
    plane.z = - m[11] - m[8]
    plane.w = - m[15] - m[12]

    plane = this.planes[RIGHT]
    plane.x = - m[3] + m[0]
    plane.y = - m[7] + m[4]
    plane.z = - m[11] + m[8]
    plane.w = - m[15] + m[12]

    plane = this.planes[BOTTOM]
    plane.x = - m[3] - m[1]
    plane.y = - m[7] - m[5]
    plane.z = - m[11] - m[9]
    plane.w = - m[15] - m[13]

    plane = this.planes[TOP]
    plane.x = - m[3] + m[1]
    plane.y = - m[7] + m[5]
    plane.z = - m[11] + m[9]
    plane.w = - m[15] + m[13]

    plane = this.planes[FAR]
    plane.x = - m[3] - m[2]
    plane.y = - m[7] - m[6]
    plane.z = - m[11] - m[10]
    plane.w = - m[15] - m[14]

    plane = this.planes[NEAR]
    plane.x = - m[3] + m[2]
    plane.y = - m[7] + m[6]
    plane.z = - m[11] + m[10]
    plane.w = - m[15] + m[14]

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
    planePlanePlaneIntersection(this.near, this.top, this.left, this.corners[0])
    planePlanePlaneIntersection(this.near, this.top, this.right, this.corners[1])
    planePlanePlaneIntersection(this.near, this.bottom, this.left, this.corners[2])
    planePlanePlaneIntersection(this.near, this.bottom, this.right, this.corners[3])

    planePlanePlaneIntersection(this.far, this.top, this.left, this.corners[4])
    planePlanePlaneIntersection(this.far, this.top, this.right, this.corners[5])
    planePlanePlaneIntersection(this.far, this.bottom, this.left, this.corners[6])
    planePlanePlaneIntersection(this.far, this.bottom, this.right, this.corners[7])
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
    throw new Error('not implemented')
  }
  /**
   * Checks for intersaction with a point
   */
  public intersectsPoint(point: IVec3): boolean {
    return frustumIntersectsPoint(this, point)
  }
  /**
   * Checks for intersaction with a plane
   */
  public intersectsPlane(plane: IVec4): boolean {
    return frustumIntersectsPlane(this, plane)
  }
  /**
   * Checks for intersaction with a bounding box
   */
  public intersectsBox(box: BoundingBox): boolean {
    return frustumIntersectsBox(this, box.min, box.max)
  }
  /**
   * Checks for intersaction with a sphere
   */
  public intersectsSphere(sphere: BoundingSphere): boolean {
    return frustumIntersectsSphere(this, sphere.center, sphere.radius)
  }
  /**
   * Checks for intersaction with another frustum
   */
  public intersectsFrustum(other: BoundingFrustum): boolean {
    throw new Error('not implemented')
  }

  /**
   * Checks whether this frustum contains the given volume
   */
  public containsBox(box: BoundingBox): boolean {
    return frustumContainsBox(this, box.min, box.max) === IntersectionType.Contains
  }
  /**
   * Checks whether this frustum contains the given volume
   */
  public containsSphere(sphere: BoundingSphere): boolean {
    return frustumContainsSphere(this, sphere.center, sphere.radius) === IntersectionType.Contains
  }

  public containsFrustum(frustum: BoundingFrustum): boolean {
    return this.containmentOfFrustum(frustum) === IntersectionType.Contains
  }

  /**
   * Checks for intersection type with given volume
   */
  public containmentOfBox(box: BoundingBox): IntersectionType {
    return frustumContainsBox(this, box.min, box.max)
  }
  /**
   * Checks for intersection type with given volume
   */
  public containmentOfSphere(sphere: BoundingSphere): IntersectionType {
    return frustumContainsSphere(this, sphere.center, sphere.radius)
  }
  /**
   * Checks for intersection type with given volume
   */
  public containmentOfFrustum(frustum: BoundingFrustum): number {
    let count = 0
    for (let i = 0; i < frustum.planes.length; i++) {

      if (this.intersectsPoint(frustum.corners[i])) {
        count++
      }
    }
    if (count === 0) {
      return 0
    }
    if (count === 6) {
      return 2
    }
    return 1
  }

  /**
   * Checks whether the given box contains this volume
   */
  public containedByBox(box: BoundingBox): boolean {
    return boxContainsFrustum(box.min, box.max, this) === IntersectionType.Contains
  }

  /**
   * Checks whether the given sphere contains this volume
   */
  public containedBySphere(sphere: BoundingSphere): boolean {
    return sphereContainsFrustum(sphere.center, sphere.radius, this) === IntersectionType.Contains
  }

  /**
   * Checks whether the given frustum contains this volume
   */
  public containedByFrustum(frustum: BoundingFrustum): boolean {
    return frustum.containmentOfFrustum(this) === IntersectionType.Contains
  }

  /**
   * Checks for collision with another box and returns the intersection type
   */
  public containmentByBox(box: BoundingBox): IntersectionType {
    return boxContainsFrustum(box.min, box.max, this)
  }

  /**
   * Checks for collision with another sphere and returns the intersection type
   */
  public containmentBySphere(sphere: BoundingSphere): IntersectionType {
    return sphereContainsFrustum(sphere.center, sphere.radius, this)
  }

  /**
   * Checks for collision with another frustum and returns the intersection type
   */
  public containmentByFrustum(frustum: BoundingFrustum): IntersectionType {
    return frustum.containmentOfFrustum(this)
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
