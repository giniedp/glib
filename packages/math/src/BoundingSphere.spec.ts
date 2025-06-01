import { BoundingBox } from './BoundingBox'
import { Vec3 } from './Vec3'
import { BoundingSphere } from './BoundingSphere'
import { BoundingFrustum } from './BoundingFrustum'
import { IVec3 } from './Types'
import { Mat4 } from './Mat4'
import { Ray } from './Ray'
import { Plane } from './Plane'
import { describe, it, expect } from 'vitest'

describe('BoundingSphere', () => {
  function expectComponents(v: BoundingSphere, x: number, y: number, z: number, r: number) {
    expect(v.center.x, 'center.x component').toBeCloseTo(x, 10)
    expect(v.center.y, 'center.y component').toBeCloseTo(y, 10)
    expect(v.center.z, 'center.z component').toBeCloseTo(z, 10)
    expect(v.radius, 'radius component').toBeCloseTo(r, 10)
  }

  function expectVec3Equality(v1: IVec3, v2: IVec3) {
    expect(v1.x, 'x component').toBeCloseTo(v2.x, 10)
    expect(v1.y, 'y component').toBeCloseTo(v2.y, 10)
    expect(v1.z, 'z component').toBeCloseTo(v2.z, 10)
  }

  describe('#new', () => {
    it('initializes with 0', () => {
      expectComponents(new BoundingSphere(), 0, 0, 0, 0)
    })
    it('initializes with values', () => {
      expectComponents(new BoundingSphere(1, 2, 3, 4), 1, 2, 3, 4)
    })
  })

  describe('#init', () => {
    it('initializes components', () => {
      expectComponents(new BoundingSphere().init(1, 2, 3, 4), 1, 2, 3, 4)
    })
  })

  describe('.create', () => {
    it('initializes components', () => {
      expectComponents(BoundingSphere.create(1, 2, 3, 4), 1, 2, 3, 4)
    })
  })

  describe('#initFrom', () => {
    it('initializes components', () => {
      expectComponents(new BoundingSphere().initFrom(new BoundingSphere(1, 2, 3, 4)), 1, 2, 3, 4)
    })
  })

  describe('.createFrom', () => {
    it('initializes components', () => {
      expectComponents(BoundingSphere.createFrom(new BoundingSphere(1, 2, 3, 4)), 1, 2, 3, 4)
    })
  })

  describe('#initFromCenterRadius', () => {
    it('initializes components', () => {
      expectComponents(new BoundingSphere().initFromCenterRadius(Vec3.create(1, 2, 3), 4), 1, 2, 3, 4)
    })
  })

  describe('#createFromCenterRadius', () => {
    it('initializes components', () => {
      expectComponents(BoundingSphere.createFromCenterRadius(Vec3.create(1, 2, 3), 4), 1, 2, 3, 4)
    })
  })

  describe('#initFromBox', () => {
    it('creates from box', () => {
      expectComponents(
        new BoundingSphere().initFromBox(new BoundingBox(0, 0, 0, 1, 1, 1)),
        0.5,
        0.5,
        0.5,
        0.8660254037844386,
      )
    })
  })

  describe('.createFromBox', () => {
    it('creates from box', () => {
      expectComponents(
        BoundingSphere.createFromBox(new BoundingBox(0, 0, 0, 1, 1, 1)),
        0.5,
        0.5,
        0.5,
        0.8660254037844386,
      )
    })
  })

  describe('#initFromArray', () => {
    it('merges points', () => {
      expectComponents(new BoundingSphere().initFromArray([0, 0, 0, 1]), 0, 0, 0, 1)
    })
  })

  describe('.createFromArray', () => {
    it('merges points', () => {
      expectComponents(BoundingSphere.createFromArray([0, 0, 0, 1]), 0, 0, 0, 1)
    })
  })

  describe('#initFromPoints', () => {
    it('merges points', () => {
      const sphere = new BoundingSphere().initFromPoints([Vec3.create(0, 0, 0), Vec3.create(1, 1, 1)])
      expectComponents(sphere, 0.5, 0.5, 0.5, 0.8660254037844386)
    })
  })

  describe('.createFromPoints', () => {
    it('merges points', () => {
      const sphere = BoundingSphere.createFromPoints([Vec3.create(0, 0, 0), Vec3.create(1, 1, 1)])
      expectComponents(sphere, 0.5, 0.5, 0.5, 0.8660254037844386)
    })
  })

  describe('#initFromPointsBuffer', () => {
    it('merges points', () => {
      const sphere = new BoundingSphere().initFromPointsBuffer([0, 0, 0, 1, 1, 1])
      expectComponents(sphere, 0.5, 0.5, 0.5, 0.8660254037844386)
    })
  })

  describe('.createFromPointsBuffer', () => {
    it('merges points', () => {
      const sphere = BoundingSphere.createFromPointsBuffer([0, 0, 0, 1, 1, 1])
      expectComponents(sphere, 0.5, 0.5, 0.5, 0.8660254037844386)
    })
  })

  describe('#mergeSphere', () => {
    it('merges spheres', () => {
      const b1 = BoundingSphere.createFromArray([-1, 0, 0, 1])
      const b2 = BoundingSphere.createFromArray([1, 0, 0, 1])
      b1.mergeSphere(b2)
      expectComponents(b1, 0, 0, 0, 2)

      b1.init(0, 0, 0, 1)
      b2.init(1, 0, 0, 1)
      b1.mergeSphere(b2)
      expectComponents(b1, 0.5, 0, 0, 1.5)

      b1.init(1, 0, 0, 1)
      b2.init(0, 0, 0, 1)
      b1.mergeSphere(b2)
      expectComponents(b1, 0.5, 0, 0, 1.5)

      b1.init(1, 0, 0, 1)
      b2.init(0.5, 0, 0, 0.5)
      b1.mergeSphere(b2)
      expectComponents(b1, 1, 0, 0, 1)

      b1.init(0.5, 0, 0, 0.5)
      b2.init(1, 0, 0, 1)
      b1.mergeSphere(b2)
      expectComponents(b1, 1, 0, 0, 1)
    })
  })

  describe('#clone', () => {
    it('creates a cloned instance', () => {
      const sphere1 = new BoundingSphere(1, 2, 3, 4)
      const sphere2 = sphere1.clone()
      expect(sphere1).not.toBe(sphere2)
      expectVec3Equality(sphere2.center, sphere1.center)
      expect(sphere2.radius).toEqual(sphere1.radius)
    })
    it('clones into another instance', () => {
      const sphere1 = new BoundingSphere(1, 2, 3, 4)
      const sphere2 = new BoundingSphere()
      const sphere3 = sphere1.clone(sphere2)
      expect(sphere1).not.toBe(sphere2)
      expect(sphere2).toBe(sphere3)
      expectVec3Equality(sphere2.center, sphere1.center)
      expect(sphere2.radius).toEqual(sphere1.radius)
    })
  })

  describe('.clone', () => {
    it('creates a cloned instance', () => {
      const sphere1 = new BoundingSphere(1, 2, 3, 4)
      const sphere2 = BoundingSphere.clone(sphere1)
      expect(sphere1).not.toBe(sphere2)
      expectVec3Equality(sphere2.center, sphere1.center)
      expect(sphere2.radius).toEqual(sphere1.radius)
    })
    it('clones into another instance', () => {
      const sphere1 = new BoundingSphere(1, 2, 3, 4)
      const sphere2 = new BoundingSphere()
      const sphere3 = BoundingSphere.clone(sphere1, sphere2)
      expect(sphere1).not.toBe(sphere2)
      expect(sphere2).toBe(sphere3)
      expectVec3Equality(sphere2.center, sphere1.center)
      expect(sphere2.radius).toEqual(sphere1.radius)
    })
  })

  describe('#copy', () => {
    it('copies components into array', () => {
      expect(new BoundingSphere(1, 2, 3, 4).toArray([])).toEqual([1, 2, 3, 4])
    })
  })

  describe('.copy', () => {
    it('copies components into array', () => {
      expect(BoundingSphere.toArray(new BoundingSphere(1, 2, 3, 4), [])).toEqual([1, 2, 3, 4])
    })
  })

  describe('#equals', () => {
    it('compares components', () => {
      expect(new BoundingSphere(0, 0, 0, 0).equals(new BoundingSphere(0, 0, 0, 0))).toBe(true)
      expect(new BoundingSphere(1, 0, 0, 0).equals(new BoundingSphere(1, 0, 0, 0))).toBe(true)
      expect(new BoundingSphere(0, 1, 0, 0).equals(new BoundingSphere(0, 1, 0, 0))).toBe(true)
      expect(new BoundingSphere(0, 0, 1, 0).equals(new BoundingSphere(0, 0, 1, 0))).toBe(true)
      expect(new BoundingSphere(0, 0, 0, 1).equals(new BoundingSphere(0, 0, 0, 1))).toBe(true)

      expect(new BoundingSphere(1, 0, 0, 0).equals(new BoundingSphere(0, 0, 0, 0))).toBe(false)
      expect(new BoundingSphere(0, 1, 0, 0).equals(new BoundingSphere(0, 0, 0, 0))).toBe(false)
      expect(new BoundingSphere(0, 0, 1, 0).equals(new BoundingSphere(0, 0, 0, 0))).toBe(false)
      expect(new BoundingSphere(0, 0, 0, 1).equals(new BoundingSphere(0, 0, 0, 0))).toBe(false)
    })
  })

  describe('.equals', () => {
    it('compares components', () => {
      expect(BoundingSphere.equals(new BoundingSphere(0, 0, 0, 0), new BoundingSphere(0, 0, 0, 0))).toBe(true)
      expect(BoundingSphere.equals(new BoundingSphere(1, 0, 0, 0), new BoundingSphere(1, 0, 0, 0))).toBe(true)
      expect(BoundingSphere.equals(new BoundingSphere(0, 1, 0, 0), new BoundingSphere(0, 1, 0, 0))).toBe(true)
      expect(BoundingSphere.equals(new BoundingSphere(0, 0, 1, 0), new BoundingSphere(0, 0, 1, 0))).toBe(true)
      expect(BoundingSphere.equals(new BoundingSphere(0, 0, 0, 1), new BoundingSphere(0, 0, 0, 1))).toBe(true)

      expect(BoundingSphere.equals(new BoundingSphere(1, 0, 0, 0), new BoundingSphere(0, 0, 0, 0))).toBe(false)
      expect(BoundingSphere.equals(new BoundingSphere(0, 1, 0, 0), new BoundingSphere(0, 0, 0, 0))).toBe(false)
      expect(BoundingSphere.equals(new BoundingSphere(0, 0, 1, 0), new BoundingSphere(0, 0, 0, 0))).toBe(false)
      expect(BoundingSphere.equals(new BoundingSphere(0, 0, 0, 1), new BoundingSphere(0, 0, 0, 0))).toBe(false)
    })
  })

  describe('#intersectsRay', () => {
    it('tests for intersection', () => {
      const sphere = BoundingSphere.create(1, 1, 1, 1)
      expect(sphere.intersectsRay(Ray.create(-1, 1, 1, 1, 0, 0)), 'from left').toBe(true)
      expect(sphere.intersectsRay(Ray.create(3, 1, 1, -1, 0, 0)), 'from right').toBe(true)
      expect(sphere.intersectsRay(Ray.create(1, -1, 1, 0, 1, 0)), 'from below').toBe(true)
      expect(sphere.intersectsRay(Ray.create(1, 3, 1, 0, -1, 0)), 'from above').toBe(true)
      expect(sphere.intersectsRay(Ray.create(1, 1, -1, 0, 0, 1)), 'from behind').toBe(true)
      expect(sphere.intersectsRay(Ray.create(1, 1, 3, 0, 0, -1)), 'from infront').toBe(true)

      expect(sphere.intersectsRay(Ray.create(-1, 1, 1, -1, 0, 0)), 'away, left').toBe(false)
      expect(sphere.intersectsRay(Ray.create(3, 1, 1, 1, 0, 0)), 'away, right').toBe(false)
      expect(sphere.intersectsRay(Ray.create(1, -1, 1, 0, -1, 0)), 'away, below').toBe(false)
      expect(sphere.intersectsRay(Ray.create(1, 3, 1, 0, 1, 0)), 'away, above').toBe(false)
      expect(sphere.intersectsRay(Ray.create(1, 1, -1, 0, 0, -1)), 'away, behind').toBe(false)
      expect(sphere.intersectsRay(Ray.create(1, 1, 3, 0, 0, 1)), 'away, infront').toBe(false)
    })
  })

  describe('#intersectsPlane', () => {
    it('tests for intersection', () => {
      const sphere = BoundingSphere.create(1, 2, 3, 1)

      expect(sphere.intersectsPlane(Plane.create(1, 0, 0, -2.001))).toBe(false)
      expect(sphere.intersectsPlane(Plane.create(1, 0, 0, -2.0))).toBe(true)
      expect(sphere.intersectsPlane(Plane.create(1, 0, 0, -0.0))).toBe(true)
      expect(sphere.intersectsPlane(Plane.create(1, 0, 0, 0.001))).toBe(false)

      expect(sphere.intersectsPlane(Plane.create(0, 1, 0, -3.001))).toBe(false)
      expect(sphere.intersectsPlane(Plane.create(0, 1, 0, -3.0))).toBe(true)
      expect(sphere.intersectsPlane(Plane.create(0, 1, 0, -1.0))).toBe(true)
      expect(sphere.intersectsPlane(Plane.create(0, 1, 0, 1.001))).toBe(false)

      expect(sphere.intersectsPlane(Plane.create(0, 0, 1, -4.001))).toBe(false)
      expect(sphere.intersectsPlane(Plane.create(0, 0, 1, -4.0))).toBe(true)
      expect(sphere.intersectsPlane(Plane.create(0, 0, 1, -2.0))).toBe(true)
      expect(sphere.intersectsPlane(Plane.create(0, 0, 1, 2.001))).toBe(false)

      expect(sphere.intersectsPlane(Plane.create(-1, 0, 0, 2.001))).toBe(false)
      expect(sphere.intersectsPlane(Plane.create(-1, 0, 0, 2.0))).toBe(true)
      expect(sphere.intersectsPlane(Plane.create(-1, 0, 0, -0.0))).toBe(true)
      expect(sphere.intersectsPlane(Plane.create(-1, 0, 0, -0.001))).toBe(false)

      expect(sphere.intersectsPlane(Plane.create(0, -1, 0, 3.001))).toBe(false)
      expect(sphere.intersectsPlane(Plane.create(0, -1, 0, 3.0))).toBe(true)
      expect(sphere.intersectsPlane(Plane.create(0, -1, 0, 1.0))).toBe(true)
      expect(sphere.intersectsPlane(Plane.create(0, -1, 0, 0.999))).toBe(false)

      expect(sphere.intersectsPlane(Plane.create(0, 0, -1, 4.001))).toBe(false)
      expect(sphere.intersectsPlane(Plane.create(0, 0, -1, 4.0))).toBe(true)
      expect(sphere.intersectsPlane(Plane.create(0, 0, -1, 2.0))).toBe(true)
      expect(sphere.intersectsPlane(Plane.create(0, 0, -1, 1.999))).toBe(false)
    })
  })

  describe('#intersectsBox', () => {
    it('tests for intersection', () => {
      const sphere = BoundingSphere.create(0.5, 0.5, 0.5, 0.5)

      expect(sphere.intersectsBox(BoundingBox.create(0, 0, 0, 1, 1, 1))).toBe(true)

      expect(sphere.intersectsBox(BoundingBox.create(1.001, 0, 0, 2.0, 1, 1))).toBe(false)
      expect(sphere.intersectsBox(BoundingBox.create(1.0, 0, 0, 2.0, 1, 1))).toBe(true)
      expect(sphere.intersectsBox(BoundingBox.create(-1.0, 0, 0, 0.0, 1, 1))).toBe(true)
      expect(sphere.intersectsBox(BoundingBox.create(-1.0, 0, 0, -0.001, 1, 1))).toBe(false)

      expect(sphere.intersectsBox(BoundingBox.create(0, 0, 1.001, 1, 1, 2.0))).toBe(false)
      expect(sphere.intersectsBox(BoundingBox.create(0, 0, 1.0, 1, 1, 2.0))).toBe(true)
      expect(sphere.intersectsBox(BoundingBox.create(0, 0, -1.0, 1, 1, 0.0))).toBe(true)
      expect(sphere.intersectsBox(BoundingBox.create(0, 0, -1.0, 1, 1, -0.001))).toBe(false)

      expect(sphere.intersectsBox(BoundingBox.create(0, 1.001, 0, 1, 2.0, 1))).toBe(false)
      expect(sphere.intersectsBox(BoundingBox.create(0, 1.0, 0, 1, 2.0, 1))).toBe(true)
      expect(sphere.intersectsBox(BoundingBox.create(0, -1.0, 0, 1, 0.0, 1))).toBe(true)
      expect(sphere.intersectsBox(BoundingBox.create(0, -1.0, 0, 1, -0.001, 1))).toBe(false)
    })
  })

  describe('#intersectsSphere', () => {
    it('tests for intersection', () => {
      const sphere = BoundingSphere.create(1, 1, 1, 1)

      expect(sphere.intersectsSphere(BoundingSphere.create(1, 1, 1, 1))).toBe(true)

      expect(sphere.intersectsSphere(BoundingSphere.create(3.001, 1, 1, 1))).toBe(false)
      expect(sphere.intersectsSphere(BoundingSphere.create(3.0, 1, 1, 1))).toBe(true)
      expect(sphere.intersectsSphere(BoundingSphere.create(-1.0, 1, 1, 1))).toBe(true)
      expect(sphere.intersectsSphere(BoundingSphere.create(-1.001, 1, 1, 1))).toBe(false)

      expect(sphere.intersectsSphere(BoundingSphere.create(1, 3.001, 1, 1))).toBe(false)
      expect(sphere.intersectsSphere(BoundingSphere.create(1, 3.0, 1, 1))).toBe(true)
      expect(sphere.intersectsSphere(BoundingSphere.create(1, -1.0, 1, 1))).toBe(true)
      expect(sphere.intersectsSphere(BoundingSphere.create(1, -1.001, 1, 1))).toBe(false)

      expect(sphere.intersectsSphere(BoundingSphere.create(1, 1, 3.001, 1))).toBe(false)
      expect(sphere.intersectsSphere(BoundingSphere.create(1, 1, 3.0, 1))).toBe(true)
      expect(sphere.intersectsSphere(BoundingSphere.create(1, 1, -1.0, 1))).toBe(true)
      expect(sphere.intersectsSphere(BoundingSphere.create(1, 1, -1.001, 1))).toBe(false)
    })
  })

  describe('#containsPoint', () => {
    it('tests for containment', () => {
      const sphere = BoundingSphere.create(0.5, 0.5, 0.5, 0.5)

      expect(sphere.intersectsPoint(Vec3.create(-0.001, 0.5, 0.5))).toBe(false)
      expect(sphere.intersectsPoint(Vec3.create(0.0, 0.5, 0.5))).toBe(true)
      expect(sphere.intersectsPoint(Vec3.create(0.001, 0.5, 0.5))).toBe(true)

      expect(sphere.intersectsPoint(Vec3.create(0.5, -0.001, 0.5))).toBe(false)
      expect(sphere.intersectsPoint(Vec3.create(0.5, 0.0, 0.5))).toBe(true)
      expect(sphere.intersectsPoint(Vec3.create(0.5, 0.001, 0.5))).toBe(true)

      expect(sphere.intersectsPoint(Vec3.create(0.5, 0.5, -0.001))).toBe(false)
      expect(sphere.intersectsPoint(Vec3.create(0.5, 0.5, 0.0))).toBe(true)
      expect(sphere.intersectsPoint(Vec3.create(0.5, 0.5, 0.001))).toBe(true)

      expect(sphere.intersectsPoint(Vec3.create(1 + 0.001, 0.5, 0.5))).toBe(false)
      expect(sphere.intersectsPoint(Vec3.create(1 + 0.0, 0.5, 0.5))).toBe(true)
      expect(sphere.intersectsPoint(Vec3.create(1 - 0.001, 0.5, 0.5))).toBe(true)

      expect(sphere.intersectsPoint(Vec3.create(0.5, 1 + 0.001, 0.5))).toBe(false)
      expect(sphere.intersectsPoint(Vec3.create(0.5, 1 + 0.0, 0.5))).toBe(true)
      expect(sphere.intersectsPoint(Vec3.create(0.5, 1 - 0.001, 0.5))).toBe(true)

      expect(sphere.intersectsPoint(Vec3.create(0.5, 0.5, 1 + 0.001))).toBe(false)
      expect(sphere.intersectsPoint(Vec3.create(0.5, 0.5, 1 + 0.0))).toBe(true)
      expect(sphere.intersectsPoint(Vec3.create(0.5, 0.5, 1 - 0.001))).toBe(true)
    })
  })

  describe('#containsBox', () => {
    it('tests for containment', () => {
      const sphere = BoundingSphere.create(0.5, 0.5, 0.5, 0.5)

      // containment
      expect(sphere.containsBox(BoundingBox.create(0.25, 0.25, 0.25, 0.75, 0.75, 0.75))).toBe(true)

      // intersection
      expect(sphere.containsBox(BoundingBox.create(-1, 0, 0, 0, 1, 1)), 'left').toBe(false)
      expect(sphere.containsBox(BoundingBox.create(1, 0, 0, 2, 1, 1)), 'right').toBe(false)
      expect(sphere.containsBox(BoundingBox.create(0, -1, 0, 1, -0, 1)), 'below').toBe(false)
      expect(sphere.containsBox(BoundingBox.create(0, 1, 0, 1, 2, 1)), 'above').toBe(false)
      expect(sphere.containsBox(BoundingBox.create(0, 0, -1, 1, 1, -0)), 'behind').toBe(false)
      expect(sphere.containsBox(BoundingBox.create(0, 0, 1, 1, 1, 2)), 'infront').toBe(false)

      // outside
      expect(sphere.containsBox(BoundingBox.create(-1.0, 0, 0, -0.001, 1, 1)), 'left').toBe(false)
      expect(sphere.containsBox(BoundingBox.create(1.001, 0, 0, 2.0, 1, 1)), 'right').toBe(false)
      expect(sphere.containsBox(BoundingBox.create(0, -1.0, 0, 1, -0.001, 1)), 'below').toBe(false)
      expect(sphere.containsBox(BoundingBox.create(0, 1.001, 0, 1, 2.0, 1)), 'above').toBe(false)
      expect(sphere.containsBox(BoundingBox.create(0, 0, -1.0, 1, 1, -0.001)), 'behind').toBe(false)
      expect(sphere.containsBox(BoundingBox.create(0, 0, 1.001, 1, 1, 2.0)), 'infront').toBe(false)
    })
  })

  describe('#containsSphere', () => {
    it('tests for containment', () => {
      const sphere = BoundingSphere.create(0.5, 0.5, 0.5, 0.5)

      // containment
      expect(sphere.containsSphere(BoundingSphere.create(0.5, 0.5, 0.5, 0.5))).toBe(true)

      // intersection
      expect(sphere.containsSphere(BoundingSphere.create(-1.0, 0.5, 0.5, 1)), 'left').toBe(false)
      expect(sphere.containsSphere(BoundingSphere.create(2.0, 0.5, 0.5, 1)), 'right').toBe(false)
      expect(sphere.containsSphere(BoundingSphere.create(0.5, -1.0, 0.5, 1)), 'below').toBe(false)
      expect(sphere.containsSphere(BoundingSphere.create(0.5, 2.0, 0.5, 1)), 'above').toBe(false)
      expect(sphere.containsSphere(BoundingSphere.create(0.5, 0.5, -1.0, 1)), 'behind').toBe(false)
      expect(sphere.containsSphere(BoundingSphere.create(0.5, 0.5, 2.0, 1)), 'infront').toBe(false)

      // outside
      expect(sphere.containsSphere(BoundingSphere.create(-1.0, 0.5, 0.5, 0.999)), 'left').toBe(false)
      expect(sphere.containsSphere(BoundingSphere.create(2.0, 0.5, 0.5, 0.999)), 'right').toBe(false)
      expect(sphere.containsSphere(BoundingSphere.create(0.5, -1.0, 0.5, 0.999)), 'below').toBe(false)
      expect(sphere.containsSphere(BoundingSphere.create(0.5, 2.0, 0.5, 0.999)), 'above').toBe(false)
      expect(sphere.containsSphere(BoundingSphere.create(0.5, 0.5, -1.0, 0.999)), 'behind').toBe(false)
      expect(sphere.containsSphere(BoundingSphere.create(0.5, 0.5, 2.0, 0.999)), 'infront').toBe(false)
    })
  })

  describe('#containsFrustum', () => {
    it('tests for containment', () => {
      const frustum = new BoundingFrustum(Mat4.createIdentity())
      const r = Math.sqrt(3) + Number.EPSILON
      // containment
      expect(BoundingSphere.create(0, 0, 0, r).containsFrustum(frustum)).toBe(true)

      // intersection
      expect(BoundingSphere.create(2, 2, 2, r).containsFrustum(frustum)).toBe(false)
      expect(BoundingSphere.create(2, 2, -2, r).containsFrustum(frustum)).toBe(false)
      expect(BoundingSphere.create(2, -2, 2, r).containsFrustum(frustum)).toBe(false)
      expect(BoundingSphere.create(2, -2, -2, r).containsFrustum(frustum)).toBe(false)
      expect(BoundingSphere.create(-2, 2, 2, r).containsFrustum(frustum)).toBe(false)
      expect(BoundingSphere.create(-2, 2, -2, r).containsFrustum(frustum)).toBe(false)
      expect(BoundingSphere.create(-2, -2, 2, r).containsFrustum(frustum)).toBe(false)
      expect(BoundingSphere.create(-2, -2, -2, r).containsFrustum(frustum)).toBe(false)

      // outside
      expect(BoundingSphere.create(2, 2, 2, r - Number.EPSILON).containsFrustum(frustum)).toBe(false)
      expect(BoundingSphere.create(2, 2, -2, r - Number.EPSILON).containsFrustum(frustum)).toBe(false)
      expect(BoundingSphere.create(2, -2, 2, r - Number.EPSILON).containsFrustum(frustum)).toBe(false)
      expect(BoundingSphere.create(2, -2, -2, r - Number.EPSILON).containsFrustum(frustum)).toBe(false)
      expect(BoundingSphere.create(-2, 2, 2, r - Number.EPSILON).containsFrustum(frustum)).toBe(false)
      expect(BoundingSphere.create(-2, 2, -2, r - Number.EPSILON).containsFrustum(frustum)).toBe(false)
      expect(BoundingSphere.create(-2, -2, 2, r - Number.EPSILON).containsFrustum(frustum)).toBe(false)
      expect(BoundingSphere.create(-2, -2, -2, r - Number.EPSILON).containsFrustum(frustum)).toBe(false)
    })
  })

  describe('#containmentOfBox', () => {
    it('tests for containment', () => {
      const sphere = BoundingSphere.create(0.5, 0.5, 0.5, 0.5)

      // containment
      expect(sphere.containmentOfBox(BoundingBox.create(0.25, 0.25, 0.25, 0.75, 0.75, 0.75))).toBe(2)

      // intersection
      expect(sphere.containmentOfBox(BoundingBox.create(-1, 0, 0, 0, 1, 1)), 'left').toBe(1)
      expect(sphere.containmentOfBox(BoundingBox.create(1, 0, 0, 2, 1, 1)), 'right').toBe(1)
      expect(sphere.containmentOfBox(BoundingBox.create(0, -1, 0, 1, -0, 1)), 'below').toBe(1)
      expect(sphere.containmentOfBox(BoundingBox.create(0, 1, 0, 1, 2, 1)), 'above').toBe(1)
      expect(sphere.containmentOfBox(BoundingBox.create(0, 0, -1, 1, 1, -0)), 'behind').toBe(1)
      expect(sphere.containmentOfBox(BoundingBox.create(0, 0, 1, 1, 1, 2)), 'infront').toBe(1)

      // outside
      expect(sphere.containmentOfBox(BoundingBox.create(-1.0, 0, 0, -0.001, 1, 1)), 'left').toBe(0)
      expect(sphere.containmentOfBox(BoundingBox.create(1.001, 0, 0, 2.0, 1, 1)), 'right').toBe(0)
      expect(sphere.containmentOfBox(BoundingBox.create(0, -1.0, 0, 1, -0.001, 1)), 'below').toBe(0)
      expect(sphere.containmentOfBox(BoundingBox.create(0, 1.001, 0, 1, 2.0, 1)), 'above').toBe(0)
      expect(sphere.containmentOfBox(BoundingBox.create(0, 0, -1.0, 1, 1, -0.001)), 'behind').toBe(0)
      expect(sphere.containmentOfBox(BoundingBox.create(0, 0, 1.001, 1, 1, 2.0)), 'infront').toBe(0)
    })
  })

  describe('#containmentOfSphere', () => {
    it('tests for containment', () => {
      const sphere = BoundingSphere.create(0.5, 0.5, 0.5, 0.5)

      // containment
      expect(sphere.containmentOfSphere(BoundingSphere.create(0.5, 0.5, 0.5, 0.5))).toBe(2)

      // intersection
      expect(sphere.containmentOfSphere(BoundingSphere.create(-1.0, 0.5, 0.5, 1)), 'left').toBe(1)
      expect(sphere.containmentOfSphere(BoundingSphere.create(2.0, 0.5, 0.5, 1)), 'right').toBe(1)
      expect(sphere.containmentOfSphere(BoundingSphere.create(0.5, -1.0, 0.5, 1)), 'below').toBe(1)
      expect(sphere.containmentOfSphere(BoundingSphere.create(0.5, 2.0, 0.5, 1)), 'above').toBe(1)
      expect(sphere.containmentOfSphere(BoundingSphere.create(0.5, 0.5, -1.0, 1)), 'behind').toBe(1)
      expect(sphere.containmentOfSphere(BoundingSphere.create(0.5, 0.5, 2.0, 1)), 'infront').toBe(1)

      // outside
      expect(sphere.containmentOfSphere(BoundingSphere.create(-1.0, 0.5, 0.5, 0.999)), 'left').toBe(0)
      expect(sphere.containmentOfSphere(BoundingSphere.create(2.0, 0.5, 0.5, 0.999)), 'right').toBe(0)
      expect(sphere.containmentOfSphere(BoundingSphere.create(0.5, -1.0, 0.5, 0.999)), 'below').toBe(0)
      expect(sphere.containmentOfSphere(BoundingSphere.create(0.5, 2.0, 0.5, 0.999)), 'above').toBe(0)
      expect(sphere.containmentOfSphere(BoundingSphere.create(0.5, 0.5, -1.0, 0.999)), 'behind').toBe(0)
      expect(sphere.containmentOfSphere(BoundingSphere.create(0.5, 0.5, 2.0, 0.999)), 'infront').toBe(0)
    })
  })

  describe('#containmentOfFrustum', () => {
    it('tests for containment', () => {
      const frustum = new BoundingFrustum(Mat4.createIdentity())
      const r = Math.sqrt(3) + Number.EPSILON
      // containment
      expect(BoundingSphere.create(0, 0, 0, r).containmentOfFrustum(frustum)).toBe(2)

      // intersection
      expect(BoundingSphere.create(2, 2, 2, r).containmentOfFrustum(frustum)).toBe(1)
      expect(BoundingSphere.create(2, 2, -2, r).containmentOfFrustum(frustum)).toBe(1)
      expect(BoundingSphere.create(2, -2, 2, r).containmentOfFrustum(frustum)).toBe(1)
      expect(BoundingSphere.create(2, -2, -2, r).containmentOfFrustum(frustum)).toBe(1)
      expect(BoundingSphere.create(-2, 2, 2, r).containmentOfFrustum(frustum)).toBe(1)
      expect(BoundingSphere.create(-2, 2, -2, r).containmentOfFrustum(frustum)).toBe(1)
      expect(BoundingSphere.create(-2, -2, 2, r).containmentOfFrustum(frustum)).toBe(1)
      expect(BoundingSphere.create(-2, -2, -2, r).containmentOfFrustum(frustum)).toBe(1)

      // outside
      expect(BoundingSphere.create(2, 2, 2, r - Number.EPSILON).containmentOfFrustum(frustum)).toBe(0)
      expect(BoundingSphere.create(2, 2, -2, r - Number.EPSILON).containmentOfFrustum(frustum)).toBe(0)
      expect(BoundingSphere.create(2, -2, 2, r - Number.EPSILON).containmentOfFrustum(frustum)).toBe(0)
      expect(BoundingSphere.create(2, -2, -2, r - Number.EPSILON).containmentOfFrustum(frustum)).toBe(0)
      expect(BoundingSphere.create(-2, 2, 2, r - Number.EPSILON).containmentOfFrustum(frustum)).toBe(0)
      expect(BoundingSphere.create(-2, 2, -2, r - Number.EPSILON).containmentOfFrustum(frustum)).toBe(0)
      expect(BoundingSphere.create(-2, -2, 2, r - Number.EPSILON).containmentOfFrustum(frustum)).toBe(0)
      expect(BoundingSphere.create(-2, -2, -2, r - Number.EPSILON).containmentOfFrustum(frustum)).toBe(0)
    })
  })
})
