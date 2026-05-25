import { BoundingBox } from './BoundingBox'
import { Vec3 } from './Vec3'
import { BoundingSphere } from './BoundingSphere'
import { BoundingFrustum } from './BoundingFrustum'
import { IVec4 } from './Types'
import { Mat4 } from './Mat4'
import { describe, it, expect } from 'vitest'

describe('BoundingFrustum', () => {
  function expectVec4Components(v: IVec4, x: number, y: number, z: number, w: number) {
    expect(v.x, 'x component').toBeCloseTo(x, 10)
    expect(v.y, 'y component').toBeCloseTo(y, 10)
    expect(v.z, 'z component').toBeCloseTo(z, 10)
    expect(v.w, 'w component').toBeCloseTo(w, 10)
  }

  describe('new', () => {
    it('initializes with identity matrix', () => {
      const frustum = new BoundingFrustum()
      expect(frustum.matrix.equals(Mat4.createIdentity())).toBe(true)
      expectVec4Components(frustum.planeNegX, -1, 0, 0, -1)
      expectVec4Components(frustum.planePosX, 1, 0, 0, -1)
      expectVec4Components(frustum.planeNegY, 0, -1, 0, -1)
      expectVec4Components(frustum.planePosY, 0, 1, 0, -1)
      expectVec4Components(frustum.planeNegZ, 0, 0, -1, -1)
      expectVec4Components(frustum.planePosZ, 0, 0, 1, -1)
    })
  })

  describe('#intersectsBox', () => {
    it('tests for intersection', () => {
      const frustum = new BoundingFrustum()

      // containment
      const s = 1 - 0.0001
      expect(frustum.intersectsBox(BoundingBox.create(-s, -s, -s, s, s, s))).toBe(true)

      // intersection
      expect(frustum.intersectsBox(BoundingBox.create(-2, -1, -1, -1, 1, 1))).toBe(true)
      expect(frustum.intersectsBox(BoundingBox.create(-1, -2, -1, 1, -1, 1))).toBe(true)
      expect(frustum.intersectsBox(BoundingBox.create(-1, -1, -2, 1, 1, -1))).toBe(true)
      expect(frustum.intersectsBox(BoundingBox.create(1, -1, -1, 2, 1, 1))).toBe(true)
      expect(frustum.intersectsBox(BoundingBox.create(-1, 1, -1, 1, 2, 1))).toBe(true)
      expect(frustum.intersectsBox(BoundingBox.create(-1, -1, 1, 1, 1, 2))).toBe(true)

      // outside
      expect(frustum.intersectsBox(BoundingBox.create(-2, -1, -1, -1.001, 1, 1))).toBe(false)
      expect(frustum.intersectsBox(BoundingBox.create(-1, -2, -1, 1, -1.001, 1))).toBe(false)
      expect(frustum.intersectsBox(BoundingBox.create(-1, -1, -2, 1, 1, -1.001))).toBe(false)
      expect(frustum.intersectsBox(BoundingBox.create(1.001, -1, -1, 2, 1, 1))).toBe(false)
      expect(frustum.intersectsBox(BoundingBox.create(-1, 1.001, -1, 1, 2, 1))).toBe(false)
      expect(frustum.intersectsBox(BoundingBox.create(-1, -1, 1.001, 1, 1, 2))).toBe(false)
    })
  })

  describe('#intersectsSphere', () => {
    it('tests for intersection', () => {
      const frustum = new BoundingFrustum()

      // containment
      expect(frustum.intersectsSphere(BoundingSphere.create(0, 0, 0, 1))).toBe(true)

      // intersection
      expect(frustum.intersectsSphere(BoundingSphere.create(-2, 0, 0, 1))).toBe(true)
      expect(frustum.intersectsSphere(BoundingSphere.create(2, 0, 0, 1))).toBe(true)
      expect(frustum.intersectsSphere(BoundingSphere.create(0, -2, 0, 1))).toBe(true)
      expect(frustum.intersectsSphere(BoundingSphere.create(0, 2, 0, 1))).toBe(true)
      expect(frustum.intersectsSphere(BoundingSphere.create(0, 0, -2, 1))).toBe(true)
      expect(frustum.intersectsSphere(BoundingSphere.create(0, 0, 2, 1))).toBe(true)

      // outside
      expect(frustum.intersectsSphere(BoundingSphere.create(-2, 0, 0, 1 - Number.EPSILON))).toBe(false)
      expect(frustum.intersectsSphere(BoundingSphere.create(2, 0, 0, 1 - Number.EPSILON))).toBe(false)
      expect(frustum.intersectsSphere(BoundingSphere.create(0, -2, 0, 1 - Number.EPSILON))).toBe(false)
      expect(frustum.intersectsSphere(BoundingSphere.create(0, 2, 0, 1 - Number.EPSILON))).toBe(false)
      expect(frustum.intersectsSphere(BoundingSphere.create(0, 0, -2, 1 - Number.EPSILON))).toBe(false)
      expect(frustum.intersectsSphere(BoundingSphere.create(0, 0, 2, 1 - Number.EPSILON))).toBe(false)
    })
  })

  describe('#intersectionWithBox', () => {
    it('tests for intersection', () => {
      const frustum = new BoundingFrustum()

      // containment
      const s = 1 - 0.0001
      expect(frustum.intersectionBox(BoundingBox.create(-s, -s, -s, s, s, s))).toBe(2)

      // intersection
      expect(frustum.intersectionBox(BoundingBox.create(-2, -1, -1, -1, 1, 1))).toBe(1)
      expect(frustum.intersectionBox(BoundingBox.create(-1, -2, -1, 1, -1, 1))).toBe(1)
      expect(frustum.intersectionBox(BoundingBox.create(-1, -1, -2, 1, 1, -1))).toBe(1)
      expect(frustum.intersectionBox(BoundingBox.create(1, -1, -1, 2, 1, 1))).toBe(1)
      expect(frustum.intersectionBox(BoundingBox.create(-1, 1, -1, 1, 2, 1))).toBe(1)
      expect(frustum.intersectionBox(BoundingBox.create(-1, -1, 1, 1, 1, 2))).toBe(1)

      // outside
      expect(frustum.intersectionBox(BoundingBox.create(-2, -1, -1, -1.001, 1, 1))).toBe(0)
      expect(frustum.intersectionBox(BoundingBox.create(-1, -2, -1, 1, -1.001, 1))).toBe(0)
      expect(frustum.intersectionBox(BoundingBox.create(-1, -1, -2, 1, 1, -1.001))).toBe(0)
      expect(frustum.intersectionBox(BoundingBox.create(1.001, -1, -1, 2, 1, 1))).toBe(0)
      expect(frustum.intersectionBox(BoundingBox.create(-1, 1.001, -1, 1, 2, 1))).toBe(0)
      expect(frustum.intersectionBox(BoundingBox.create(-1, -1, 1.001, 1, 1, 2))).toBe(0)
    })
  })

  describe('#intersectionWithSphere', () => {
    it('tests for intersection', () => {
      const frustum = new BoundingFrustum()

      // containment
      expect(frustum.intersectionSphere(BoundingSphere.create(0, 0, 0, 1))).toBe(2)

      // intersection
      expect(frustum.intersectionSphere(BoundingSphere.create(-2, 0, 0, 1))).toBe(1)
      expect(frustum.intersectionSphere(BoundingSphere.create(2, 0, 0, 1))).toBe(1)
      expect(frustum.intersectionSphere(BoundingSphere.create(0, -2, 0, 1))).toBe(1)
      expect(frustum.intersectionSphere(BoundingSphere.create(0, 2, 0, 1))).toBe(1)
      expect(frustum.intersectionSphere(BoundingSphere.create(0, 0, -2, 1))).toBe(1)
      expect(frustum.intersectionSphere(BoundingSphere.create(0, 0, 2, 1))).toBe(1)

      // outside
      expect(frustum.intersectionSphere(BoundingSphere.create(-2, 0, 0, 1 - Number.EPSILON))).toBe(0)
      expect(frustum.intersectionSphere(BoundingSphere.create(2, 0, 0, 1 - Number.EPSILON))).toBe(0)
      expect(frustum.intersectionSphere(BoundingSphere.create(0, -2, 0, 1 - Number.EPSILON))).toBe(0)
      expect(frustum.intersectionSphere(BoundingSphere.create(0, 2, 0, 1 - Number.EPSILON))).toBe(0)
      expect(frustum.intersectionSphere(BoundingSphere.create(0, 0, -2, 1 - Number.EPSILON))).toBe(0)
      expect(frustum.intersectionSphere(BoundingSphere.create(0, 0, 2, 1 - Number.EPSILON))).toBe(0)
    })
  })

  describe('#containsBox', () => {
    it('tests for containment', () => {
      const frustum = new BoundingFrustum()

      // containment
      const s = 1 - 0.0001
      expect(frustum.containsBox(BoundingBox.create(-s, -s, -s, s, s, s))).toBe(true)

      // intersection
      expect(frustum.containsBox(BoundingBox.create(-2, -1, -1, -1, 1, 1))).toBe(false)
      expect(frustum.containsBox(BoundingBox.create(-1, -2, -1, 1, -1, 1))).toBe(false)
      expect(frustum.containsBox(BoundingBox.create(-1, -1, -2, 1, 1, -1))).toBe(false)
      expect(frustum.containsBox(BoundingBox.create(1, -1, -1, 2, 1, 1))).toBe(false)
      expect(frustum.containsBox(BoundingBox.create(-1, 1, -1, 1, 2, 1))).toBe(false)
      expect(frustum.containsBox(BoundingBox.create(-1, -1, 1, 1, 1, 2))).toBe(false)

      // outside
      expect(frustum.containsBox(BoundingBox.create(-2, -1, -1, -1.001, 1, 1))).toBe(false)
      expect(frustum.containsBox(BoundingBox.create(-1, -2, -1, 1, -1.001, 1))).toBe(false)
      expect(frustum.containsBox(BoundingBox.create(-1, -1, -2, 1, 1, -1.001))).toBe(false)
      expect(frustum.containsBox(BoundingBox.create(1.001, -1, -1, 2, 1, 1))).toBe(false)
      expect(frustum.containsBox(BoundingBox.create(-1, 1.001, -1, 1, 2, 1))).toBe(false)
      expect(frustum.containsBox(BoundingBox.create(-1, -1, 1.001, 1, 1, 2))).toBe(false)
    })
  })

  describe('#containsSphere', () => {
    it('tests for containment', () => {
      const frustum = new BoundingFrustum()

      // containment
      expect(frustum.containsSphere(BoundingSphere.create(0, 0, 0, 1))).toBe(true)

      // intersection
      expect(frustum.containsSphere(BoundingSphere.create(-2, 0, 0, 1))).toBe(false)
      expect(frustum.containsSphere(BoundingSphere.create(2, 0, 0, 1))).toBe(false)
      expect(frustum.containsSphere(BoundingSphere.create(0, -2, 0, 1))).toBe(false)
      expect(frustum.containsSphere(BoundingSphere.create(0, 2, 0, 1))).toBe(false)
      expect(frustum.containsSphere(BoundingSphere.create(0, 0, -2, 1))).toBe(false)
      expect(frustum.containsSphere(BoundingSphere.create(0, 0, 2, 1))).toBe(false)

      // outside
      expect(frustum.containsSphere(BoundingSphere.create(-2, 0, 0, 1 - Number.EPSILON))).toBe(false)
      expect(frustum.containsSphere(BoundingSphere.create(2, 0, 0, 1 - Number.EPSILON))).toBe(false)
      expect(frustum.containsSphere(BoundingSphere.create(0, -2, 0, 1 - Number.EPSILON))).toBe(false)
      expect(frustum.containsSphere(BoundingSphere.create(0, 2, 0, 1 - Number.EPSILON))).toBe(false)
      expect(frustum.containsSphere(BoundingSphere.create(0, 0, -2, 1 - Number.EPSILON))).toBe(false)
      expect(frustum.containsSphere(BoundingSphere.create(0, 0, 2, 1 - Number.EPSILON))).toBe(false)
    })
  })

  describe('#containsPoint', () => {
    it('tests for containment', () => {
      const frustum = new BoundingFrustum()

      expect(frustum.intersectsPoint(Vec3.create(-1, -1, -1))).toBe(true)
      expect(frustum.intersectsPoint(Vec3.create(-1, -1, 1))).toBe(true)
      expect(frustum.intersectsPoint(Vec3.create(-1, 1, -1))).toBe(true)
      expect(frustum.intersectsPoint(Vec3.create(-1, 1, -1))).toBe(true)
      expect(frustum.intersectsPoint(Vec3.create(1, -1, -1))).toBe(true)
      expect(frustum.intersectsPoint(Vec3.create(1, -1, -1))).toBe(true)

      expect(frustum.intersectsPoint(Vec3.create(-1 - Number.EPSILON, 0, 0))).toBe(false)
      expect(frustum.intersectsPoint(Vec3.create(1 + Number.EPSILON, 0, 0))).toBe(false)
      expect(frustum.intersectsPoint(Vec3.create(0, -1 - Number.EPSILON, 0))).toBe(false)
      expect(frustum.intersectsPoint(Vec3.create(0, 1 + Number.EPSILON, 0))).toBe(false)
      expect(frustum.intersectsPoint(Vec3.create(0, 0, -1 - Number.EPSILON))).toBe(false)
      expect(frustum.intersectsPoint(Vec3.create(0, 0, 1 + Number.EPSILON))).toBe(false)
    })
  })
})
