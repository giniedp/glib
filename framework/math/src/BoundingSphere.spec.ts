import { BoundingBox, BoundingSphere, IVec3, Vec3 } from '@glib/math'

describe('BoundingSphere', () => {

  function expectComponents(v: BoundingSphere, x: number, y: number, z: number, r: number) {
    expect(v.center.x).toBeCloseTo(x, 10, 'center.x component')
    expect(v.center.y).toBeCloseTo(y, 10, 'center.y component')
    expect(v.center.z).toBeCloseTo(z, 10, 'center.z component')
    expect(v.radius).toBeCloseTo(r, 10, 'radius component')
  }

  function expectVec3Equality(v1: IVec3, v2: IVec3) {
    expect(v1.x).toBeCloseTo(v2.x, 10, 'x component')
    expect(v1.y).toBeCloseTo(v2.y, 10, 'y component')
    expect(v1.z).toBeCloseTo(v2.z, 10, 'z component')
  }

  describe('#new', () => {
    it ('initializes with 0', () => {
      expectComponents(new BoundingSphere(), 0, 0, 0, 0)
    })
    it ('initializes with values', () => {
      expectComponents(new BoundingSphere(1, 2, 3, 4), 1, 2, 3, 4)
    })
  })

  describe('#init', () => {
    it ('initializes components', () => {
      expectComponents(new BoundingSphere().init(1, 2, 3, 4), 1, 2, 3, 4)
    })
  })

  describe('.create', () => {
    it ('initializes components', () => {
      expectComponents(BoundingSphere.create(1, 2, 3, 4), 1, 2, 3, 4)
    })
  })

  describe('#initFrom', () => {
    it ('initializes components', () => {
      expectComponents(new BoundingSphere().initFrom(new BoundingSphere(1, 2, 3, 4)), 1, 2, 3, 4)
    })
  })

  describe('.createFrom', () => {
    it ('initializes components', () => {
      expectComponents(BoundingSphere.createFrom(new BoundingSphere(1, 2, 3, 4)), 1, 2, 3, 4)
    })
  })

  describe('#initFromCenterRadius', () => {
    it ('initializes components', () => {
      expectComponents(new BoundingSphere().initFromCenterRadius(Vec3.create(1, 2, 3), 4), 1, 2, 3, 4)
    })
  })

  describe('#createFromCenterRadius', () => {
    it ('initializes components', () => {
      expectComponents(BoundingSphere.createFromCenterRadius(Vec3.create(1, 2, 3), 4), 1, 2, 3, 4)
    })
  })

  describe('#initFromBox', () => {
    it ('creates from box', () => {
      expectComponents(new BoundingSphere().initFromBox(new BoundingBox(0, 0, 0, 1, 1, 1)), 0.5, 0.5, 0.5, 0.8660254037844386)
    })
  })

  describe('.createFromBox', () => {
    it ('creates from box', () => {
      expectComponents(BoundingSphere.createFromBox(new BoundingBox(0, 0, 0, 1, 1, 1)), 0.5, 0.5, 0.5, 0.8660254037844386)
    })
  })

  describe('#initFromBuffer', () => {
    it ('merges points', () => {
      expectComponents(new BoundingSphere().initFromBuffer([0, 0, 0, 1, 1, 1]), 0.5, 0.5, 0.5, 0.8660254037844386)
    })
  })

  describe('.createFromBuffer', () => {
    it ('merges points', () => {
      expectComponents(BoundingSphere.createFromBuffer([0, 0, 0, 1, 1, 1]), 0.5, 0.5, 0.5, 0.8660254037844386)
    })
  })

  describe('#initFromVec3Buffer', () => {
    it ('merges points', () => {
      const sphere = new BoundingSphere().initFromVec3Buffer([Vec3.create(0, 0, 0), Vec3.create(1, 1, 1)])
      expectComponents(sphere, 0.5, 0.5, 0.5, 0.8660254037844386)
    })
  })

  describe('.createFromVec3Buffer', () => {
    it ('merges points', () => {
      const sphere = BoundingSphere.createFromVec3Buffer([Vec3.create(0, 0, 0), Vec3.create(1, 1, 1)])
      expectComponents(sphere, 0.5, 0.5, 0.5, 0.8660254037844386)
    })
  })

  describe('#clone', () => {
    it ('creates a cloned instance', () => {
      const sphere1 = new BoundingSphere(1, 2, 3, 4)
      const sphere2 = sphere1.clone()
      expect(sphere1).not.toBe(sphere2)
      expectVec3Equality(sphere2.center, sphere1.center)
      expect(sphere2.radius).toEqual(sphere1.radius)
    })
    it ('clones into another instance', () => {
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
    it ('creates a cloned instance', () => {
      const sphere1 = new BoundingSphere(1, 2, 3, 4)
      const sphere2 = BoundingSphere.clone(sphere1)
      expect(sphere1).not.toBe(sphere2)
      expectVec3Equality(sphere2.center, sphere1.center)
      expect(sphere2.radius).toEqual(sphere1.radius)
    })
    it ('clones into another instance', () => {
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
    it ('copies components into array', () => {
      expect(new BoundingSphere(1, 2, 3, 4).copy([])).toEqual([1, 2, 3, 4])
    })
  })

  describe('.copy', () => {
    it ('copies components into array', () => {
      expect(BoundingSphere.copy(new BoundingSphere(1, 2, 3, 4), [])).toEqual([1, 2, 3, 4])
    })
  })

  describe('#equals', () => {
    it ('compares components', () => {
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
    it ('compares components', () => {
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

})
