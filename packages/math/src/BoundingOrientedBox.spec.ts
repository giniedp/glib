import { describe, expect, it } from 'vitest'
import { BoundingBox } from './BoundingBox'
import { BoundingOrientedBox } from './BoundingOrientedBox'
import { BoundingSphere } from './BoundingSphere'
import { mat4CreateFromRTS } from './Mat4'
import { quatCreateAxisAngle } from './Quat'
import { rayCreate } from './Ray'
import { IVec3 } from './Types'
import { vec3 } from './Vec3'

describe('BoundingOrientedBox', () => {
  function expectVec3(v: IVec3, x: number, y: number, z: number) {
    expect(v.x, 'x component').toBeCloseTo(x, 6)
    expect(v.y, 'y component').toBeCloseTo(y, 6)
    expect(v.z, 'z component').toBeCloseTo(z, 6)
  }

  // unit cube (half extents 1) rotated by 45° around y
  function rotatedCube(position = vec3(0), scale = vec3(1)) {
    const transform = mat4CreateFromRTS(quatCreateAxisAngle(vec3(0, 1, 0), Math.PI / 4), position, scale)
    return BoundingOrientedBox.createFromBox(new BoundingBox(-1, -1, -1, 1, 1, 1), transform)
  }

  describe('.create', () => {
    it('initializes axis aligned', () => {
      const box = BoundingOrientedBox.create(vec3(1, 2, 3), vec3(4, 5, 6))
      expectVec3(box.center, 1, 2, 3)
      expectVec3(box.halfExtents, 4, 5, 6)
      expectVec3(box.axisX, 1, 0, 0)
      expectVec3(box.axisY, 0, 1, 0)
      expectVec3(box.axisZ, 0, 0, 1)
    })
  })

  describe('#initFrom', () => {
    it('copies all components', () => {
      const box = BoundingOrientedBox.createFrom(rotatedCube(vec3(1, 2, 3)))
      expectVec3(box.center, 1, 2, 3)
      expectVec3(box.halfExtents, 1, 1, 1)
      expectVec3(box.axisX, Math.SQRT1_2, 0, -Math.SQRT1_2)
    })
  })

  describe('#initFromBox', () => {
    it('keeps the box without transform', () => {
      const box = BoundingOrientedBox.createFromBox(new BoundingBox(0, 0, 0, 2, 4, 6))
      expectVec3(box.center, 1, 2, 3)
      expectVec3(box.halfExtents, 1, 2, 3)
      expectVec3(box.axisX, 1, 0, 0)
    })

    it('applies translation, rotation and scale', () => {
      const box = rotatedCube(vec3(10, 0, 0), vec3(2, 3, 4))
      expectVec3(box.center, 10, 0, 0)
      expectVec3(box.halfExtents, 2, 3, 4)
      expectVec3(box.axisX, Math.SQRT1_2, 0, -Math.SQRT1_2)
      expectVec3(box.axisY, 0, 1, 0)
      expectVec3(box.axisZ, Math.SQRT1_2, 0, Math.SQRT1_2)
    })

    it('transforms an off center box', () => {
      const transform = mat4CreateFromRTS(quatCreateAxisAngle(vec3(0, 1, 0), Math.PI / 2), vec3(0), vec3(1))
      const box = BoundingOrientedBox.createFromBox(new BoundingBox(1, -1, -1, 3, 1, 1), transform)
      expectVec3(box.center, 0, 0, -2)
    })
  })

  describe('#getBoundingBox', () => {
    it('encloses the rotated box', () => {
      const result = rotatedCube().getBoundingBox()
      expectVec3(result.min, -Math.SQRT2, -1, -Math.SQRT2)
      expectVec3(result.max, Math.SQRT2, 1, Math.SQRT2)
    })
  })

  describe('#closestPoint', () => {
    it('returns the point itself if inside', () => {
      expectVec3(rotatedCube().closestPoint(vec3(0.5, 0.5, 0)), 0.5, 0.5, 0)
    })
    it('returns the corner', () => {
      expectVec3(rotatedCube().closestPoint(vec3(5, 5, 0)), Math.SQRT2, 1, 0)
    })
  })

  describe('#support', () => {
    it('returns the furthest corner', () => {
      expectVec3(BoundingOrientedBox.create(vec3(1, 0, 0), vec3(1, 2, 3)).support(vec3(1, -1, 1)), 2, -2, 3)
      expectVec3(rotatedCube().support(vec3(1, 0, 0)), Math.SQRT2, 1, 0)
    })
  })

  describe('#intersectsPoint', () => {
    it('detects points inside the rotated box', () => {
      const box = rotatedCube()
      expect(box.intersectsPoint(vec3(1.4, 0, 0))).toBe(true)
      expect(box.intersectsPoint(vec3(0, 1, 0))).toBe(true)
    })
    it('rejects points inside the enclosing box but outside the rotated box', () => {
      const box = rotatedCube()
      expect(box.intersectsPoint(vec3(1, 0, 1))).toBe(false)
      expect(box.intersectsPoint(vec3(0, 1.1, 0))).toBe(false)
    })
  })

  describe('#intersectsSphere', () => {
    it('detects touching and overlapping spheres', () => {
      const box = rotatedCube()
      expect(box.intersectsSphere(new BoundingSphere(2.4, 0, 0, 1))).toBe(true)
      expect(box.intersectsSphere(new BoundingSphere(0, 0, 0, 0.1))).toBe(true)
    })
    it('rejects separated spheres', () => {
      const box = rotatedCube()
      expect(box.intersectsSphere(new BoundingSphere(2.5, 0, 0, 1))).toBe(false)
      // inside the enclosing box, but outside the rotated box
      expect(box.intersectsSphere(new BoundingSphere(1.2, 0, 1.2, 0.2))).toBe(false)
    })
  })

  describe('#intersectsRayAt', () => {
    const box = BoundingOrientedBox.create(vec3(0), vec3(1))
    it('returns the entry distance', () => {
      expect(box.intersectsRayAt(rayCreate(vec3(-5, 0, 0), vec3(1, 0, 0)))).toBeCloseTo(4)
      expect(box.intersectsRayAt(rayCreate(vec3(0, 5, 0), vec3(0, -1, 0)))).toBeCloseTo(4)
    })
    it('returns 0 if the ray starts inside', () => {
      expect(box.intersectsRayAt(rayCreate(vec3(0.5, 0, 0), vec3(1, 0, 0)))).toBe(0)
    })
    it('returns NaN if the box is behind the ray', () => {
      expect(box.intersectsRayAt(rayCreate(vec3(5, 0, 0), vec3(1, 0, 0)))).toBeNaN()
    })
    it('returns NaN if the ray misses', () => {
      expect(box.intersectsRayAt(rayCreate(vec3(-5, 2, 0), vec3(1, 0, 0)))).toBeNaN()
      expect(box.intersectsRayAt(rayCreate(vec3(-5, 0, 0), vec3(0, 1, 0)))).toBeNaN()
    })
    it('respects the orientation', () => {
      expect(rotatedCube().intersectsRayAt(rayCreate(vec3(-5, 0, 0), vec3(1, 0, 0)))).toBeCloseTo(5 - Math.SQRT2)
      // passes the corner of the enclosing box, misses the rotated box
      expect(rotatedCube().intersectsRayAt(rayCreate(vec3(-5, 0, 1.3), vec3(1, 0, 0)))).toBeCloseTo(5 - (Math.SQRT2 - 1.3))
      expect(rotatedCube().intersectsRayAt(rayCreate(vec3(-5, 0, 1.42), vec3(1, 0, 0)))).toBeNaN()
    })
    it('is true for intersectsRay', () => {
      expect(box.intersectsRay(rayCreate(vec3(-5, 0, 0), vec3(1, 0, 0)))).toBe(true)
      expect(box.intersectsRay(rayCreate(vec3(5, 0, 0), vec3(1, 0, 0)))).toBe(false)
    })
  })
})
