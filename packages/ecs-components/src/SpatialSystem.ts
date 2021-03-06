import { BoundingBox, BoundingFrustum, BoundingSphere, BoundingVolume, IntersectionType, IVec3, IVec4, Ray } from '@gglib/math'

/**
 * @public
 */
export interface SpatialSystem<T> {
  fit(volume: BoundingVolume): SpatialNode<T>
  testRay(ray: Ray, out: T[]): boolean
  testPoint(point: IVec3, out: T[]): boolean
  testPlane(plane: IVec4, out: T[]): boolean
  testBox(volume: BoundingBox, out: T[]): boolean
  testSphere(volume: BoundingSphere, out: T[]): boolean
  testFrustum(volume: BoundingFrustum, out: T[]): boolean
}

/**
 * @public
 */
export interface SpatialNode<T> {
  insert(entry: SpatialEntry<T>): void
  remove(entry: SpatialEntry<T>): void
}

/**
 * @public
 */
export interface SpatialEntry<T> {
  node: SpatialNode<T>
  volume: BoundingVolume
  element: T
}

/**
 * @public
 */
export interface SpatialQuery<T> {
  result: T[]
  volume: BoundingVolume
  type: IntersectionType
}
