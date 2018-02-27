import { BoundingFrustum } from './BoundingFrustum'
import { Recycler } from './Recycler'
import { IVec2, IVec3, IVec4 } from './Types'
import { Vec2 } from './Vec2'
import { Vec3 } from './Vec3'

export const DISJOINT = 0
export const INTERSECTS = 1
export const CONTAINS = 2

const EPSILON = Number.EPSILON

const recycle = new Recycler<IVec4>(20, () => {
  return { x: 0, y: 0, z: 0, w: 0 }
})

// Real Time Collision Detection Chapter 5.1.1 page 127
export function closestPointToPlane(point: IVec3, plane: IVec4, result: IVec3): void {
  const t = Vec3.dot(plane, point) - plane.w
  result.x = point.x - plane.x * t
  result.y = point.y - plane.y * t
  result.z = point.z - plane.z * t
}

// Real Time Collision Detection Chapter 5.1.1 page 127
export function distancePointToPlane(point: IVec3, plane: IVec4): number {
  return Vec3.dot(plane, point) - plane.w
}

// Real Time Collision Detection Chapter 5.1.2 page 128
export function closestPointSegment(point: IVec3, a: IVec3, b: IVec3, out: IVec3): void {
  recycle.begin()

  const ab = Vec3.subtract(b, a, recycle.next())
  // project c onto ab, computing parametrized poition d(t) = a + t * (b - a)
  const ac = Vec3.subtract(point, a, recycle.next())
  let t = Vec3.dot(ac, ab) / Vec3.lengthSquared(ab)
  // if outside segment, clamp t (and therefore d) to closest endpoint
  t = t < 0.0 ? 0.0 : (t > 1.0 ? 1.0 : t)
  // compute projected position from the clamped t
  out.x = a.x + t * ab.x
  out.y = a.y + t * ab.y
  out.z = a.z + t * ab.z

  recycle.end()
}

// Real Time Collision Detection Chapter 5.1.3 page 130
export function squaredDistancePointSegment(a: IVec3, b: IVec3, c: IVec3): number {
  recycle.begin()

  const ab = Vec3.subtract(b, a, recycle.next())
  const ac = Vec3.subtract(c, a, recycle.next())
  const bc = Vec3.subtract(c, b, recycle.next())
  let result

  const e = Vec3.dot(ac, ab)
  // handle cases where c projects outside ab
  if (e < 0.0) {
    result = Vec3.lengthSquared(ac)
    return recycle.end(result)
  }

  const f = Vec3.lengthSquared(ab)
  if (e >= f) {
    result = Vec3.lengthSquared(bc)
    return recycle.end(result)
  }

  // handle cases where c projects onto ab
  result = Vec3.lengthSquared(ac) - e * e / f
  return recycle.end(result)
}

export function closestPointTriangle(point: IVec3, a: IVec3, b: IVec3, c: IVec3, result: IVec3): IVec3 {
  recycle.begin()

  const ab = Vec3.subtract(b, a, recycle.next())
  const ac = Vec3.subtract(c, a, recycle.next())
  const ap = Vec3.subtract(point, a, recycle.next())
  const d1 = Vec3.dot(ab, ap)
  const d2 = Vec3.dot(ac, ap)
  if (d1 <= 0 && d2 <= 0) {
    // barycentric coordinates (1, 0, 0)
    result.x = a.x
    result.y = a.y
    result.z = a.z
    return recycle.end(result)
  }

  const bp = Vec3.subtract(point, b, recycle.next())
  const d3 = Vec3.dot(ab, bp)
  const d4 = Vec3.dot(ac, bp)
  if (d3 <= 0 && d4 <= 0) {
    // barycentric coordinates (0, 1, 0)
    result.x = b.x
    result.y = b.y
    result.z = b.z
    return recycle.end(result)
  }

  const vc = d1 * d4 - d3 * d2
  if (vc <= 0 && d1 >= 0 && d3 <= 0) {
    const w = d1 / (d1 - d3)
    result.x = a.x + w * ab.x
    result.y = a.y + w * ab.y
    result.z = a.z + w * ab.z
    return recycle.end(result)
  }

  const cp = Vec3.subtract(point, c, recycle.next())
  const d5 = Vec3.dot(ab, cp)
  const d6 = Vec3.dot(ac, cp)
  if (d5 <= 0 && d6 <= 0) {
    // barycentric coordinates (0, 0, 1)
    result.x = c.x
    result.y = c.y
    result.z = c.z
    return recycle.end(result)
  }

  const vb = d5 * d2 - d1 * d6
  if (vb <= 0 && d2 >= 0 && d6 <= 0) {
    const w = d2 / (d2 - d6)
    result.x = a.x + w * ac.x
    result.y = a.y + w * ac.y
    result.z = a.z + w * ac.z
    return recycle.end(result)
  }

  const va = d3 * d6 - d5 * d4
  if (va <= 0 && (d4 - d3) >= 0 && (d5 - d6) >= 0) {
    const w = (d4 - d3) / ((d4 - d3) + (d5 - d6))
    result.x = b.x + w * (c.x - b.x)
    result.y = b.y + w * (c.y - b.y)
    result.z = b.z + w * (c.z - b.z)
    return recycle.end(result)
  }

  const denom = 1 / (va + vb + vc)
  result.x = a.x + ab.x * vb * denom + ac.x * vc * denom
  result.y = a.y + ab.y * vb * denom + ac.y * vc * denom
  result.z = a.z + ab.z * vb * denom + ac.z * vc * denom
  return recycle.end(result)
}

//
// rayIntersects[TYPE](At)
//

export function rayIntersectsPlane(orig: IVec3, dir: IVec3, plane: IVec4): boolean {
  return ((plane.w - Vec3.dot(plane, orig)) / Vec3.dot(plane, dir)) >= 0
}

export function rayIntersectsPlaneAt(orig: IVec3, dir: IVec3, plane: IVec4): number {
  return (plane.w - Vec3.dot(plane, orig)) / Vec3.dot(plane, dir)
}

export function rayIntersectsSphere(orig: IVec3, dir: IVec3, center: IVec3, radius: number): boolean {
  recycle.begin()

  const m = Vec3.subtract(orig, center, recycle.next())
  const c = Vec3.dot(m, m) - radius * radius
  // if there is definitely at least one real root, there must be an intersection
  if (c <= 0) {
    return recycle.end(true)
  }

  const b = Vec3.dot(m, dir)
  // exit if rays origin outside sphere and ray pointing away from sphere
  if (b > 0) {
    return recycle.end(false)
  }

  // a negative discriminant corresponds to ray missing sphere
  return recycle.end((b * b - c) >= 0)
}

export function rayIntersectsSphereAt(orig: IVec3, dir: IVec3, center: IVec3, radius: number): number {
  recycle.begin()

  const m = Vec3.subtract(orig, center, recycle.next())
  const b = Vec3.dot (m, dir)
  const c = Vec3.dot(m, m) - radius * radius
  // exit if rays origin outside sphere (c < 0) and ray pointing away from sphere (b > 0)
  if (c > 0 && b > 0) {
    return recycle.end(Number.NaN)
  }

  const discr = b * b - c
  // negative discriminant corresponds to ray missing sphere
  if (discr < 0) {
    return recycle.end(Number.NaN)
  }
  // Ray now found to intersect sphere, compute smallest t value of intersection
  const result = -b - Math.sqrt(discr)
  // If t is negative, ray started inside sphere , so clamp to zero
  return recycle.end(result < 0 ? 0 : result)
}

export function rayIntersectsBox(rayPos: IVec3, rayDir: IVec3, boxMin: IVec3, boxMax: IVec3): boolean {
  return rayIntersectsBoxAt(rayPos, rayDir, boxMin, boxMax) >= 0
}

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

export function rayIntersectsTriangle(orig: IVec3, dir: IVec3, v0: IVec3, v1: IVec3, v2: IVec3): boolean {
  recycle.begin()
  const edge1 = Vec3.subtract(v1, v0, recycle.next())
  const edge2 = Vec3.subtract(v2, v0, recycle.next())

  // Compute triangle normal.
  const n = Vec3.cross(edge1, edge2, recycle.next())

  // Compute denominator d. If d <= 0, segment is parallel to or points away from triangle
  const d = Vec3.dot(dir, n)
  if (d < Number.EPSILON) {
    return recycle.end(false)
  }

  // Compute intersection t value of pq with plane of triangle. A ray intersects if t >= 0
  const ap = Vec3.subtract(orig, v0, recycle.next())
  const result = Vec3.dot(ap, n)
  if (result < 0) {
    return recycle.end(false)
  }

  // Compute barycentric coordinate components and tes if within bounds
  const e = Vec3.cross(dir, ap, recycle.next())
  const v = Vec3.dot(edge2, e)
  if (v < 0 || v > d) {
    return recycle.end(false)
  }
  const w = -Vec3.dot(edge1, e)
  if (w < 0 || v + w > d) {
    return recycle.end(false)
  }
  return recycle.end(true)
}

export function rayIntersectsTriangleAt(orig: IVec3, dir: IVec3, v0: IVec3, v1: IVec3, v2: IVec3): number {
  recycle.begin()

  const ab = Vec3.subtract(v1, v0, recycle.next())
  const ac = Vec3.subtract(v2, v0, recycle.next())

  // Compute triangle normal.
  const n = Vec3.cross(ab, ac, recycle.next())

  // Compute denominator d. If d <= 0, segment is parallel to or points away from triangle
  const d = Vec3.dot(dir, n)
  if (d <= 0) {
    return recycle.end(Number.POSITIVE_INFINITY)
  }

  // Compute intersection t value of pq with plane of triangle. A ray intersects if t >= 0
  const ap = Vec3.subtract(orig, v0, recycle.next())
  let result = Vec3.dot(ap, n)
  if (result < 0) {
    return recycle.end(Number.NaN)
  }

  // Compute barycentric coordinate components and tes if within bounds
  const e = Vec3.cross(dir, ap, recycle.next())
  const v = Vec3.dot(ac, e)
  if (v < 0 || v > d) {
    return recycle.end(Number.NaN)
  }
  const w = -Vec3.dot(ab, e)
  if (w < 0 || v + w > d) {
    return recycle.end(Number.NaN)
  }

  //
  const ood = 1 / d
  result *= ood
  // compute barycentric
  // v *= ood
  // w *= ood
  // float u = 1f - v - w
  return recycle.end(result)
}

//
// plane[TYPE]Intersection
//

export function planeSphereIntersection(center: IVec3, radius: number, plane: IVec4): number {
  const dist = Vec3.dot(center, plane) - plane.w
  if (dist > radius) {
    // front
    return 1
  }
  if (dist < -radius) {
    // back
    return -1
  }
  // intersects
  return 0
}

export function planePlaneIntersection(plane1: IVec4, plane2: IVec4, position: IVec3, direction: IVec3) {
  recycle.begin()
  Vec3.cross(plane1, plane2, direction)
  const denom = Vec3.lengthSquared(direction)
  if (denom < EPSILON) {
    position.x = 0
    position.y = 0
    position.z = 0
    return recycle.end(false)
  }

  const p1 = Vec3.multiplyScalar(plane2, plane1.w, recycle.next())
  const p2 = Vec3.multiplyScalar(plane1, -plane2.w, recycle.next())
  Vec3.add(p1, p2, position)
  Vec3.cross(position, direction, position)
  Vec3.divideScalar(position, denom, position)

  return recycle.end(true)
}

export function planePlanePlaneIntersection(p1: IVec4, p2: IVec4, p3: IVec4, outPoint?: IVec3): boolean {
  recycle.begin()

  const m1 = recycle.next()
  m1.x = p1.x
  m1.y = p2.x
  m1.z = p3.x

  const m2 = recycle.next()
  m2.x = p1.y
  m2.y = p2.y
  m2.z = p3.y

  const m3 = recycle.next()
  m3.x = p1.z
  m3.y = p2.z
  m3.z = p3.z

  const u = Vec3.cross(m2, m3, recycle.next())
  const denom = Vec3.dot(m1, u)

  if (Math.abs(denom) < EPSILON) {
    outPoint.x = 0
    outPoint.y = 0
    outPoint.z = 0
    return recycle.end(false)
  }

  const d = recycle.next()
  d.x = p1.w
  d.y = p2.w
  d.z = p3.w
  const v = Vec3.cross(m1, d, recycle.next())
  const ood = 1 / denom

  if (outPoint) {
    outPoint.x = Vec3.dot(d, u) * ood
    outPoint.y = Vec3.dot(m3, v) * ood
    outPoint.z = -Vec3.dot(m2, v) * ood
  }

  return recycle.end(true)
}

//
// [TYPE]Intersects[TYPE]
//

export function boxIntersectsPoint(boxMin: IVec3, boxMax: IVec3, point: IVec3): boolean {
  return !(
    boxMin.x > point.x ||
    point.x > boxMax.x ||
    boxMin.y > point.y ||
    point.y > boxMax.y ||
    boxMin.z > point.z ||
    point.z > boxMax.z)
}

export function boxIntersectsPlane(boxMin: IVec3, boxMax: IVec3, plane: IVec4): boolean {
  let pX = plane.x >= 0 ? boxMin.x : boxMax.x
  let pY = plane.y >= 0 ? boxMin.y : boxMax.y
  let pZ = plane.z >= 0 ? boxMin.z : boxMax.z
  let dot = plane.x * pX + plane.y * pY + plane.z * pZ

  if (dot + plane.w > 0) {
      return false
  }

  pX = plane.x >= 0 ? boxMax.x : boxMin.x
  pY = plane.y >= 0 ? boxMax.y : boxMin.y
  pZ = plane.z >= 0 ? boxMax.z : boxMin.z

  dot = plane.x * pX + plane.y * pY + plane.z * pZ

  return (dot + plane.w) >= 0
}

export function boxIntersectSphere(center: IVec3, radius: number, boxMin: IVec3, boxMax: IVec3): boolean {
  recycle.begin()
  const c = Vec3.clamp(center, boxMin, boxMax, recycle.next())
  const d = Vec3.distanceSquared(center, c)
  return recycle.end(d <= (radius * radius))
}

export function boxIntersectBox(box1Min: IVec3, box1Max: IVec3, box2Min: IVec3, box2Max: IVec3): boolean {
    return (box1Max.x >= box2Min.x && box1Min.x <= box2Max.x &&
            box1Max.y >= box2Min.y && box1Min.y <= box2Max.y &&
            box1Max.z >= box2Min.z && box1Min.z <= box2Max.z)
}

export function sphereIntersectsPoint(center: IVec3, radius: number, point: IVec3): boolean {
  return Vec3.distanceSquared(point, center) <= (radius * radius)
}

export function sphereIntersectsPlane(center: IVec3, radius: number, plane: IVec4): boolean {
  const dist = Vec3.dot(center, plane) - plane.w
  return Math.abs(dist) <= radius
}

export function sphereIntersectsSphere(c1: IVec3, r1: number, c2: IVec3, r2: number): boolean {
  // Calculate squared distance between centers
  const d2 = Vec3.distanceSquared(c1, c2)
  // Spheres intersect if squared distance is less than squared sum of radii
  const r = r1 + r2
  return d2 <= (r * r)
}

export function sphereIntersectsTriangle(center: IVec3, radius: number, v0: IVec3, v1: IVec3, v2: IVec3): boolean {
  recycle.begin()
  const p = closestPointTriangle(center, v0, v1, v2, recycle.next())
  Vec3.subtract(p, center, p)
  return recycle.end(Vec3.lengthSquared(p) <= radius * radius)
}

export function frustumIntersectsPoint(frustum: BoundingFrustum, point: IVec3): boolean {
  for (let i = 0; i < 6; i++) {
    const plane = frustum.planes[i]
    const distance = Vec3.dot(plane, point) + plane.w
    if (distance < 0) {
      return false
    }
  }
  return true
}

//
// - box[TYPE]Intersection
//

export function boxBoxIntersection(b1Min: IVec3, b1Max: IVec3, b2Min: IVec3, b2Max: IVec3): number {
  if (
    (b1Max.x < b2Min.x) ||
    (b1Min.x > b2Max.x) ||
    (b1Max.y < b2Min.y) ||
    (b1Min.y > b2Max.y) ||
    (b1Max.z < b2Min.z) ||
    (b1Min.z > b2Max.z)) {
    return DISJOINT
  }
  if (
    (b1Min.x <= b2Min.x) &&
    (b1Max.x >= b2Max.x) &&
    (b1Min.y <= b2Min.y) &&
    (b1Max.y >= b2Max.y) &&
    (b1Min.z <= b2Min.z) &&
    (b1Max.z >= b2Max.z)) {
    return CONTAINS
  }
  return INTERSECTS
}

export function boxSphereIntersection(boxMin: IVec3, boxMax: IVec3, center: IVec3, radius: number): number {
  recycle.begin()
  const vector = Vec3.clamp(center, boxMin, boxMax, recycle.next())
  const distance = Vec3.distanceSquared(center, vector)
  if (distance > radius * radius) {
    return recycle.end(DISJOINT)
  }
  if (((boxMin.x + radius) > center.x) || (center.x > (boxMax.x - radius)) || ((boxMax.x - boxMin.x) <= radius) ||
      ((boxMin.y + radius) > center.y) || (center.y > (boxMax.y - radius)) || ((boxMax.y - boxMin.y) <= radius) ||
      ((boxMin.z + radius) > center.z) || (center.z > (boxMax.z - radius)) || ((boxMax.z - boxMin.z) <= radius)) {
    return recycle.end(INTERSECTS)
  }
  return recycle.end(CONTAINS)
}

export function boxFrustumIntersection(boxMin: IVec3, boxMax: IVec3, frustum: BoundingFrustum): number {
  let inside = 0
  let outside = 0
  for (const point of frustum.corners) {
    if (boxMin.x > point.x || point.x > boxMax.x ||
        boxMin.y > point.y || point.y > boxMax.y ||
        boxMin.z > point.z || point.z > boxMax.z) {
      outside++
    } else {
      inside++
    }
  }
  if (inside === frustum.corners.length) {
    return CONTAINS
  }
  if (outside === frustum.corners.length) {
    return DISJOINT
  }
  return INTERSECTS
}

//
// - sphere[TYPE]Intersection
//

export function sphereBoxIntersection(center: IVec3, radius: number, boxMin: IVec3, boxMax: IVec3): number {
  if (!boxIntersectSphere(center, radius, boxMin, boxMax)) {
    return DISJOINT
  }
  const r2 = radius * radius
  let vecX = center.x - boxMin.x
  let vecY = center.y - boxMax.y
  let vecZ = center.z - boxMax.z
  if ((vecX * vecX + vecY * vecY + vecZ * vecZ) > r2) {
    return INTERSECTS
  }
  vecX = center.x - boxMax.x
  vecY = center.y - boxMax.y
  vecZ = center.z - boxMax.z
  if ((vecX * vecX + vecY * vecY + vecZ * vecZ) > r2) {
    return INTERSECTS
  }
  vecX = center.x - boxMax.x
  vecY = center.y - boxMin.y
  vecZ = center.z - boxMax.z
  if ((vecX * vecX + vecY * vecY + vecZ * vecZ) > r2) {
    return INTERSECTS
  }
  vecX = center.x - boxMin.x
  vecY = center.y - boxMin.y
  vecZ = center.z - boxMax.z
  if ((vecX * vecX + vecY * vecY + vecZ * vecZ) > r2) {
    return INTERSECTS
  }
  vecX = center.x - boxMin.x
  vecY = center.y - boxMax.y
  vecZ = center.z - boxMin.z
  if ((vecX * vecX + vecY * vecY + vecZ * vecZ) > r2) {
    return INTERSECTS
  }
  vecX = center.x - boxMax.x
  vecY = center.y - boxMax.y
  vecZ = center.z - boxMin.z
  if ((vecX * vecX + vecY * vecY + vecZ * vecZ) > r2) {
    return INTERSECTS
  }
  vecX = center.x - boxMax.x
  vecY = center.y - boxMin.y
  vecZ = center.z - boxMin.z
  if ((vecX * vecX + vecY * vecY + vecZ * vecZ) > r2) {
    return INTERSECTS
  }
  vecX = center.x - boxMin.x
  vecY = center.y - boxMin.y
  vecZ = center.z - boxMin.z
  if ((vecX * vecX + vecY * vecY + vecZ * vecZ) > r2) {
    return INTERSECTS
  }
  return CONTAINS
}

export function sphereSphereIntersection(c1: IVec3, r1: number, c2: IVec3, r2: number): number {
  const distance = Vec3.distance(c1, c2)
  if (r1 + r2 < distance) {
    return 0
  }
  if (r1 - r2 < distance) {
    return 1
  }
  return 2
}

export function sphereFrustumIntersection(center: IVec3, radius: number, frustum: BoundingFrustum): number {
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
    return 2
  }
  if (outside === frustum.corners.length) {
    return 0
  }
  return 1
}

//
// - frustum[TYPE]Intersection
//

export function frustumSphereIntersection(frustum: BoundingFrustum, center: IVec3, radius: number): number {
  // assume sphere is inside
  let result = 2

  for (const plane of frustum.planes) {
    const d = Vec3.dot(plane, center) + plane.w
    if (d < -radius) {
      // back -> outside
      return 0
    }
    if (d > radius) {
      // front -> intersects
      result = 1
    }
  }
  return result
}

export function frustumBoxIntersection(frustum: BoundingFrustum, boxMin: IVec3, boxMax: IVec3): number {
  // http://zach.in.tu-clausthal.de/teaching/cg_literatur/lighthouse3d_view_frustum_culling/index.html
  // section: Geometric Approach - Testing Boxes II

  let result = 2 // inside

  // for each plane do ...
  for (let i = 0; i < 6; i++) {
      let plane = frustum.planes[i]

      let pX = plane.x >= 0 ? boxMax.x : boxMin.x
      let pY = plane.y >= 0 ? boxMax.y : boxMin.y
      let pZ = plane.z >= 0 ? boxMax.z : boxMin.z
      let distance = plane.x * pX + plane.y * pY + plane.z * pZ + plane.w
      if (distance < 0) {
        return 0 // outside
      }

      pX = plane.x >= 0 ? boxMin.x : boxMax.x
      pY = plane.y >= 0 ? boxMin.y : boxMax.y
      pZ = plane.z >= 0 ? boxMin.z : boxMax.z
      distance = plane.x * pX + plane.y * pY + plane.z * pZ + plane.w

      if (distance < 0) {
          result = 1 // intersect
      }
  }
  return result
}

//
// - frustumIntersection[TYPE]
//

export function frustumIntersectsSphere(frustum: BoundingFrustum, center: IVec3, radius: number): boolean {
  for (let i = 0; i < 6; i++) {
    const plane = frustum.planes[i]
    const distance = Vec3.dot(plane, center) + plane.w
    if (distance < -radius) {
      // outside
      return false
    }
  }
  return true
}

export function frustumIntersectsBox(frustum: BoundingFrustum, boxMin: IVec3, boxMax: IVec3): boolean {
  // http://zach.in.tu-clausthal.de/teaching/cg_literatur/lighthouse3d_view_frustum_culling/index.html
  // section: Geometric Approach - Testing Boxes II

  let pX
  let pY
  let pZ
  let distance

  // for each plane do ...
  for (const plane of frustum.planes) {
    // build positive vertex as described in link above
    pX = boxMin.x
    pY = boxMin.y
    pZ = boxMin.z
    if (plane.x >= 0) {
      pX = boxMax.x
    }
    if (plane.y >= 0) {
      pY = boxMax.y
    }
    if (plane.z >= 0) {
      pZ = boxMax.z
    }

    // is the positive vertex outside?
    distance = plane.x * pX + plane.y * pY + plane.z * pZ + plane.w
    if (distance < 0) {
      return false
    }
  }
  return true
}

export function frustumIntersectsPlane(frustum: BoundingFrustum, plane: IVec4): boolean {
  let back
  let front
  for (const point of frustum.corners) {
    const d = Vec3.dot(point, plane) + plane.w
    if (d > 0) {
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
