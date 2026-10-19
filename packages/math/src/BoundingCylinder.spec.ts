import { describe, expect, it } from 'vitest'
import { BoundingCylinder } from './BoundingCylinder'
import { BoundingSphere } from './BoundingSphere'
import { mat4CreateFromRTS } from './Mat4'
import { quatCreateAxisAngle } from './Quat'
import { rayCreate } from './Ray'
import { IVec3 } from './Types'
import { vec3 } from './Vec3'

describe('BoundingCylinder', () => {
  function expectVec3(v: IVec3, x: number, y: number, z: number) {
    expect(v.x, 'x component').toBeCloseTo(x, 6)
    expect(v.y, 'y component').toBeCloseTo(y, 6)
    expect(v.z, 'z component').toBeCloseTo(z, 6)
  }

  // radius 1, height 2, centered at origin
  const unit = () => BoundingCylinder.create(vec3(0), 1, 2)

  describe('.create', () => {
    it('initializes y aligned', () => {
      const cylinder = BoundingCylinder.create(vec3(1, 2, 3), 4, 6)
      expectVec3(cylinder.center, 1, 2, 3)
      expectVec3(cylinder.axis, 0, 1, 0)
      expect(cylinder.radius).toBe(4)
      expect(cylinder.halfHeight).toBe(3)
    })
  })

  describe('#initFrom', () => {
    it('copies all components', () => {
      const cylinder = BoundingCylinder.createFrom(BoundingCylinder.create(vec3(1, 2, 3), 4, 6))
      expectVec3(cylinder.center, 1, 2, 3)
      expect(cylinder.radius).toBe(4)
      expect(cylinder.halfHeight).toBe(3)
    })
  })

  describe('#initFromTransform', () => {
    it('applies translation and rotation', () => {
      const transform = mat4CreateFromRTS(quatCreateAxisAngle(vec3(0, 0, 1), -Math.PI / 2), vec3(5, 0, 0), vec3(1))
      const cylinder = new BoundingCylinder().initFromTransform(vec3(0, 1, 0), 1, 2, transform)
      expectVec3(cylinder.center, 6, 0, 0)
      expectVec3(cylinder.axis, 1, 0, 0)
      expect(cylinder.radius).toBeCloseTo(1)
      expect(cylinder.halfHeight).toBeCloseTo(1)
    })
    it('scales height by y and radius by the larger of x and z', () => {
      const transform = mat4CreateFromRTS(quatCreateAxisAngle(vec3(0, 1, 0), 0), vec3(0), vec3(2, 3, 0.5))
      const cylinder = new BoundingCylinder().initFromTransform(vec3(0), 1, 2, transform)
      expect(cylinder.radius).toBeCloseTo(2)
      expect(cylinder.halfHeight).toBeCloseTo(3)
    })
  })

  describe('#getBoundingBox', () => {
    it('encloses a y aligned cylinder', () => {
      const box = BoundingCylinder.create(vec3(0), 1, 4).getBoundingBox()
      expectVec3(box.min, -1, -2, -1)
      expectVec3(box.max, 1, 2, 1)
    })
    it('encloses a rotated cylinder', () => {
      const transform = mat4CreateFromRTS(quatCreateAxisAngle(vec3(0, 0, 1), Math.PI / 2), vec3(0), vec3(1))
      const box = new BoundingCylinder().initFromTransform(vec3(0), 1, 4, transform).getBoundingBox()
      expectVec3(box.min, -2, -1, -1)
      expectVec3(box.max, 2, 1, 1)
    })
  })

  describe('#closestPoint', () => {
    it('returns the point itself if inside', () => {
      expectVec3(unit().closestPoint(vec3(0.5, 0.5, 0)), 0.5, 0.5, 0)
    })
    it('clamps to the side', () => {
      expectVec3(unit().closestPoint(vec3(3, 0.5, 0)), 1, 0.5, 0)
    })
    it('clamps to the cap', () => {
      expectVec3(unit().closestPoint(vec3(0.5, 3, 0)), 0.5, 1, 0)
    })
    it('clamps to the rim', () => {
      expectVec3(unit().closestPoint(vec3(3, 3, 0)), 1, 1, 0)
    })
  })

  describe('#support', () => {
    it('returns a point on the rim', () => {
      expectVec3(unit().support(vec3(1, 1, 0)), 1, 1, 0)
      expectVec3(unit().support(vec3(0, -1, -1)), 0, -1, -1)
    })
    it('returns the cap center along the axis', () => {
      expectVec3(unit().support(vec3(0, 1, 0)), 0, 1, 0)
    })
  })

  describe('#intersectsPoint', () => {
    it('detects points inside', () => {
      expect(unit().intersectsPoint(vec3(0, 0, 0))).toBe(true)
      expect(unit().intersectsPoint(vec3(0.7, 1, 0.7))).toBe(true)
    })
    it('rejects points outside', () => {
      expect(unit().intersectsPoint(vec3(0, 1.1, 0))).toBe(false)
      expect(unit().intersectsPoint(vec3(0.75, 0, 0.75))).toBe(false)
    })
  })

  describe('#intersectsSphere', () => {
    it('detects spheres at the side, cap and rim', () => {
      expect(unit().intersectsSphere(new BoundingSphere(1.9, 0, 0, 1))).toBe(true)
      expect(unit().intersectsSphere(new BoundingSphere(0, 1.9, 0, 1))).toBe(true)
      expect(unit().intersectsSphere(new BoundingSphere(1.5, 1.5, 0, 0.75))).toBe(true)
    })
    it('rejects separated spheres', () => {
      expect(unit().intersectsSphere(new BoundingSphere(2.1, 0, 0, 1))).toBe(false)
      // inside the enclosing box, but beyond the rim
      expect(unit().intersectsSphere(new BoundingSphere(1.5, 1.5, 0, 0.6))).toBe(false)
    })
  })

  describe('#intersectsRayAt', () => {
    it('returns the distance to the side', () => {
      expect(unit().intersectsRayAt(rayCreate(vec3(-5, 0, 0), vec3(1, 0, 0)))).toBeCloseTo(4)
    })
    it('returns the distance to the cap', () => {
      expect(unit().intersectsRayAt(rayCreate(vec3(0.5, 5, 0), vec3(0, -1, 0)))).toBeCloseTo(4)
    })
    it('returns 0 if the ray starts inside', () => {
      expect(unit().intersectsRayAt(rayCreate(vec3(0, 0, 0), vec3(1, 0, 0)))).toBe(0)
    })
    it('returns NaN if the cylinder is behind the ray', () => {
      expect(unit().intersectsRayAt(rayCreate(vec3(5, 0, 0), vec3(1, 0, 0)))).toBeNaN()
    })
    it('returns NaN if the ray misses', () => {
      expect(unit().intersectsRayAt(rayCreate(vec3(-5, 1.5, 0), vec3(1, 0, 0)))).toBeNaN()
      expect(unit().intersectsRayAt(rayCreate(vec3(1.5, 5, 0), vec3(0, -1, 0)))).toBeNaN()
      // passes the corner of the enclosing box
      expect(unit().intersectsRayAt(rayCreate(vec3(-5, 0, 0.95), vec3(1, 0, 0.3)))).toBeNaN()
    })
    it('respects the orientation', () => {
      const transform = mat4CreateFromRTS(quatCreateAxisAngle(vec3(0, 0, 1), Math.PI / 2), vec3(0), vec3(1))
      const cylinder = new BoundingCylinder().initFromTransform(vec3(0), 1, 4, transform)
      expect(cylinder.intersectsRayAt(rayCreate(vec3(-5, 0, 0), vec3(1, 0, 0)))).toBeCloseTo(3)
      expect(cylinder.intersectsRayAt(rayCreate(vec3(0, 5, 0), vec3(0, -1, 0)))).toBeCloseTo(4)
    })
  })
})
