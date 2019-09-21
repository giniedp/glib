import { BoundingBox } from './BoundingBox'
import { BoundingFrustum } from './BoundingFrustum'
import { BoundingSphere } from './BoundingSphere'
import { IntersectionType } from './Collision'
import { Ray } from './Ray'
import { IVec3, IVec4 } from './Types'

export interface BoundingVolume {
  /**
   * Clones the volume
   */
  clone(): BoundingVolume

  /**
   * Checks whether the given point intersects this volume
   */
  intersectsPoint(point: IVec3): boolean

  /**
   * Checks whether the given ray intersects this volume
   */
  intersectsRay(ray: Ray): boolean

  /**
   * Checks whether the given plane intersects this volume
   */
  intersectsPlane(plane: IVec4): boolean

  /**
   * Checks whether the given box intersects this volume
   */
  intersectsBox(box: BoundingBox): boolean

  /**
   * Checks whether the given sphere intersects this volume
   */
  intersectsSphere(sphere: BoundingSphere): boolean

  /**
   * Checks whether the given frustum intersects this volume
   */
  intersectsFrustum(frustum: BoundingFrustum): boolean

  /**
   * Checks whether the given box is contained by this volume
   */
  containsBox(box: BoundingBox): boolean

  /**
   * Checks whether the given sphere is contained by this volume
   */
  containsSphere(sphere: BoundingSphere): boolean

  /**
   * Checks whether the given frustum is contained by this volume
   */
  containsFrustum(frustum: BoundingFrustum): boolean

  /**
   * Checks for collision with another box and returns the intersection type
   */
  containmentOfBox(box: BoundingBox): IntersectionType

  /**
   * Checks for collision with another sphere and returns the intersection type
   */
  containmentOfSphere(sphere: BoundingSphere): IntersectionType

  /**
   * Checks for collision with another frustum and returns the intersection type
   */
  containmentOfFrustum(frustum: BoundingFrustum): IntersectionType

  /**
   * Checks whether the given box contains this volume
   */
  containedByBox(box: BoundingBox): boolean

  /**
   * Checks whether the given sphere contains this volume
   */
  containedBySphere(sphere: BoundingSphere): boolean

  /**
   * Checks whether the given frustum contains this volume
   */
  containedByFrustum(frustum: BoundingFrustum): boolean

  /**
   * Checks for collision with another box and returns the intersection type
   */
  containmentByBox(box: BoundingBox): IntersectionType

  /**
   * Checks for collision with another sphere and returns the intersection type
   */
  containmentBySphere(sphere: BoundingSphere): IntersectionType

  /**
   * Checks for collision with another frustum and returns the intersection type
   */
  containmentByFrustum(frustum: BoundingFrustum): IntersectionType
}
