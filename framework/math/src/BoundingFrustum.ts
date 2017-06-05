import { BoundingBox } from './BoundingBox'
import { BoundingSphere } from './BoundingSphere'
import * as Collision from './Collision'
import { Mat4 } from './Mat4'
import { Ray } from './Ray'
import { ArrayLike, IVec2, IVec3, IVec4 } from './Types'
import { Vec3 } from './Vec3'

const NEAR = 0
const FAR = 1
const LEFT = 2
const RIGHT = 3
const TOP = 4
const BOTTOM = 5

export class BoundingFrustum {

  public planes: IVec4[]
  public corners: IVec3[]
  private matrixField: Mat4

  constructor(matrix?: Mat4) {
    this.planes = []
    for (let i = 0; i < 6; i++) {
      this.planes[i] = { x: 0, y: 0, z: 0, w: 0 }
    }
    this.corners = []
    for (let i = 0; i < 8; i++) {
      this.corners[i] = { x: 0, y: 0, z: 0 }
    }
    this.matrix = matrix || Mat4.identity()
  }

  get matrix(){
    return this.matrixField
  }
  set matrix(mat: Mat4) {
    this.matrixField = mat
    this.createPlanes()
    this.createCorners()
  }

  get near() {
    return this.planes[NEAR]
  }
  get far() {
    return this.planes[FAR]
  }
  get left() {
    return this.planes[LEFT]
  }
  get right() {
    return this.planes[RIGHT]
  }
  get top() {
    return this.planes[TOP]
  }
  get bottom() {
    return this.planes[BOTTOM]
  }

  private createPlanes() {
    // index layout
    // 0 4 8  12
    // 1 5 9  13
    // 2 6 10 14
    // 3 7 11 15
    const m = this.matrix.data
    let plane = this.planes[LEFT]
    plane.x = m[12] + m[0]
    plane.y = m[13] + m[1]
    plane.z = m[14] + m[2]
    plane.w = m[15] + m[3]

    plane = this.planes[RIGHT]
    plane.x = m[12] - m[0]
    plane.y = m[13] - m[1]
    plane.z = m[14] - m[2]
    plane.w = m[15] - m[3]

    plane = this.planes[TOP]
    plane.x = m[12] - m[4]
    plane.y = m[13] - m[5]
    plane.z = m[14] - m[6]
    plane.w = m[15] - m[7]

    plane = this.planes[BOTTOM]
    plane.x = m[12] + m[4]
    plane.y = m[13] + m[5]
    plane.z = m[14] + m[6]
    plane.w = m[15] + m[7]

    plane = this.planes[NEAR]
    plane.x = m[8]
    plane.y = m[9]
    plane.z = m[10]
    plane.w = m[11]

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

  private createCorners() {
    const ray = new Ray()
    let distance: number

    Collision.intersectionPlanePlane(this.planes[NEAR], this.planes[LEFT], ray.position, ray.direction)
    distance = Collision.intersectionRayPlane(ray, this.planes[TOP])
    this.corners[0] = ray.positionAt(distance, { x: 0, y: 0, z: 0 })

    Vec3.negate(ray.direction, ray.direction)
    distance = Collision.intersectionRayPlane(ray, this.planes[BOTTOM])
    this.corners[3] = ray.positionAt(distance, { x: 0, y: 0, z: 0 })

    Collision.intersectionPlanePlane(this.planes[RIGHT], this.planes[NEAR], ray.position, ray.direction)
    distance = Collision.intersectionRayPlane(ray, this.planes[TOP])
    this.corners[1] = ray.positionAt(distance, { x: 0, y: 0, z: 0 })

    Vec3.negate(ray.direction, ray.direction)
    distance = Collision.intersectionRayPlane(ray, this.planes[BOTTOM])
    this.corners[2] = ray.positionAt(distance, { x: 0, y: 0, z: 0 })

    Collision.intersectionPlanePlane(this.planes[LEFT], this.planes[FAR], ray.position, ray.direction)
    distance = Collision.intersectionRayPlane(ray, this.planes[TOP])
    this.corners[4] = ray.positionAt(distance, { x: 0, y: 0, z: 0 })

    Vec3.negate(ray.direction, ray.direction)
    distance = Collision.intersectionRayPlane(ray, this.planes[BOTTOM])
    this.corners[7] = ray.positionAt(distance, { x: 0, y: 0, z: 0 })

    Collision.intersectionPlanePlane(this.planes[FAR], this.planes[RIGHT], ray.position, ray.direction)
    distance = Collision.intersectionRayPlane(ray, this.planes[TOP])
    this.corners[5] = ray.positionAt(distance, { x: 0, y: 0, z: 0 })

    Vec3.negate(ray.direction, ray.direction)
    distance = Collision.intersectionRayPlane(ray, this.planes[BOTTOM])
    this.corners[6] = ray.positionAt(distance, { x: 0, y: 0, z: 0 })
  }

  public intersectsBox(box: BoundingBox): boolean {
    return Collision.intersectsFrustumBox(this, box)
  }
  public intersectsSphere(sphere: BoundingSphere): boolean {
    return Collision.intersectsFrustumSphere(this, sphere)
  }
  public intersectsFrustum(other: BoundingFrustum): boolean {
    throw new Error('not implemented')
  }
  public intersectsPlane(plane: IVec4): boolean {
    return Collision.intersectsFrustumPlane(this, plane)
  }
  public intersectsRay(ray: Ray): boolean {
    throw new Error('not implemented')
  }

  public containsBox(box: BoundingBox): number {
    return Collision.frustumContainsBox(this, box)
  }
  public containsSphere(sphere: BoundingSphere): number {
    return Collision.frustumContainsSphere(this, sphere)
  }
  public containsPoint(point: IVec3): number {
    return Collision.frustumContainsPoint(this, point)
  }
}