import type { IVec3 } from './Types'
import { vec3 } from './Vec3'

/**
 * A convex shape that can be tested with {@link gjkIntersects}
 *
 * @public
 */
export interface SupportShape {
  /**
   * Writes the point of the shape that is furthest along `direction` into `out`
   *
   * @remarks
   * The direction is not normalized
   */
  support(direction: IVec3, out: IVec3): IVec3
}

const EPSILON = 1e-12

// simplex vertices, index 0 is the most recently added point
const simplex: IVec3[] = [vec3(), vec3(), vec3(), vec3()]
let count = 0

const dir = vec3()
const negDir = vec3()
const pa = vec3()
const pb = vec3()
const point = vec3()
const ab = vec3()
const ac = vec3()
const ad = vec3()
const ao = vec3()
const abc = vec3()
const acd = vec3()
const adb = vec3()
const t1 = vec3()

/**
 * Checks whether two convex shapes intersect, using the Gilbert–Johnson–Keerthi algorithm
 *
 * @remarks
 * Only answers whether the shapes overlap, no penetration depth or contact points are calculated.
 * Shapes that exactly touch may be reported either way.
 *
 * @public
 * @param a - the first shape
 * @param b - the second shape
 * @param maxIterations - iteration limit. If reached, the shapes are considered intersecting
 */
export function gjkIntersects(a: SupportShape, b: SupportShape, maxIterations = 32): boolean {
  init(dir, 1, 0, 0)
  minkowski(a, b, dir, simplex[0])
  count = 1
  negate(simplex[0], dir)

  for (let i = 0; i < maxIterations; i++) {
    if (lengthSq(dir) < EPSILON) {
      // the origin lies on the simplex
      return true
    }
    minkowski(a, b, dir, point)
    if (dot(point, dir) <= 0) {
      // the new point did not pass the origin, so the origin is outside the minkowski difference
      return false
    }
    pushFront(point)
    if (nextSimplex()) {
      return true
    }
  }
  return true
}

/**
 * Support point of the minkowski difference `a - b`
 */
function minkowski(a: SupportShape, b: SupportShape, d: IVec3, out: IVec3) {
  a.support(d, pa)
  negate(d, negDir)
  b.support(negDir, pb)
  out.x = pa.x - pb.x
  out.y = pa.y - pb.y
  out.z = pa.z - pb.z
}

function nextSimplex(): boolean {
  switch (count) {
    case 2:
      return line()
    case 3:
      return triangle()
    case 4:
      return tetrahedron()
  }
  return false
}

function line(): boolean {
  const [a, b] = simplex
  sub(b, a, ab)
  negate(a, ao)
  if (dot(ab, ao) > 0) {
    // origin is between a and b, search perpendicular to the line towards the origin
    tripleCross(ab, ao, ab, dir)
  } else {
    count = 1
    copy(ao, dir)
  }
  return false
}

function triangle(): boolean {
  const [a, b, c] = simplex
  sub(b, a, ab)
  sub(c, a, ac)
  negate(a, ao)
  cross(ab, ac, abc)

  if (dot(cross(abc, ac, t1), ao) > 0) {
    if (dot(ac, ao) > 0) {
      // keep a, c
      copy(c, simplex[1])
      count = 2
      tripleCross(ac, ao, ac, dir)
      return false
    }
    // keep a, b
    count = 2
    return line()
  }
  if (dot(cross(ab, abc, t1), ao) > 0) {
    // keep a, b
    count = 2
    return line()
  }
  if (dot(abc, ao) > 0) {
    copy(abc, dir)
  } else {
    // swap b and c so the triangle faces the origin
    swap(1, 2)
    negate(abc, dir)
  }
  return false
}

function tetrahedron(): boolean {
  const [a, b, c, d] = simplex
  sub(b, a, ab)
  sub(c, a, ac)
  sub(d, a, ad)
  negate(a, ao)
  cross(ab, ac, abc)
  cross(ac, ad, acd)
  cross(ad, ab, adb)

  if (dot(abc, ao) > 0) {
    // keep a, b, c
    count = 3
    return triangle()
  }
  if (dot(acd, ao) > 0) {
    // keep a, c, d
    copy(c, simplex[1])
    copy(d, simplex[2])
    count = 3
    return triangle()
  }
  if (dot(adb, ao) > 0) {
    // keep a, d, b
    copy(simplex[1], simplex[2])
    copy(d, simplex[1])
    count = 3
    return triangle()
  }
  return true
}

function pushFront(p: IVec3) {
  // rotate the pooled vectors, so the last one is reused for the new point
  const last = simplex[3]
  simplex[3] = simplex[2]
  simplex[2] = simplex[1]
  simplex[1] = simplex[0]
  simplex[0] = last
  copy(p, last)
  count = Math.min(count + 1, 4)
}

function swap(i: number, j: number) {
  const t = simplex[i]
  simplex[i] = simplex[j]
  simplex[j] = t
}

function init(out: IVec3, x: number, y: number, z: number) {
  out.x = x
  out.y = y
  out.z = z
}

function copy(v: IVec3, out: IVec3) {
  out.x = v.x
  out.y = v.y
  out.z = v.z
}

function negate(v: IVec3, out: IVec3) {
  out.x = -v.x
  out.y = -v.y
  out.z = -v.z
}

function sub(a: IVec3, b: IVec3, out: IVec3) {
  out.x = a.x - b.x
  out.y = a.y - b.y
  out.z = a.z - b.z
}

function dot(a: IVec3, b: IVec3) {
  return a.x * b.x + a.y * b.y + a.z * b.z
}

function lengthSq(v: IVec3) {
  return v.x * v.x + v.y * v.y + v.z * v.z
}

function cross(a: IVec3, b: IVec3, out: IVec3) {
  const x = a.y * b.z - a.z * b.y
  const y = a.z * b.x - a.x * b.z
  const z = a.x * b.y - a.y * b.x
  out.x = x
  out.y = y
  out.z = z
  return out
}

/**
 * (a x b) x c
 */
function tripleCross(a: IVec3, b: IVec3, c: IVec3, out: IVec3) {
  cross(a, b, out)
  return cross(out, c, out)
}
