import { BoundingBox } from './BoundingBox'
import { Vec3 } from './Vec3'
import { BoundingSphere } from './BoundingSphere'
import { BoundingFrustum } from './BoundingFrustum'
import { IVec4 } from './Types'
import { Mat4 } from './Mat4'

describe('BoundingFrustum', () => {

  function expectVec4Components(v: IVec4, x: number, y: number, z: number, w: number) {
    expect(v.x).toBeCloseTo(x, 10, 'x component')
    expect(v.y).toBeCloseTo(y, 10, 'y component')
    expect(v.z).toBeCloseTo(z, 10, 'z component')
    expect(v.w).toBeCloseTo(w, 10, 'w component')
  }

  describe('new', () => {
    it('initializes with identity matrix', () => {
      const frustum = new BoundingFrustum()
      expect(frustum.matrix.equals(Mat4.createIdentity())).toBe(true)
      expectVec4Components(frustum.left,  -1,  0,  0, -1)
      expectVec4Components(frustum.right,  1,  0,  0, -1)
      expectVec4Components(frustum.bottom, 0, -1,  0, -1)
      expectVec4Components(frustum.top,    0,  1,  0, -1)
      expectVec4Components(frustum.far,    0,  0, -1, -1)
      expectVec4Components(frustum.near,   0,  0,  1, -1)
      expectVec4Components(frustum.getLeftPlane(),  -1,  0,  0, -1)
      expectVec4Components(frustum.getRightPlane(),  1,  0,  0, -1)
      expectVec4Components(frustum.getBottomPlane(), 0, -1,  0, -1)
      expectVec4Components(frustum.getTopPlane(),    0,  1,  0, -1)
      expectVec4Components(frustum.getFarPlane(),    0,  0, -1, -1)
      expectVec4Components(frustum.getNearPlane(),   0,  0,  1, -1)
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
      expect(frustum.containmentOfBox(BoundingBox.create(-s, -s, -s, s, s, s))).toBe(2)

      // intersection
      expect(frustum.containmentOfBox(BoundingBox.create(-2, -1, -1, -1, 1, 1))).toBe(1)
      expect(frustum.containmentOfBox(BoundingBox.create(-1, -2, -1, 1, -1, 1))).toBe(1)
      expect(frustum.containmentOfBox(BoundingBox.create(-1, -1, -2, 1, 1, -1))).toBe(1)
      expect(frustum.containmentOfBox(BoundingBox.create(1, -1, -1, 2, 1, 1))).toBe(1)
      expect(frustum.containmentOfBox(BoundingBox.create(-1, 1, -1, 1, 2, 1))).toBe(1)
      expect(frustum.containmentOfBox(BoundingBox.create(-1, -1, 1, 1, 1, 2))).toBe(1)

      // outside
      expect(frustum.containmentOfBox(BoundingBox.create(-2, -1, -1, -1.001, 1, 1))).toBe(0)
      expect(frustum.containmentOfBox(BoundingBox.create(-1, -2, -1, 1, -1.001, 1))).toBe(0)
      expect(frustum.containmentOfBox(BoundingBox.create(-1, -1, -2, 1, 1, -1.001))).toBe(0)
      expect(frustum.containmentOfBox(BoundingBox.create(1.001, -1, -1, 2, 1, 1))).toBe(0)
      expect(frustum.containmentOfBox(BoundingBox.create(-1, 1.001, -1, 1, 2, 1))).toBe(0)
      expect(frustum.containmentOfBox(BoundingBox.create(-1, -1, 1.001, 1, 1, 2))).toBe(0)
    })
  })

  describe('#intersectionWithSphere', () => {
    it('tests for intersection', () => {
      const frustum = new BoundingFrustum()

      // containment
      expect(frustum.containmentOfSphere(BoundingSphere.create(0, 0, 0, 1))).toBe(2)

      // intersection
      expect(frustum.containmentOfSphere(BoundingSphere.create(-2, 0, 0, 1))).toBe(1)
      expect(frustum.containmentOfSphere(BoundingSphere.create(2, 0, 0, 1))).toBe(1)
      expect(frustum.containmentOfSphere(BoundingSphere.create(0, -2, 0, 1))).toBe(1)
      expect(frustum.containmentOfSphere(BoundingSphere.create(0, 2, 0, 1))).toBe(1)
      expect(frustum.containmentOfSphere(BoundingSphere.create(0, 0, -2, 1))).toBe(1)
      expect(frustum.containmentOfSphere(BoundingSphere.create(0, 0, 2, 1))).toBe(1)

      // outside
      expect(frustum.containmentOfSphere(BoundingSphere.create(-2, 0, 0, 1 - Number.EPSILON))).toBe(0)
      expect(frustum.containmentOfSphere(BoundingSphere.create(2, 0, 0, 1 - Number.EPSILON))).toBe(0)
      expect(frustum.containmentOfSphere(BoundingSphere.create(0, -2, 0, 1 - Number.EPSILON))).toBe(0)
      expect(frustum.containmentOfSphere(BoundingSphere.create(0, 2, 0, 1 - Number.EPSILON))).toBe(0)
      expect(frustum.containmentOfSphere(BoundingSphere.create(0, 0, -2, 1 - Number.EPSILON))).toBe(0)
      expect(frustum.containmentOfSphere(BoundingSphere.create(0, 0, 2, 1 - Number.EPSILON))).toBe(0)
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
