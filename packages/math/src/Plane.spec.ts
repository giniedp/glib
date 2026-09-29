import { describe, expect, it } from 'vitest'
import { BoundingBox } from './BoundingBox'
import { BoundingSphere } from './BoundingSphere'
import {
  PlaneIntersectionType,
  planeBoxIntersection,
  planePointIntersection,
  planeSphereIntersection,
} from './Collision'
import { plane$initNormalDistance, planeCreateNormalDistance, planeDistanceToPoint, planeGetNormal } from './Plane'
import { vec3, vec3$initRandom } from './Vec3'
import { vec4 } from './Vec4'

describe('plane', () => {
  describe('plane$initNormalDistance', () => {
    it('sets normal and distance', () => {
      expect(plane$initNormalDistance(vec4(), vec3(1, 2, 3), 4)).toEqual(vec4(1, 2, 3, 4))
    })
    it('returns out', () => {
      const out = vec4()
      expect(plane$initNormalDistance(out, vec3(1, 2, 3), 4)).toBe(out)
    })
  })

  describe('planecreateNormalDistance', () => {
    it('creates plane', () => {
      expect(planeCreateNormalDistance(vec3(1, 2, 3), 4)).toEqual(vec4(1, 2, 3, 4))
    })
  })

  describe('planegetNormal', () => {
    it('gets normal', () => {
      expect(planeGetNormal(vec4(1, 2, 3, 4))).toEqual(vec3(1, 2, 3))
    })
    it('writes to out', () => {
      const out = vec3()
      expect(planeGetNormal(vec4(1, 2, 3, 4), out)).toBe(out)
      expect(out).toEqual(vec3(1, 2, 3))
    })
  })

  describe('planedistanceToPoint', () => {
    it('calculates signed distance', () => {
      expect(planeDistanceToPoint(vec4(1, 0, 0, -1), vec3(-1, 0, 0))).toBe(-2)
      expect(planeDistanceToPoint(vec4(1, 0, 0, -1), vec3(0, 0, 0))).toBe(-1)
      expect(planeDistanceToPoint(vec4(1, 0, 0, -1), vec3(1, 0, 0))).toBe(0)
      expect(planeDistanceToPoint(vec4(1, 0, 0, -1), vec3(2, 0, 0))).toBe(1)

      expect(planeDistanceToPoint(vec4(0, 1, 0, -1), vec3(0, -1, 0))).toBe(-2)
      expect(planeDistanceToPoint(vec4(0, 1, 0, -1), vec3(0, 0, 0))).toBe(-1)
      expect(planeDistanceToPoint(vec4(0, 1, 0, -1), vec3(0, 1, 0))).toBe(0)
      expect(planeDistanceToPoint(vec4(0, 1, 0, -1), vec3(0, 2, 0))).toBe(1)

      expect(planeDistanceToPoint(vec4(0, 0, 1, -1), vec3(0, 0, -1))).toBe(-2)
      expect(planeDistanceToPoint(vec4(0, 0, 1, -1), vec3(0, 0, 0))).toBe(-1)
      expect(planeDistanceToPoint(vec4(0, 0, 1, -1), vec3(0, 0, 1))).toBe(0)
      expect(planeDistanceToPoint(vec4(0, 0, 1, -1), vec3(0, 0, 2))).toBe(1)
    })
  })

  it('planePointIntersection', () => {
    for (let i = 0; i < 10; i++) {
      const r = 0
      const point = vec3$initRandom(vec3())
      expect(planePointIntersection(vec4(-1, 0, 0, point.x - r - 0.1), point)).toBe(PlaneIntersectionType.Back)
      expect(planePointIntersection(vec4(-1, 0, 0, point.x - r), point)).toBe(PlaneIntersectionType.Intersects)
      expect(planePointIntersection(vec4(-1, 0, 0, point.x), point)).toBe(PlaneIntersectionType.Intersects)
      expect(planePointIntersection(vec4(-1, 0, 0, point.x + r), point)).toBe(PlaneIntersectionType.Intersects)
      expect(planePointIntersection(vec4(-1, 0, 0, point.x + r + 0.1), point)).toBe(PlaneIntersectionType.Front)

      expect(planePointIntersection(vec4(1, 0, 0, -point.x - r - 0.1), point)).toBe(PlaneIntersectionType.Back)
      expect(planePointIntersection(vec4(1, 0, 0, -point.x - r), point)).toBe(PlaneIntersectionType.Intersects)
      expect(planePointIntersection(vec4(1, 0, 0, -point.x), point)).toBe(PlaneIntersectionType.Intersects)
      expect(planePointIntersection(vec4(1, 0, 0, -point.x + r), point)).toBe(PlaneIntersectionType.Intersects)
      expect(planePointIntersection(vec4(1, 0, 0, -point.x + r + 0.1), point)).toBe(PlaneIntersectionType.Front)

      expect(planePointIntersection(vec4(0, -1, 0, point.y - r - 0.1), point)).toBe(PlaneIntersectionType.Back)
      expect(planePointIntersection(vec4(0, -1, 0, point.y - r), point)).toBe(PlaneIntersectionType.Intersects)
      expect(planePointIntersection(vec4(0, -1, 0, point.y), point)).toBe(PlaneIntersectionType.Intersects)
      expect(planePointIntersection(vec4(0, -1, 0, point.y + r), point)).toBe(PlaneIntersectionType.Intersects)
      expect(planePointIntersection(vec4(0, -1, 0, point.y + r + 0.1), point)).toBe(PlaneIntersectionType.Front)

      expect(planePointIntersection(vec4(0, 1, 0, -point.y - r - 0.1), point)).toBe(PlaneIntersectionType.Back)
      expect(planePointIntersection(vec4(0, 1, 0, -point.y - r), point)).toBe(PlaneIntersectionType.Intersects)
      expect(planePointIntersection(vec4(0, 1, 0, -point.y), point)).toBe(PlaneIntersectionType.Intersects)
      expect(planePointIntersection(vec4(0, 1, 0, -point.y + r), point)).toBe(PlaneIntersectionType.Intersects)
      expect(planePointIntersection(vec4(0, 1, 0, -point.y + r + 0.1), point)).toBe(PlaneIntersectionType.Front)

      expect(planePointIntersection(vec4(0, 0, -1, point.z - r - 0.1), point)).toBe(PlaneIntersectionType.Back)
      expect(planePointIntersection(vec4(0, 0, -1, point.z - r), point)).toBe(PlaneIntersectionType.Intersects)
      expect(planePointIntersection(vec4(0, 0, -1, point.z), point)).toBe(PlaneIntersectionType.Intersects)
      expect(planePointIntersection(vec4(0, 0, -1, point.z + r), point)).toBe(PlaneIntersectionType.Intersects)
      expect(planePointIntersection(vec4(0, 0, -1, point.z + r + 0.1), point)).toBe(PlaneIntersectionType.Front)

      expect(planePointIntersection(vec4(0, 0, 1, -point.z - r - 0.1), point)).toBe(PlaneIntersectionType.Back)
      expect(planePointIntersection(vec4(0, 0, 1, -point.z - r), point)).toBe(PlaneIntersectionType.Intersects)
      expect(planePointIntersection(vec4(0, 0, 1, -point.z), point)).toBe(PlaneIntersectionType.Intersects)
      expect(planePointIntersection(vec4(0, 0, 1, -point.z + r), point)).toBe(PlaneIntersectionType.Intersects)
      expect(planePointIntersection(vec4(0, 0, 1, -point.z + r + 0.1), point)).toBe(PlaneIntersectionType.Front)
    }
  })

  it('planeSphereIntersection', () => {
    for (let i = 0; i < 10; i++) {
      const sphere = BoundingSphere.create(Math.random(), Math.random(), Math.random(), 0.1 + Math.random())
      const r = sphere.radius
      const e = 0.000001
      expect(planeSphereIntersection(vec4(-1, 0, 0, sphere.center.x - r - e), sphere.center, sphere.radius)).toBe(
        PlaneIntersectionType.Back,
      )
      expect(planeSphereIntersection(vec4(-1, 0, 0, sphere.center.x - r + e), sphere.center, sphere.radius)).toBe(
        PlaneIntersectionType.Intersects,
      )
      expect(planeSphereIntersection(vec4(-1, 0, 0, sphere.center.x), sphere.center, sphere.radius)).toBe(
        PlaneIntersectionType.Intersects,
      )
      expect(planeSphereIntersection(vec4(-1, 0, 0, sphere.center.x + r - e), sphere.center, sphere.radius)).toBe(
        PlaneIntersectionType.Intersects,
      )
      expect(planeSphereIntersection(vec4(-1, 0, 0, sphere.center.x + r + e), sphere.center, sphere.radius)).toBe(
        PlaneIntersectionType.Front,
      )

      expect(planeSphereIntersection(vec4(1, 0, 0, -sphere.center.x - r - e), sphere.center, sphere.radius)).toBe(
        PlaneIntersectionType.Back,
      )
      expect(planeSphereIntersection(vec4(1, 0, 0, -sphere.center.x - r + e), sphere.center, sphere.radius)).toBe(
        PlaneIntersectionType.Intersects,
      )
      expect(planeSphereIntersection(vec4(1, 0, 0, -sphere.center.x), sphere.center, sphere.radius)).toBe(
        PlaneIntersectionType.Intersects,
      )
      expect(planeSphereIntersection(vec4(1, 0, 0, -sphere.center.x + r - e), sphere.center, sphere.radius)).toBe(
        PlaneIntersectionType.Intersects,
      )
      expect(planeSphereIntersection(vec4(1, 0, 0, -sphere.center.x + r + e), sphere.center, sphere.radius)).toBe(
        PlaneIntersectionType.Front,
      )

      expect(planeSphereIntersection(vec4(0, -1, 0, sphere.center.y - r - e), sphere.center, sphere.radius)).toBe(
        PlaneIntersectionType.Back,
      )
      expect(planeSphereIntersection(vec4(0, -1, 0, sphere.center.y - r + e), sphere.center, sphere.radius)).toBe(
        PlaneIntersectionType.Intersects,
      )
      expect(planeSphereIntersection(vec4(0, -1, 0, sphere.center.y), sphere.center, sphere.radius)).toBe(
        PlaneIntersectionType.Intersects,
      )
      expect(planeSphereIntersection(vec4(0, -1, 0, sphere.center.y + r - e), sphere.center, sphere.radius)).toBe(
        PlaneIntersectionType.Intersects,
      )
      expect(planeSphereIntersection(vec4(0, -1, 0, sphere.center.y + r + e), sphere.center, sphere.radius)).toBe(
        PlaneIntersectionType.Front,
      )

      expect(planeSphereIntersection(vec4(0, 1, 0, -sphere.center.y - r - e), sphere.center, sphere.radius)).toBe(
        PlaneIntersectionType.Back,
      )
      expect(planeSphereIntersection(vec4(0, 1, 0, -sphere.center.y - r + e), sphere.center, sphere.radius)).toBe(
        PlaneIntersectionType.Intersects,
      )
      expect(planeSphereIntersection(vec4(0, 1, 0, -sphere.center.y), sphere.center, sphere.radius)).toBe(
        PlaneIntersectionType.Intersects,
      )
      expect(planeSphereIntersection(vec4(0, 1, 0, -sphere.center.y + r - e), sphere.center, sphere.radius)).toBe(
        PlaneIntersectionType.Intersects,
      )
      expect(planeSphereIntersection(vec4(0, 1, 0, -sphere.center.y + r + e), sphere.center, sphere.radius)).toBe(
        PlaneIntersectionType.Front,
      )

      expect(planeSphereIntersection(vec4(0, 0, -1, sphere.center.z - r - e), sphere.center, sphere.radius)).toBe(
        PlaneIntersectionType.Back,
      )
      expect(planeSphereIntersection(vec4(0, 0, -1, sphere.center.z - r + e), sphere.center, sphere.radius)).toBe(
        PlaneIntersectionType.Intersects,
      )
      expect(planeSphereIntersection(vec4(0, 0, -1, sphere.center.z), sphere.center, sphere.radius)).toBe(
        PlaneIntersectionType.Intersects,
      )
      expect(planeSphereIntersection(vec4(0, 0, -1, sphere.center.z + r - e), sphere.center, sphere.radius)).toBe(
        PlaneIntersectionType.Intersects,
      )
      expect(planeSphereIntersection(vec4(0, 0, -1, sphere.center.z + r + e), sphere.center, sphere.radius)).toBe(
        PlaneIntersectionType.Front,
      )

      expect(planeSphereIntersection(vec4(0, 0, 1, -sphere.center.z - r - e), sphere.center, sphere.radius)).toBe(
        PlaneIntersectionType.Back,
      )
      expect(planeSphereIntersection(vec4(0, 0, 1, -sphere.center.z - r + e), sphere.center, sphere.radius)).toBe(
        PlaneIntersectionType.Intersects,
      )
      expect(planeSphereIntersection(vec4(0, 0, 1, -sphere.center.z), sphere.center, sphere.radius)).toBe(
        PlaneIntersectionType.Intersects,
      )
      expect(planeSphereIntersection(vec4(0, 0, 1, -sphere.center.z + r - e), sphere.center, sphere.radius)).toBe(
        PlaneIntersectionType.Intersects,
      )
      expect(planeSphereIntersection(vec4(0, 0, 1, -sphere.center.z + r + e), sphere.center, sphere.radius)).toBe(
        PlaneIntersectionType.Front,
      )
    }
  })

  it('planeBoxIntersection', () => {
    for (let i = 0; i < 10; i++) {
      const r = Math.random()
      const point = vec3$initRandom(vec3())
      const box = BoundingBox.create(point.x - r, point.y - r, point.z - r, point.x + r, point.y + r, point.z + r)
      expect(planeBoxIntersection(vec4(-1, 0, 0, point.x - r - 0.1), box.min, box.max)).toBe(PlaneIntersectionType.Back)
      expect(planeBoxIntersection(vec4(-1, 0, 0, point.x - r), box.min, box.max)).toBe(PlaneIntersectionType.Intersects)
      expect(planeBoxIntersection(vec4(-1, 0, 0, point.x), box.min, box.max)).toBe(PlaneIntersectionType.Intersects)
      expect(planeBoxIntersection(vec4(-1, 0, 0, point.x + r), box.min, box.max)).toBe(PlaneIntersectionType.Intersects)
      expect(planeBoxIntersection(vec4(-1, 0, 0, point.x + r + 0.1), box.min, box.max)).toBe(
        PlaneIntersectionType.Front,
      )

      expect(planeBoxIntersection(vec4(1, 0, 0, -point.x - r - 0.1), box.min, box.max)).toBe(PlaneIntersectionType.Back)
      expect(planeBoxIntersection(vec4(1, 0, 0, -point.x - r), box.min, box.max)).toBe(PlaneIntersectionType.Intersects)
      expect(planeBoxIntersection(vec4(1, 0, 0, -point.x), box.min, box.max)).toBe(PlaneIntersectionType.Intersects)
      expect(planeBoxIntersection(vec4(1, 0, 0, -point.x + r), box.min, box.max)).toBe(PlaneIntersectionType.Intersects)
      expect(planeBoxIntersection(vec4(1, 0, 0, -point.x + r + 0.1), box.min, box.max)).toBe(
        PlaneIntersectionType.Front,
      )

      expect(planeBoxIntersection(vec4(0, -1, 0, point.y - r - 0.1), box.min, box.max)).toBe(PlaneIntersectionType.Back)
      expect(planeBoxIntersection(vec4(0, -1, 0, point.y - r), box.min, box.max)).toBe(PlaneIntersectionType.Intersects)
      expect(planeBoxIntersection(vec4(0, -1, 0, point.y), box.min, box.max)).toBe(PlaneIntersectionType.Intersects)
      expect(planeBoxIntersection(vec4(0, -1, 0, point.y + r), box.min, box.max)).toBe(PlaneIntersectionType.Intersects)
      expect(planeBoxIntersection(vec4(0, -1, 0, point.y + r + 0.1), box.min, box.max)).toBe(
        PlaneIntersectionType.Front,
      )

      expect(planeBoxIntersection(vec4(0, 1, 0, -point.y - r - 0.1), box.min, box.max)).toBe(PlaneIntersectionType.Back)
      expect(planeBoxIntersection(vec4(0, 1, 0, -point.y - r), box.min, box.max)).toBe(PlaneIntersectionType.Intersects)
      expect(planeBoxIntersection(vec4(0, 1, 0, -point.y), box.min, box.max)).toBe(PlaneIntersectionType.Intersects)
      expect(planeBoxIntersection(vec4(0, 1, 0, -point.y + r), box.min, box.max)).toBe(PlaneIntersectionType.Intersects)
      expect(planeBoxIntersection(vec4(0, 1, 0, -point.y + r + 0.1), box.min, box.max)).toBe(
        PlaneIntersectionType.Front,
      )

      expect(planeBoxIntersection(vec4(0, 0, -1, point.z - r - 0.1), box.min, box.max)).toBe(PlaneIntersectionType.Back)
      expect(planeBoxIntersection(vec4(0, 0, -1, point.z - r), box.min, box.max)).toBe(PlaneIntersectionType.Intersects)
      expect(planeBoxIntersection(vec4(0, 0, -1, point.z), box.min, box.max)).toBe(PlaneIntersectionType.Intersects)
      expect(planeBoxIntersection(vec4(0, 0, -1, point.z + r), box.min, box.max)).toBe(PlaneIntersectionType.Intersects)
      expect(planeBoxIntersection(vec4(0, 0, -1, point.z + r + 0.1), box.min, box.max)).toBe(
        PlaneIntersectionType.Front,
      )

      expect(planeBoxIntersection(vec4(0, 0, 1, -point.z - r - 0.1), box.min, box.max)).toBe(PlaneIntersectionType.Back)
      expect(planeBoxIntersection(vec4(0, 0, 1, -point.z - r), box.min, box.max)).toBe(PlaneIntersectionType.Intersects)
      expect(planeBoxIntersection(vec4(0, 0, 1, -point.z), box.min, box.max)).toBe(PlaneIntersectionType.Intersects)
      expect(planeBoxIntersection(vec4(0, 0, 1, -point.z + r), box.min, box.max)).toBe(PlaneIntersectionType.Intersects)
      expect(planeBoxIntersection(vec4(0, 0, 1, -point.z + r + 0.1), box.min, box.max)).toBe(
        PlaneIntersectionType.Front,
      )
    }
  })
})
