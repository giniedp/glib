import { describe, expect, it } from 'vitest'
import { BoundingBox } from './BoundingBox'
import { BoundingCylinder } from './BoundingCylinder'
import { BoundingOrientedBox } from './BoundingOrientedBox'
import { BoundingSphere } from './BoundingSphere'
import { gjkIntersects } from './Gjk'
import { mat4CreateFromRTS } from './Mat4'
import { quatCreateYawPitchRoll } from './Quat'
import { IVec3 } from './Types'
import { vec3 } from './Vec3'

describe('gjkIntersects', () => {
  function box(position: IVec3, halfExtents = vec3(1), yaw = 0, pitch = 0, roll = 0) {
    const transform = mat4CreateFromRTS(quatCreateYawPitchRoll(yaw, pitch, roll), position, halfExtents)
    return BoundingOrientedBox.createFromBox(new BoundingBox(-1, -1, -1, 1, 1, 1), transform)
  }

  function cylinder(position: IVec3, radius = 1, height = 2, yaw = 0, pitch = 0, roll = 0) {
    const transform = mat4CreateFromRTS(quatCreateYawPitchRoll(yaw, pitch, roll), position, vec3(1))
    return new BoundingCylinder().initFromTransform(vec3(0), radius, height, transform)
  }

  describe('box - box', () => {
    it('detects overlap', () => {
      expect(gjkIntersects(box(vec3(0)), box(vec3(1.9, 0, 0)))).toBe(true)
      expect(gjkIntersects(box(vec3(0)), box(vec3(1.9, 1.9, 1.9)))).toBe(true)
    })
    it('rejects separated boxes', () => {
      expect(gjkIntersects(box(vec3(0)), box(vec3(2.1, 0, 0)))).toBe(false)
      expect(gjkIntersects(box(vec3(0)), box(vec3(0, -5, 0)))).toBe(false)
    })
    it('detects nested boxes', () => {
      expect(gjkIntersects(box(vec3(0), vec3(5)), box(vec3(1, 1, 1)))).toBe(true)
      expect(gjkIntersects(box(vec3(1, 1, 1)), box(vec3(0), vec3(5)))).toBe(true)
    })
    it('detects identical boxes', () => {
      expect(gjkIntersects(box(vec3(0)), box(vec3(0)))).toBe(true)
    })
    it('respects the orientation', () => {
      // rotated by 45° the box reaches sqrt(2) along x
      expect(gjkIntersects(box(vec3(0), vec3(1), Math.PI / 4), box(vec3(2.35, 0, 0)))).toBe(true)
      expect(gjkIntersects(box(vec3(0), vec3(1), Math.PI / 4), box(vec3(2.45, 0, 0)))).toBe(false)
    })
    it('handles edge to edge configurations', () => {
      const a = box(vec3(0), vec3(1), Math.PI / 4, 0, 0)
      const b = box(vec3(0, 0, 0), vec3(1), 0, Math.PI / 4, 0)
      // a reaches 1 up, the pitched b reaches sqrt(2) down
      b.center.y = 2.3
      expect(gjkIntersects(a, b)).toBe(true)
      b.center.y = 2.5
      expect(gjkIntersects(a, b)).toBe(false)
    })
    it('handles a degenerate (flat) box', () => {
      expect(gjkIntersects(box(vec3(0), vec3(1, 0, 1)), box(vec3(0.5, 0, 0.5)))).toBe(true)
      expect(gjkIntersects(box(vec3(0), vec3(1, 0, 1)), box(vec3(0, 1.5, 0)))).toBe(false)
    })
  })

  describe('cylinder - cylinder', () => {
    it('detects side by side overlap', () => {
      expect(gjkIntersects(cylinder(vec3(0)), cylinder(vec3(1.9, 0, 0)))).toBe(true)
      expect(gjkIntersects(cylinder(vec3(0)), cylinder(vec3(2.1, 0, 0)))).toBe(false)
    })
    it('uses the round side, not the enclosing box', () => {
      // boxes overlap along the diagonal, cylinders do not
      expect(gjkIntersects(cylinder(vec3(0)), cylinder(vec3(1.5, 0, 1.5)))).toBe(false)
      expect(gjkIntersects(cylinder(vec3(0)), cylinder(vec3(1.3, 0, 1.3)))).toBe(true)
    })
    it('detects stacked cylinders', () => {
      expect(gjkIntersects(cylinder(vec3(0)), cylinder(vec3(0, 1.9, 0)))).toBe(true)
      expect(gjkIntersects(cylinder(vec3(0)), cylinder(vec3(0, 2.1, 0)))).toBe(false)
    })
    it('detects crossing cylinders', () => {
      const lying = cylinder(vec3(0, 0, 0), 0.5, 6, 0, 0, Math.PI / 2)
      expect(gjkIntersects(cylinder(vec3(0)), lying)).toBe(true)
      lying.center.y = 1.6
      expect(gjkIntersects(cylinder(vec3(0)), lying)).toBe(false)
    })
  })

  describe('box - cylinder', () => {
    it('detects the cylinder at the box corner', () => {
      expect(gjkIntersects(box(vec3(0)), cylinder(vec3(1.6, 0, 1.6)))).toBe(true)
      expect(gjkIntersects(box(vec3(0)), cylinder(vec3(1.9, 0, 1.9)))).toBe(false)
    })
    it('detects the cylinder at the box face', () => {
      expect(gjkIntersects(box(vec3(0)), cylinder(vec3(1.9, 0, 0)))).toBe(true)
      expect(gjkIntersects(cylinder(vec3(1.9, 0, 0)), box(vec3(0)))).toBe(true)
      expect(gjkIntersects(box(vec3(0)), cylinder(vec3(2.1, 0, 0)))).toBe(false)
    })
    it('is available as method', () => {
      expect(box(vec3(0)).intersectsCylinder(cylinder(vec3(1.9, 0, 0)))).toBe(true)
      expect(cylinder(vec3(1.9, 0, 0)).intersectsOrientedBox(box(vec3(0)))).toBe(true)
      expect(box(vec3(0)).intersectsOrientedBox(box(vec3(3, 0, 0)))).toBe(false)
      expect(cylinder(vec3(0)).intersectsCylinder(cylinder(vec3(3, 0, 0)))).toBe(false)
    })
  })

  describe('agrees with the exact sphere tests', () => {
    // deterministic pseudo random numbers
    let seed = 42
    const random = (min: number, max: number) => {
      seed = (seed * 16807) % 2147483647
      return min + ((seed - 1) / 2147483646) * (max - min)
    }
    const angle = () => random(0, Math.PI * 2)
    const point = () => vec3(random(-3, 3), random(-3, 3), random(-3, 3))

    it('sphere - box', () => {
      let mismatches = 0
      for (let i = 0; i < 2000; i++) {
        const b = box(point(), vec3(random(0.1, 2), random(0.1, 2), random(0.1, 2)), angle(), angle(), angle())
        const s = new BoundingSphere(random(-4, 4), random(-4, 4), random(-4, 4), random(0.1, 2))
        // skip configurations that are too close to touching
        const p = b.closestPoint(s.center)
        const d = Math.hypot(p.x - s.center.x, p.y - s.center.y, p.z - s.center.z)
        if (Math.abs(d - s.radius) < 1e-4) {
          continue
        }
        if (gjkIntersects(b, s) !== b.intersectsSphere(s)) {
          mismatches++
        }
      }
      expect(mismatches).toBe(0)
    })

    it('sphere - cylinder', () => {
      let mismatches = 0
      for (let i = 0; i < 2000; i++) {
        const c = cylinder(point(), random(0.1, 2), random(0.1, 4), angle(), angle(), angle())
        const s = new BoundingSphere(random(-4, 4), random(-4, 4), random(-4, 4), random(0.1, 2))
        const p = c.closestPoint(s.center)
        const d = Math.hypot(p.x - s.center.x, p.y - s.center.y, p.z - s.center.z)
        if (Math.abs(d - s.radius) < 1e-4) {
          continue
        }
        if (gjkIntersects(c, s) !== c.intersectsSphere(s)) {
          mismatches++
        }
      }
      expect(mismatches).toBe(0)
    })
  })

  it('reports a sphere support point', () => {
    const p = new BoundingSphere(1, 2, 3, 2).support(vec3(0, 0, 5))
    expect(p.x).toBeCloseTo(1)
    expect(p.y).toBeCloseTo(2)
    expect(p.z).toBeCloseTo(5)
  })
})
