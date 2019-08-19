import { BoundingBox } from './BoundingBox'
import { BoundingSphere } from './BoundingSphere'
import {
  ContainmentType,
  frustumContainsBox,
  frustumContainsSphere,
  frustumIntersectsBox,
  frustumIntersectsPlane,
  frustumIntersectsPoint,
  frustumIntersectsSphere,
  planePlaneIntersection,
  rayIntersectsPlaneAt,
} from './Collision'
import { Mat4 } from './Mat4'
import { Plane } from './Plane'
import { Ray } from './Ray'
import { IVec3, IVec4 } from './Types'
import { Vec3 } from './Vec3'
import { Vec4 } from './Vec4'

const NEAR = 0
const FAR = 1
const LEFT = 2
const RIGHT = 3
const TOP = 4
const BOTTOM = 5

/**
 * Enumeration of bounding frustum planes
 *
 * @public
 */
export enum BoundingFrustumPlane {
  Near = NEAR,
  Far = FAR,
  Left = LEFT,
  Right = RIGHT,
  Top = TOP,
  Bottom = BOTTOM,
}

/**
 * Describes a frustum volume
 *
 * @public
 */
export class BoundingFrustum {

  /**
   * Gets and sets the frustum matrix
   */
  public get matrix() {
    return this.$matrix
  }
  public set matrix(mat: Mat4) {
    this.$matrix = mat
    this.update()
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

  public readonly planes: IVec4[]
  public readonly corners: IVec3[]
  private $matrix: Mat4

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
  public update() {
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
    let plane = this.planes[LEFT]
    plane.x = m[12] - m[0]
    plane.y = m[13] - m[1]
    plane.z = m[14] - m[2]
    plane.w = m[15] - m[3]

    plane = this.planes[RIGHT]
    plane.x = m[12] + m[0]
    plane.y = m[13] + m[1]
    plane.z = m[14] + m[2]
    plane.w = m[15] + m[3]

    plane = this.planes[TOP]
    plane.x = m[12] + m[4]
    plane.y = m[13] + m[5]
    plane.z = m[14] + m[6]
    plane.w = m[15] + m[7]

    plane = this.planes[BOTTOM]
    plane.x = m[12] - m[4]
    plane.y = m[13] - m[5]
    plane.z = m[14] - m[6]
    plane.w = m[15] - m[7]

    plane = this.planes[NEAR]
    plane.x = m[12] + m[8]
    plane.y = m[13] + m[9]
    plane.z = m[14] + m[10]
    plane.w = m[15] + m[11]

    plane = this.planes[FAR]
    plane.x = m[12] - m[8]
    plane.y = m[13] - m[9]
    plane.z = m[14] - m[10]
    plane.w = m[15] - m[11]

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
    const ray = new Ray()
    let distance: number

    planePlaneIntersection(this.planes[NEAR], this.planes[LEFT], ray.position, ray.direction)
    distance = rayIntersectsPlaneAt(ray.position, ray.direction, this.planes[TOP])
    ray.positionAt(distance, this.corners[0])

    Vec3.negate(ray.direction, ray.direction)
    distance = rayIntersectsPlaneAt(ray.position, ray.direction, this.planes[BOTTOM])
    ray.positionAt(distance, this.corners[3])

    planePlaneIntersection(this.planes[RIGHT], this.planes[NEAR], ray.position, ray.direction)
    distance = rayIntersectsPlaneAt(ray.position, ray.direction, this.planes[TOP])
    ray.positionAt(distance, this.corners[1])

    Vec3.negate(ray.direction, ray.direction)
    distance = rayIntersectsPlaneAt(ray.position, ray.direction, this.planes[BOTTOM])
    ray.positionAt(distance, this.corners[2])

    planePlaneIntersection(this.planes[LEFT], this.planes[FAR], ray.position, ray.direction)
    distance = rayIntersectsPlaneAt(ray.position, ray.direction, this.planes[TOP])
    ray.positionAt(distance, this.corners[4])

    Vec3.negate(ray.direction, ray.direction)
    distance = rayIntersectsPlaneAt(ray.position, ray.direction, this.planes[BOTTOM])
    ray.positionAt(distance, this.corners[7])

    planePlaneIntersection(this.planes[FAR], this.planes[RIGHT], ray.position, ray.direction)
    distance = rayIntersectsPlaneAt(ray.position, ray.direction, this.planes[TOP])
    ray.positionAt(distance, this.corners[5])

    Vec3.negate(ray.direction, ray.direction)
    distance = rayIntersectsPlaneAt(ray.position, ray.direction, this.planes[BOTTOM])
    ray.positionAt(distance, this.corners[6])
  }

  // /**
  //  * Checks for intersaction with a ray
  //  */
  // public intersectsRay(ray: Ray): boolean {
  //   throw new Error('not implemented')
  // }
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
    return frustumContainsBox(this, box.min, box.max) === ContainmentType.Contains
  }
  /**
   * Checks whether this frustum contains the given volume
   */
  public containsSphere(sphere: BoundingSphere): boolean {
    return frustumContainsSphere(this, sphere.center, sphere.radius) === ContainmentType.Contains
  }

  /**
   * Checks for intersection type with given volume
   */
  public containmentOfBox(box: BoundingBox): ContainmentType {
    return frustumContainsBox(this, box.min, box.max)
  }
  /**
   * Checks for intersection type with given volume
   */
  public containmentOfSphere(sphere: BoundingSphere): ContainmentType {
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
}
