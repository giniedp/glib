import { BoundingFrustum } from './BoundingFrustum'
import { IVec3, IVec4 } from './Types'
import { Vec3 } from './Vec3'

/**
 * Enumeration of intersection types
 *
 * @public
 */
export const enum IntersectionType {
  Disjoint = 0,
  Intersects = 1,
  Contains = 2,
}

/**
 * Enumeration of plane intersection types
 *
 * @public
 */
export const enum PlaneIntersectionType {
  Back = -1,
  Front = 0,
  Intersects = 1,
}

const EPSILON = Number.EPSILON

const v3temp1 = Vec3.create()
const v3temp2 = Vec3.create()
const v3temp3 = Vec3.create()
const v3temp4 = Vec3.create()
const v3temp5 = Vec3.create()
const v3temp6 = Vec3.create()

/**
 * Calculates a point on a line segment that is closest to a given point
 *
 * @public
 * @param point - the point in question
 * @param segmentStart - line start position
 * @param segmentEnd - line end position
 * @param out - where the result is written to
 */
export function closestPointOnSegment<T>(point: IVec3, segmentStart: IVec3, segmentEnd: IVec3, out: T): T & IVec3
export function closestPointOnSegment(point: IVec3, segmentStart: IVec3, segmentEnd: IVec3, out: IVec3): IVec3 {
  // Real Time Collision Detection Chapter 5.1.2 page 128

  const ab = Vec3.subtract(segmentEnd, segmentStart, v3temp1)
  // project c onto ab, computing parametrized position d(t) = a + t * (b - a)
  const ac = Vec3.subtract(point, segmentStart, v3temp2)
  let t = Vec3.dot(ac, ab) / Vec3.lengthSquared(ab)
  // if outside segment, clamp t (and therefore d) to closest endpoint
  t = t < 0.0 ? 0.0 : (t > 1.0 ? 1.0 : t)
  // compute projected position from the clamped t
  out.x = segmentStart.x + t * ab.x
  out.y = segmentStart.y + t * ab.y
  out.z = segmentStart.z + t * ab.z
  return out
}

/**
 * Calculates the point on a plane that is the closest to a given point
 *
 * @public
 * @param point - the point in question
 * @param plane - the plane in question
 * @param out - where the result is written to
 */
export function closestPointOnPlane<T>(point: IVec3, plane: IVec4, out: T): T & IVec3
export function closestPointOnPlane(point: IVec3, plane: IVec4, out: IVec3): IVec3 {
  const d = plane.x * point.x + plane.y * point.y + plane.z * point.z + plane.w
  out.x = point.x - plane.x * d
  out.y = point.y - plane.y * d
  out.z = point.z - plane.z * d
  return out
}

/**
 * Calculates a point on triangle that is closest to a given point
 *
 * @public
 * @param point - the point in question
 * @param a - first vertex of triangle
 * @param b - second vertex of triangle
 * @param c - third vertex of triangle
 * @param out - where the result is written to
 */
export function closestPointOnTriangle<T>(point: IVec3, a: IVec3, b: IVec3, c: IVec3, out: T): T & IVec3
export function closestPointOnTriangle(point: IVec3, a: IVec3, b: IVec3, c: IVec3, out: IVec3): IVec3 {

  const ab = Vec3.subtract(b, a, v3temp1)
  const ac = Vec3.subtract(c, a, v3temp2)
  const ap = Vec3.subtract(point, a, v3temp3)
  const d1 = Vec3.dot(ab, ap)
  const d2 = Vec3.dot(ac, ap)
  if (d1 <= 0 && d2 <= 0) {
    // barycentric coordinates (1, 0, 0)
    out.x = a.x
    out.y = a.y
    out.z = a.z
    return out
  }

  const bp = Vec3.subtract(point, b, v3temp4)
  const d3 = Vec3.dot(ab, bp)
  const d4 = Vec3.dot(ac, bp)
  if (d3 <= 0 && d4 <= 0) {
    // barycentric coordinates (0, 1, 0)
    out.x = b.x
    out.y = b.y
    out.z = b.z
    return out
  }

  const vc = d1 * d4 - d3 * d2
  if (vc <= 0 && d1 >= 0 && d3 <= 0) {
    const w = d1 / (d1 - d3)
    out.x = a.x + w * ab.x
    out.y = a.y + w * ab.y
    out.z = a.z + w * ab.z
    return out
  }

  const cp = Vec3.subtract(point, c, v3temp5)
  const d5 = Vec3.dot(ab, cp)
  const d6 = Vec3.dot(ac, cp)
  if (d5 <= 0 && d6 <= 0) {
    // barycentric coordinates (0, 0, 1)
    out.x = c.x
    out.y = c.y
    out.z = c.z
    return out
  }

  const vb = d5 * d2 - d1 * d6
  if (vb <= 0 && d2 >= 0 && d6 <= 0) {
    const w = d2 / (d2 - d6)
    out.x = a.x + w * ac.x
    out.y = a.y + w * ac.y
    out.z = a.z + w * ac.z
    return out
  }

  const va = d3 * d6 - d5 * d4
  if (va <= 0 && (d4 - d3) >= 0 && (d5 - d6) >= 0) {
    const w = (d4 - d3) / ((d4 - d3) + (d5 - d6))
    out.x = b.x + w * (c.x - b.x)
    out.y = b.y + w * (c.y - b.y)
    out.z = b.z + w * (c.z - b.z)
    return out
  }

  const denom = 1 / (va + vb + vc)
  out.x = a.x + ab.x * vb * denom + ac.x * vc * denom
  out.y = a.y + ab.y * vb * denom + ac.y * vc * denom
  out.z = a.z + ab.z * vb * denom + ac.z * vc * denom
  return out
}

/**
 * Calculates the closest two points between two segments
 *
 * @public
 * @param segment1Start - the first segment start point
 * @param segment1End - the first segment end point
 * @param segment2Start - the second segment start point
 * @param segment2End - the second segment end point
 * @param outP1 - the closest point on first segment
 * @param outP2 - the closest point on second segment
 * @returns the squared distance between the closest points
 */
function closestPointsOfSegments(
  segment1Start: IVec3,
  segment1End: IVec3,
  segment2Start: IVec3,
  segment2End: IVec3,
  outP1: IVec3,
  outP2: IVec3,
): number {
  // Real Time Collision Detection Chapter 5.1.9 page 150

  const d1 = Vec3.subtract(segment1End, segment1Start, v3temp1) // direction vector of segmen s1
  const d2 = Vec3.subtract(segment2End, segment2Start, v3temp2) // direction vector of segmen s2
  const r = Vec3.subtract(segment1Start, segment2Start, v3temp3)
  let a = d1.lengthSquared() // squared length of segment s1, always nonnegative
  let e = d2.lengthSquared() // squared length of segment s2, always nonnegative
  let f = Vec3.dot(d2, r)

  let s = 0
  let t = 0

  // check if either or both segments degenerate into points
  if (a <= EPSILON && e <= EPSILON) {
    // both segments degenerate into points
    Vec3.clone(segment1Start, outP1)
    Vec3.clone(segment2Start, outP2)
    return Vec3.distanceSquared(outP1, outP2)
  }
  if (a <= EPSILON) {
    // first segment degenerates into point
    t = f / e // s = 0 => t = (b*s + f) / e = f / e
    t = t < 0 ? 0 : t > 1 ? 1 : t
  } else if (e <= EPSILON) {
    let c = Vec3.dot(d1, r)
    // second segment degenerates into point
    t = 0
    s = -c / a // t = 0 => s = *b*t -c) / a = -c / a
    s = s < 0 ? 0 : s > 1 ? 1 : s
  } else {
    let c = Vec3.dot(d1, r)
    // the generat londegenerate case starts here
    let b = Vec3.dot(d1, d2)
    let denom = a * e - b * b // alwasy nonnegative

    if (denom !== 0) {
      s = (b * f - c * e) / denom
      s = s < 0 ? 0 : s > 1 ? 1 : s
      t = (b * s + f) / e
    } else {
      s = 0
      t = f / e
    }

    if (t < 0) {
      t = 0
      s = -c / a
      s = s < 0 ? 0 : s > 1 ? 1 : s
    } else if (t > 1) {
      t = 1
      s = (b - c) / a
      s = s < 0 ? 0 : s > 1 ? 1 : s
    }
  }
  Vec3.addScaled(segment1Start, d1, s, outP1)
  Vec3.addScaled(segment2Start, d2, s, outP2)
  return Vec3.distanceSquared(outP1, outP2)
}

/**
 * @public
 */
export function distancePlaneToPoint(plane: IVec4, point: IVec3): number {
  return plane.x * point.x + plane.y * point.y + plane.z * point.z + plane.w
}

/**
 * @public
 */
export function distanceSquaredPointToSegment(a: IVec3, b: IVec3, c: IVec3): number {
  // Real Time Collision Detection Chapter 5.1.3 page 130

  const ab = Vec3.subtract(b, a, v3temp1)
  const ac = Vec3.subtract(c, a, v3temp2)
  const bc = Vec3.subtract(c, b, v3temp3)

  const e = Vec3.dot(ac, ab)
  // handle cases where c projects outside ab
  if (e < 0.0) {
    return Vec3.lengthSquared(ac)
  }

  const f = Vec3.lengthSquared(ab)
  if (e >= f) {
    return Vec3.lengthSquared(bc)
  }

  // handle cases where c projects onto ab
  return Vec3.lengthSquared(ac) - e * e / f
}

/**
 * Checks whether a ray intersects a plane
 *
 * @public
 * @param orig - the ray origin
 * @param dir - the ray direction
 * @param plane - the plane
 */
export function rayIntersectsPlane(orig: IVec3, dir: IVec3, plane: IVec4): boolean {
  return ((plane.w - Vec3.dot(plane, orig)) / Vec3.dot(plane, dir)) >= 0 // TODO:
}

/**
 * Calculates the distance where a ray intersects a plane
 *
 * @public
 * @param orig - the ray origin
 * @param dir - the ray direction
 * @param plane - the plane
 * @returns the distance to intersection point or `Number.NaN` in case of no intersection.
 */
export function rayIntersectsPlaneAt(orig: IVec3, dir: IVec3, plane: IVec4): number {
  const d = Vec3.dot(plane, dir)
  if (Math.abs(d) > EPSILON) {
    return (plane.w - Vec3.dot(plane, orig)) / d // TODO:
  }
  return Number.NaN
}

/**
 * Checks whether a ray intersects a plane
 *
 * @public
 * @param orig - the ray origin
 * @param dir - the ray direction
 * @param center - the sphere center
 * @param radius - the sphere radius
 */
export function rayIntersectsSphere(orig: IVec3, dir: IVec3, center: IVec3, radius: number): boolean {

  const m = Vec3.subtract(orig, center, v3temp1)
  const c = Vec3.dot(m, m) - radius * radius
  // if there is definitely at least one real root, there must be an intersection
  if (c <= 0) {
    return true
  }

  const b = Vec3.dot(m, dir)
  // exit if rays origin outside sphere and ray pointing away from sphere
  if (b > 0) {
    return false
  }

  // a negative discriminant corresponds to ray missing sphere
  return (b * b - c) >= 0
}

/**
 * Calculates the distance where a ray intersects a sphere
 *
 * @public
 * @param orig - the ray origin
 * @param dir - the ray direction
 * @param center - the sphere center
 * @param radius - the sphere radius
 * @returns the distance to intersection point or `Number.NaN` in case of no intersection.
 */
export function rayIntersectsSphereAt(orig: IVec3, dir: IVec3, center: IVec3, radius: number): number {

  const m = Vec3.subtract(orig, center, v3temp1)
  const b = Vec3.dot (m, dir)
  const c = Vec3.dot(m, m) - radius * radius
  // exit if rays origin outside sphere (c < 0) and ray pointing away from sphere (b > 0)
  if (c > 0 && b > 0) {
    return Number.NaN
  }

  const discr = b * b - c
  // negative discriminant corresponds to ray missing sphere
  if (discr < 0) {
    return Number.NaN
  }
  // Ray now found to intersect sphere, compute smallest t value of intersection
  let result = -b - Math.sqrt(discr)
  if (result > 0) {
    return result
  }
  result = -b + Math.sqrt(discr)
  if (result > 0) {
    return result
  }
  return Number.NaN
  // If t is negative, ray started inside sphere , so clamp to zero
  // return recycle.end(result < 0 ? 0 : result)
}

/**
 * Checks whether a ray intersects an axis aligned bounding box
 *
 * @public
 * @param rayPos - the ray origin
 * @param rayDir - the ray direction
 * @param boxMin - the min point of the box
 * @param boxMax - the max point of the box
 */
export function rayIntersectsBox(rayPos: IVec3, rayDir: IVec3, boxMin: IVec3, boxMax: IVec3): boolean {
  return rayIntersectsBoxAt(rayPos, rayDir, boxMin, boxMax) >= 0
}

/**
 * Calculates the distance where a ray intersects an axis aligned bounding box
 *
 * @public
 * @param rayPos - the ray origin
 * @param rayDir - the ray direction
 * @param boxMin - the min point of the box
 * @param boxMax - the max point of the box
 * @returns the distance to intersection point or `Number.NaN` in case of no intersection.
 */
export function rayIntersectsBoxAt(rayPos: IVec3, rayDir: IVec3, boxMin: IVec3, boxMax: IVec3): number {
  // source
  // http://www.siggraph.org/education/materials/HyperGraph/raytrace/rtinter3.htm

  let tMin = Number.MIN_VALUE
  let tMax = Number.MAX_VALUE

  if (Math.abs(rayDir.x) < EPSILON) {
    // ray is parallel to X planes
    if (rayPos.x < boxMin.x || rayPos.x > boxMax.x) {
      // ray origin is not between the slabs
      return Number.NaN
    }
  } else {
    const oneOverDirX = 1 / rayDir.x
    let t1 = (boxMin.x - rayPos.x) * oneOverDirX
    let t2 = (boxMax.x - rayPos.x) * oneOverDirX
    if (t1 > t2) {
      // swap since T1 intersection with near plane
      const temp = t1
      t1 = t2
      t2 = temp
    }
    tMin = Math.max(t1, tMin)
    tMax = Math.min(t2, tMax)
    if (tMin > tMax) {
      return Number.NaN
    }
  }

  if (Math.abs(rayDir.y) < EPSILON) {
    // ray is parallel to Y planes
    if (rayPos.y < boxMin.y || rayPos.y > boxMax.y) {
      // ray origin is not between the slabs
      return Number.NaN
    }
  } else {
    const oneOverDirY = 1 / rayDir.y
    let t1 = (boxMin.y - rayPos.y) * oneOverDirY
    let t2 = (boxMax.y - rayPos.y) * oneOverDirY
    if (t1 > t2) {
      const temp = t1
      t1 = t2
      t2 = temp
    }
    tMin = Math.max(t1, tMin)
    tMax = Math.min(t2, tMax)
    if (tMin > tMax) {
        return Number.NaN
    }
  }

  if (Math.abs(rayDir.z) < EPSILON) {
    // ray is parallel to Z planes
    if (rayPos.z < boxMin.z || rayPos.z > boxMax.z) {
      // ray origin is not between the slabs
      return Number.NaN
    }
  } else {
    const oneOverDirZ = 1 / rayDir.z
    let t1 = (boxMin.z - rayPos.z) * oneOverDirZ
    let t2 = (boxMax.z - rayPos.z) * oneOverDirZ
    if (t1 > t2) {
      const temp = t1
      t1 = t2
      t2 = temp
    }
    tMin = Math.max(t1, tMin)
    tMax = Math.min(t2, tMax)
    if (tMin > tMax) {
      return Number.NaN
    }
  }
  return tMin
}

/**
 * Checks whether a ray intersects a triangle
 *
 * @public
 * @param orig - the ray origin
 * @param dir - the ray direction
 * @param v0 - the first triangle vertex
 * @param v1 - the second triangle vertex
 * @param v2 - the third triangle vertex
 */
export function rayIntersectsTriangle(orig: IVec3, dir: IVec3, v0: IVec3, v1: IVec3, v2: IVec3): boolean {

  const edge1 = Vec3.subtract(v1, v0, v3temp1)
  const edge2 = Vec3.subtract(v2, v0, v3temp2)

  // Compute triangle normal.
  const n = Vec3.cross(edge1, edge2, v3temp3)

  // Compute denominator d. If d <= 0, segment is parallel to or points away from triangle
  const d = Vec3.dot(dir, n)
  if (d < Number.EPSILON) {
    return false
  }

  // Compute intersection t value of pq with plane of triangle. A ray ContainmentType.intersects if t >= 0
  const ap = Vec3.subtract(orig, v0, v3temp4)
  const result = Vec3.dot(ap, n)
  if (result < 0) {
    return false
  }

  // Compute barycentric coordinate components and tes if within bounds
  const e = Vec3.cross(dir, ap, v3temp5)
  const v = Vec3.dot(edge2, e)
  if (v < 0 || v > d) {
    return false
  }
  const w = -Vec3.dot(edge1, e)
  if (w < 0 || v + w > d) {
    return false
  }
  return true
}

/**
 * Calculates the distance where a ray intersects a triangle
 *
 * @public
 * @param orig - the ray origin
 * @param dir - the ray direction
 * @param v0 - the first triangle vertex
 * @param v1 - the second triangle vertex
 * @param v2 - the third triangle vertex
 * @returns the distance to intersection point or `Number.NaN` in case of no intersection.
 */
export function rayIntersectsTriangleAt(orig: IVec3, dir: IVec3, v0: IVec3, v1: IVec3, v2: IVec3): number {

  const ab = Vec3.subtract(v1, v0, v3temp1)
  const ac = Vec3.subtract(v2, v0, v3temp2)

  // Compute triangle normal.
  const n = Vec3.cross(ab, ac, v3temp3)

  // Compute denominator d. If d <= 0, segment is parallel to or points away from triangle
  const d = Vec3.dot(dir, n)
  if (d <= 0) {
    return Number.NaN
  }

  // Compute intersection t value of pq with plane of triangle. A ray ContainmentType.intersects if t >= 0
  const ap = Vec3.subtract(orig, v0, v3temp4)
  let result = Vec3.dot(ap, n)
  if (result < 0) {
    return Number.NaN
  }

  // Compute barycentric coordinate components and tes if within bounds
  const e = Vec3.cross(dir, ap, v3temp5)
  const v = Vec3.dot(ac, e)
  if (v < 0 || v > d) {
    return Number.NaN
  }
  const w = -Vec3.dot(ab, e)
  if (w < 0 || v + w > d) {
    return Number.NaN
  }

  //
  const ood = 1 / d
  result *= ood
  // compute barycentric
  // v *= ood
  // w *= ood
  // float u = 1f - v - w
  return result
}

/**
 * Checks for intersection between a plane and a 3d point
 *
 * @public
 * @param plane - the plane
 * @param point - the point
 */
export function planeIntersectsPoint(plane: IVec4, point: IVec3): PlaneIntersectionType {
  const d = plane.x * point.x + plane.y * point.y + plane.z * point.z + plane.w
  if (d > 0) {
    return PlaneIntersectionType.Front
  }
  if (d < 0) {
    return PlaneIntersectionType.Back
  }
  return PlaneIntersectionType.Intersects
}

/**
 * Checks for intersection between a plane and a sphere
 *
 * @public
 * @param plane - the plane
 * @param center - the sphere center
 * @param radius - the sphere radius
 */
export function planeIntersectsSphere(plane: IVec4, center: IVec3, radius: number): PlaneIntersectionType {
  const d = plane.x * center.x + plane.y * center.y + plane.z * center.z + plane.w
  if (d > radius) {
    return PlaneIntersectionType.Front
  }
  if (d < -radius) {
    return PlaneIntersectionType.Back
  }
  return PlaneIntersectionType.Intersects
}

/**
 * Checks for intersection between a plane and a box
 *
 * @public
 * @param plane - the plane
 * @param boxMin - the min point of the box
 * @param boxMax - the max point of the box
 */
export function planeIntersectsBox(plane: IVec4, boxMin: IVec3, boxMax: IVec3): PlaneIntersectionType {
  let pX = plane.x >= 0 ? boxMin.x : boxMax.x
  let pY = plane.y >= 0 ? boxMin.y : boxMax.y
  let pZ = plane.z >= 0 ? boxMin.z : boxMax.z
  let d = plane.x * pX + plane.y * pY + plane.z * pZ + plane.w
  if (d > 0) {
      return PlaneIntersectionType.Front
  }

  pX = plane.x >= 0 ? boxMax.x : boxMin.x
  pY = plane.y >= 0 ? boxMax.y : boxMin.y
  pZ = plane.z >= 0 ? boxMax.z : boxMin.z
  d = plane.x * pX + plane.y * pY + plane.z * pZ + plane.w
  if (d < 0) {
    return PlaneIntersectionType.Back
  }

  return PlaneIntersectionType.Intersects
}

/**
 * Checks for intersection between a plane and a capsule
 *
 * @public
 * @param plane - the plane
 * @param capsuleStart - the capsule start point
 * @param capsuleEnd - the capsule end point
 * @param capsuleR - the capsule radius
 */
export function planeIntersectsCapsule(plane: IVec4, capsuleStart: IVec3, capsuleEnd: IVec3, capsuleR: number): PlaneIntersectionType {

  const pi1 = planeIntersectsSphere(plane, capsuleStart, capsuleR)
  const pi2 = planeIntersectsSphere(plane, capsuleEnd, capsuleR)
  return pi1 === pi2 ? pi1 : PlaneIntersectionType.Intersects
}

/**
 * Checks for intersection between a plane and frustum
 *
 * @public
 * @param plane - the plane
 * @param frustum - the frustum
 */
export function planeIntersectsFrustum(plane: IVec4, frustum: BoundingFrustum): PlaneIntersectionType {
  let result: PlaneIntersectionType = planeIntersectsPoint(plane, frustum.corners[0])
  for (let i = 1; i < frustum.corners.length; i++) {
    if (result !== planeIntersectsPoint(plane, frustum.corners[i])) {
      result = PlaneIntersectionType.Intersects
    }
  }
  return result
}

/**
 * Calculates the intersection edge between two planes
 *
 * @public
 * @param plane1 - the first plane
 * @param plane2 - the second plane
 * @param outPosition - the resulting edge position
 * @param outDirection - the resulting edge direction
 * @returns `true` if the planes intersects, `false` otherwise
 */
export function planePlaneIntersection(plane1: IVec4, plane2: IVec4, outPosition: IVec3, outDirection: IVec3): boolean {

  Vec3.cross(plane1, plane2, outDirection)
  const denom = Vec3.lengthSquared(outDirection)
  if (denom < EPSILON) {
    return false
  }

  const p1 = Vec3.multiplyScalar(plane2, plane1.w, v3temp1)
  const p2 = Vec3.multiplyScalar(plane1, -plane2.w, v3temp2)
  Vec3.add(p1, p2, outPosition)
  Vec3.cross(outPosition, outDirection, outPosition)
  Vec3.divideScalar(outPosition, denom, outPosition)

  return true
}

/**
 * Calculates the intersection point between three planes
 *
 * @public
 * @param p1 - the first plane
 * @param p2 - the second plane
 * @param p3 - the third plane
 * @param out - where the result is written to
 * @returns `true` if the planes intersect, `false` otherwise
 */
export function planePlanePlaneIntersection(p1: IVec4, p2: IVec4, p3: IVec4, out?: IVec3): boolean {

  const m1 = v3temp1
  m1.x = p1.x
  m1.y = p2.x
  m1.z = p3.x

  const m2 = v3temp2
  m2.x = p1.y
  m2.y = p2.y
  m2.z = p3.y

  const m3 = v3temp3
  m3.x = p1.z
  m3.y = p2.z
  m3.z = p3.z

  const u = Vec3.cross(m2, m3, v3temp4)
  const denom = Vec3.dot(m1, u)

  if (Math.abs(denom) < EPSILON) {
    out.x = 0
    out.y = 0
    out.z = 0
    return false
  }

  const d = v3temp5
  d.x = p1.w
  d.y = p2.w
  d.z = p3.w
  const v = Vec3.cross(m1, d, v3temp6)
  const ood = 1 / denom

  if (out) {
    out.x = Vec3.dot(d, u) * ood
    out.y = Vec3.dot(m3, v) * ood
    out.z = -Vec3.dot(m2, v) * ood
  }

  return true
}

/**
 * Checks whether a box intersects a point
 *
 * @public
 * @param min - the min point of box volume
 * @param max - the max point of box volume
 * @param point - the point
 */
export function boxIntersectsPoint(min: IVec3, max: IVec3, point: IVec3): boolean {
  return !(
    min.x > point.x ||
    point.x > max.x ||
    min.y > point.y ||
    point.y > max.y ||
    min.z > point.z ||
    point.z > max.z)
}

/**
 * Checks whether a box intersects a plane
 *
 * @public
 * @param min - the min point of box volume
 * @param max - the max point of box volume
 * @param plane - the plane
 */
export function boxIntersectsPlane(min: IVec3, max: IVec3, plane: IVec4): boolean {
  let pX = plane.x >= 0 ? min.x : max.x
  let pY = plane.y >= 0 ? min.y : max.y
  let pZ = plane.z >= 0 ? min.z : max.z
  let d = plane.x * pX + plane.y * pY + plane.z * pZ + plane.w
  if (d > 0) {
      return false
  }

  pX = plane.x >= 0 ? max.x : min.x
  pY = plane.y >= 0 ? max.y : min.y
  pZ = plane.z >= 0 ? max.z : min.z
  d = plane.x * pX + plane.y * pY + plane.z * pZ + plane.w
  if (d < 0) {
    return false
  }

  return true
}

/**
 * Checks whether a box intersects a sphere
 *
 * @public
 * @param min - the min point of box volume
 * @param max - the max point of box volume
 * @param center - the sphere center
 * @param radius - the sphere radius
 */
export function boxIntersectSphere(min: IVec3, max: IVec3, center: IVec3, radius: number): boolean {

  const c = Vec3.clamp(center, min, max, v3temp1)
  const d = Vec3.distanceSquared(center, c)
  return d <= (radius * radius)
}

/**
 * Checks whether a box intersects another box
 *
 * @public
 * @param min1 - the min point of first box volume
 * @param max1 - the max point of first box volume
 * @param min2 - the min point of second box volume
 * @param max2 - the max point of second box volume
 */
export function boxIntersectBox(min1: IVec3, max1: IVec3, min2: IVec3, max2: IVec3): boolean {
    return (max1.x >= min2.x && min1.x <= max2.x &&
            max1.y >= min2.y && min1.y <= max2.y &&
            max1.z >= min2.z && min1.z <= max2.z)
}

/**
 * Checks whether a box intersects a capsule volume
 *
 * @public
 * @param boxMin - the min point of box volume
 * @param boxMax - the max point of box volume
 * @param capsuleStart - the capsule start point
 * @param capsuleEnd - the capsule end point
 * @param capsuleR - the capsule radius
 */
export function boxIntersectsCapsule(
  boxMin: IVec3,
  boxMax: IVec3,
  capsuleStart: IVec3,
  capsuleEnd: IVec3,
  capsuleR: number,
): boolean {
  const boxCenter = v3temp1
  boxCenter.x = (boxMax.x - boxMin.x) * 0.5 + boxMin.x
  boxCenter.y = (boxMax.y - boxMin.y) * 0.5 + boxMin.y
  boxCenter.z = (boxMax.z - boxMin.z) * 0.5 + boxMin.z
  const closest = closestPointOnSegment(boxCenter, capsuleStart, capsuleEnd, v3temp2)
  return boxIntersectSphere(boxMin, boxMax, closest, capsuleR)
}

/**
 * Checks whether a sphere intersects a point
 *
 * @public
 * @param center - the sphere center
 * @param radius - the sphere radius
 * @param point - the point
 */
export function sphereIntersectsPoint(center: IVec3, radius: number, point: IVec3): boolean {
  return Vec3.distanceSquared(point, center) <= (radius * radius)
}

/**
 * Checks whether a sphere intersects a plane
 *
 * @public
 * @param center - the sphere center
 * @param radius - the sphere radius
 * @param plane - the plane
 */
export function sphereIntersectsPlane(center: IVec3, radius: number, plane: IVec4): boolean {
  return Math.abs(plane.x * center.x + plane.y * center.y + plane.z * center.z + plane.w) <= radius
}

/**
 * Checks wphether a sphere intersects another sphere
 *
 * @public
 * @param c1 - the first sphere center
 * @param r1 - the first sphere radius
 * @param c2 - the second sphere center
 * @param r2 - the second sphere radius
 */
export function sphereIntersectsSphere(c1: IVec3, r1: number, c2: IVec3, r2: number): boolean {
  // Calculate squared distance between centers
  const d2 = Vec3.distanceSquared(c1, c2)
  // Spheres intersect if squared distance is less than squared sum of radii
  const r = r1 + r2
  return d2 <= (r * r)
}

/**
 * Checks whether a sphere intersects a triangle
 *
 * @public
 * @param center - the sphere center
 * @param radius - the sphere radius
 * @param v0 - first point of triangle
 * @param v1 - second point of triangle
 * @param v2 - third point of triangle
 */
export function sphereIntersectsTriangle(center: IVec3, radius: number, v0: IVec3, v1: IVec3, v2: IVec3): boolean {
  const p = closestPointOnTriangle(center, v0, v1, v2, v3temp1)
  Vec3.subtract(p, center, p)
  return Vec3.lengthSquared(p) <= radius * radius
}

/**
 * Checks whether a sphere intersects a capsule
 *
 * @public
 * @param sphereCenter - the sphere center
 * @param sphereRaidus - the sphere radisu
 * @param capsuleStart - the capsule start point
 * @param capsuleEnd - the capsule end point
 * @param capsuleRadius - the capsule radius
 */
export function sphereIntersectsCapsule(
  sphereCenter: IVec3,
  sphereRaidus: number,
  capsuleStart: IVec3,
  capsuleEnd: IVec3,
  capsuleRadius: number,
): boolean {
  const dist2 = distanceSquaredPointToSegment(capsuleStart, capsuleEnd, sphereCenter)
  const radius = capsuleRadius + sphereRaidus
  return dist2 <= radius * radius
}

/**
 * Checks whether a frustum intersects a point
 *
 * @public
 * @param frustum - the frustum
 * @param point - the point
 */
export function frustumIntersectsPoint(frustum: BoundingFrustum, point: IVec3): boolean {
  let p: IVec4
  let d: number
  for (let i = 0; i < 6; i++) {
    p = frustum.planes[i]
    d = p.x * point.x + p.y * point.y + p.z * point.z + p.w
    if (d > 0) {
      return false
    }
  }
  return true
}

/**
 * Checks whether a frustum intersects a sphere
 *
 * @public
 * @param frustum - the frustum
 * @param center - the sphere center
 * @param radius - the sphere radius
 */
export function frustumIntersectsSphere(frustum: BoundingFrustum, center: IVec3, radius: number): boolean {
  let plane: IVec4
  for (let i = 0; i < 6; i++) {
    plane = frustum.planes[i]
    if (plane.x * center.x + plane.y * center.y + plane.z * center.z + plane.w > radius) {
      return false
    }
  }
  return true
}

/**
 * Checks whether a frustum intersects a box
 *
 * @public
 * @param frustum - the frustum
 * @param min - the min point of box volume
 * @param max - the max point of box volume
 */
export function frustumIntersectsBox(frustum: BoundingFrustum, min: IVec3, max: IVec3): boolean {
  let plane: IVec4
  let pX: number
  let pY: number
  let pZ: number
  let dist: number

  for (let i = 0; i < 6; i++) {
    plane = frustum.planes[i]
    pX = plane.x >= 0 ? min.x : max.x
    pY = plane.y >= 0 ? min.y : max.y
    pZ = plane.z >= 0 ? min.z : max.z
    dist = plane.x * pX + plane.y * pY + plane.z * pZ + plane.w

    if (dist > 0) {
      return false
    }
  }
  return true
}

/**
 * Checks whether a frustum intersects a plane
 *
 * @public
 * @param frustum - the frustum
 * @param plane - the plane
 */
export function frustumIntersectsPlane(frustum: BoundingFrustum, plane: IVec4): boolean {
  let back
  let front
  for (const point of frustum.corners) {
    const d = Vec3.dot(point, plane) + plane.w
    if (d < 0) {
      back = true
    } else {
      front = true
    }
    if (back && front) {
      return true
    }
  }
  return false
}

/**
 * Checks whether a box contains another box volume
 *
 * @public
 * @param min1 - the min point of the box
 * @param max1 - the max point of the box
 * @param min2 - the min point of another box
 * @param max2 - the max point of another box
 */
export function boxContainsBox(min1: IVec3, max1: IVec3, min2: IVec3, max2: IVec3): IntersectionType {
  if (
    (max1.x < min2.x) ||
    (min1.x > max2.x) ||
    (max1.y < min2.y) ||
    (min1.y > max2.y) ||
    (max1.z < min2.z) ||
    (min1.z > max2.z)) {
    return IntersectionType.Disjoint
  }
  if (
    (min1.x <= min2.x) &&
    (max1.x >= max2.x) &&
    (min1.y <= min2.y) &&
    (max1.y >= max2.y) &&
    (min1.z <= min2.z) &&
    (max1.z >= max2.z)) {
    return IntersectionType.Contains
  }
  return IntersectionType.Intersects
}

/**
 * Checks whether a box contains a sphere volume
 *
 * @public
 * @param min - the min point of the box
 * @param max - the max point of the box
 * @param center - the sphere center
 * @param radius - the sphere radius
 */
export function boxContainsSphere(min: IVec3, max: IVec3, center: IVec3, radius: number): IntersectionType {
  const vector = Vec3.clamp(center, min, max, v3temp1)
  const distance = Vec3.distanceSquared(center, vector)
  if (distance > radius * radius) {
    return IntersectionType.Disjoint
  }
  if (((min.x + radius) > center.x) || (center.x > (max.x - radius)) || ((max.x - min.x) <= radius) ||
      ((min.y + radius) > center.y) || (center.y > (max.y - radius)) || ((max.y - min.y) <= radius) ||
      ((min.z + radius) > center.z) || (center.z > (max.z - radius)) || ((max.z - min.z) <= radius)) {
    return IntersectionType.Intersects
  }
  return IntersectionType.Contains
}

/**
 * Checks whether a box contains a capsule volume
 *
 * @public
 * @param boxMin - the min point of the box
 * @param boxMax - the max point of the box
 * @param capsuleStart - the capsule start point
 * @param capsuleEnd - the capsule end point
 * @param capsuleR - the capsule radius
 */
export function boxContainsCapsule(
  boxMin: IVec3,
  boxMax: IVec3,
  capsuleStart: IVec3,
  capsuleEnd: IVec3,
  capsuleR: number,
) {
  if (!boxIntersectsCapsule(
    boxMin,
    boxMax,
    capsuleStart,
    capsuleEnd,
    capsuleR)
  ) {
    return IntersectionType.Disjoint
  }
  const c1 = boxContainsSphere(boxMin, boxMax, capsuleStart, capsuleR)
  const c2 = boxContainsSphere(boxMin, boxMax, capsuleEnd, capsuleR)
  return c1 === c2 ? c1 : IntersectionType.Intersects
}

/**
 * Checks whether a box contains a frustum volume
 *
 * @public
 * @param min - the min point of the box
 * @param max - the max point of the box
 * @param frustum - the frustum volume
 */
export function boxContainsFrustum(min: IVec3, max: IVec3, frustum: BoundingFrustum): IntersectionType {
  let inside = 0
  let outside = 0
  for (const point of frustum.corners) {
    if (min.x > point.x || point.x > max.x ||
        min.y > point.y || point.y > max.y ||
        min.z > point.z || point.z > max.z) {
      outside++
    } else {
      inside++
    }
  }
  if (inside === frustum.corners.length) {
    return IntersectionType.Contains
  }
  if (outside === frustum.corners.length) {
    return IntersectionType.Disjoint
  }
  return IntersectionType.Intersects
}

/**
 * Checks whether a sphere contains a box volume
 *
 * @public
 * @param center - the sphere center
 * @param radius - the sphere radius
 * @param min - the min point of the box volume
 * @param max - the max point of the box volume
 */
export function sphereContainsBox(center: IVec3, radius: number, min: IVec3, max: IVec3): IntersectionType {
  if (!boxIntersectSphere(min, max, center, radius)) {
    return IntersectionType.Disjoint
  }
  const r2 = radius * radius
  let vecX = center.x - min.x
  let vecY = center.y - max.y
  let vecZ = center.z - max.z
  if ((vecX * vecX + vecY * vecY + vecZ * vecZ) > r2) {
    return IntersectionType.Intersects
  }
  vecX = center.x - max.x
  vecY = center.y - max.y
  vecZ = center.z - max.z
  if ((vecX * vecX + vecY * vecY + vecZ * vecZ) > r2) {
    return IntersectionType.Intersects
  }
  vecX = center.x - max.x
  vecY = center.y - min.y
  vecZ = center.z - max.z
  if ((vecX * vecX + vecY * vecY + vecZ * vecZ) > r2) {
    return IntersectionType.Intersects
  }
  vecX = center.x - min.x
  vecY = center.y - min.y
  vecZ = center.z - max.z
  if ((vecX * vecX + vecY * vecY + vecZ * vecZ) > r2) {
    return IntersectionType.Intersects
  }
  vecX = center.x - min.x
  vecY = center.y - max.y
  vecZ = center.z - min.z
  if ((vecX * vecX + vecY * vecY + vecZ * vecZ) > r2) {
    return IntersectionType.Intersects
  }
  vecX = center.x - max.x
  vecY = center.y - max.y
  vecZ = center.z - min.z
  if ((vecX * vecX + vecY * vecY + vecZ * vecZ) > r2) {
    return IntersectionType.Intersects
  }
  vecX = center.x - max.x
  vecY = center.y - min.y
  vecZ = center.z - min.z
  if ((vecX * vecX + vecY * vecY + vecZ * vecZ) > r2) {
    return IntersectionType.Intersects
  }
  vecX = center.x - min.x
  vecY = center.y - min.y
  vecZ = center.z - min.z
  if ((vecX * vecX + vecY * vecY + vecZ * vecZ) > r2) {
    return IntersectionType.Intersects
  }
  return IntersectionType.Contains
}

/**
 * Checks whether a sphere contains another sphere volume
 *
 * @public
 * @param c1 - the sphere center
 * @param r1 - the sphere radius
 * @param c2 - the other sphere center
 * @param r2 - the other sphere radius
 */
export function sphereContainsSphere(c1: IVec3, r1: number, c2: IVec3, r2: number): IntersectionType {
  const distance = Vec3.distance(c1, c2)
  if (r1 + r2 < distance) {
    return IntersectionType.Disjoint
  }
  if (r1 - r2 < distance) {
    return IntersectionType.Intersects
  }
  return IntersectionType.Contains
}

/**
 * Checks whether a sphere contains a capsule volume
 *
 * @public
 * @param sphereCenter - the sphere center
 * @param sphereRadius - the sphere radius
 * @param capsuleStart - the capsule start point
 * @param capsuleEnd - the capsule end point
 * @param capsuleRadius - the capsule radius
 */
export function sphereContainsCapsule(
  sphereCenter: IVec3,
  sphereRadius: number,
  capsuleStart: IVec3,
  capsuleEnd: IVec3,
  capsuleRadius: number,
): IntersectionType {
  if (!sphereIntersectsCapsule(sphereCenter, sphereRadius, capsuleStart, capsuleEnd, capsuleRadius)) {
    return IntersectionType.Disjoint
  }
  const c1 = sphereContainsSphere(sphereCenter, sphereRadius, capsuleStart, capsuleRadius)
  const c2 = sphereContainsSphere(sphereCenter, sphereRadius, capsuleEnd, capsuleRadius)
  return c1 === c2 ? c1 : IntersectionType.Intersects
}

/**
 * Checks whether a sphere contains a frustum volume
 *
 * @public
 * @param center - the sphere center
 * @param radius - the sphere radius
 * @param frustum - the frustum
 */
export function sphereContainsFrustum(center: IVec3, radius: number, frustum: BoundingFrustum): IntersectionType {
  const r2 = radius * radius
  let inside = 0
  let outside = 0
  for (const point of frustum.corners) {
    const d2 = Vec3.distanceSquared(point, center)
    if (d2 - r2 <= Number.EPSILON) {
      inside++
    } else {
      outside++
    }
  }
  if (inside === frustum.corners.length) {
    return IntersectionType.Contains
  }
  if (outside === frustum.corners.length) {
    return IntersectionType.Disjoint
  }
  return IntersectionType.Intersects
}

/**
 * Checks whether a frustum contains a sphere volume
 *
 * @public
 * @param frustum - the frustum
 * @param center - the sphere center
 * @param radius - the sphere radius
 */
export function frustumContainsSphere(frustum: BoundingFrustum, center: IVec3, radius: number): IntersectionType {
  let plane: IVec4
  let planes = frustum.planes
  let result = IntersectionType.Contains
  for (let i = 0; i < planes.length; i++) {
    plane = planes[i]
    const d = plane.x * center.x + plane.y * center.y + plane.z * center.z + plane.w
    if (d > radius) {
      return IntersectionType.Disjoint
    }
    if (d < -radius) {
      result = IntersectionType.Intersects
    }
  }
  return result
}

/**
 * Checks whether a frustum contains a box volume
 *
 * @public
 * @param frustum - the frustum
 * @param min - the min point of the box volume
 * @param max - the max point of the box volume
 */
export function frustumContainsBox(frustum: BoundingFrustum, min: IVec3, max: IVec3): IntersectionType {
  let result = IntersectionType.Contains
  for (let i = 0; i < 6; i++) {
    const side = planeIntersectsBox(frustum.planes[i], min, max)
    if (side === PlaneIntersectionType.Front) {
      return IntersectionType.Disjoint
    }
    if (side === PlaneIntersectionType.Intersects) {
      result = IntersectionType.Intersects
    }
  }
  return result
}
