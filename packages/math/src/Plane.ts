import type { IVec3, IVec4 } from './Types'
import { vec3 } from './Vec3'
import { vec4 } from './Vec4'

/**
 * Sets a plane from a normal and a distance
 *
 * @remarks
 * A plane is stored as an {@link IVec4}. The xyz components hold the normal
 * and the w component holds the distance from the origin along the normal.
 *
 * @param out The plane to set
 * @param normal The normal of the plane
 * @param distance The distance from the origin along the normal
 */
export function plane$initNormalDistance(out: IVec4, normal: IVec3, distance: number): IVec4 {
  out.x = normal.x
  out.y = normal.y
  out.z = normal.z
  out.w = distance
  return out
}

/**
 * Creates a new plane from a normal and a distance
 *
 * @param normal The normal of the plane
 * @param distance The distance from the origin along the normal
 */
export function planeCreateNormalDistance(normal: IVec3, distance: number): IVec4 {
  return plane$initNormalDistance(vec4(), normal, distance)
}

/**
 * Gets the normal of a plane
 *
 * @param plane The plane to read from
 * @param out The vector to write to.
 */
export function planeGetNormal(plane: IVec4, out?: IVec3): IVec3 {
  out ||= vec3()
  out.x = plane.x
  out.y = plane.y
  out.z = plane.z
  return out
}

/**
 * Calculates the signed distance from a plane to a point
 *
 * @remarks
 * The result is positive if the point is in front of the plane and negative if it is behind.
 * The plane normal is expected to be normalized.
 *
 * @param plane The plane
 * @param point The point
 */
export function planeDistanceToPoint(plane: IVec4, point: IVec3): number {
  return plane.x * point.x + plane.y * point.y + plane.z * point.z + plane.w
}
