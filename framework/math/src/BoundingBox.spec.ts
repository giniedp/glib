import { BoundingBox, BoundingSphere, IVec3, Vec3 } from '@glib/math'

describe('BoundingBox', () => {

  function expectVec3Components(v: IVec3, x: number, y: number, z: number) {
    expect(v.x).toBeCloseTo(x, 10, 'x component')
    expect(v.y).toBeCloseTo(y, 10, 'y component')
    expect(v.z).toBeCloseTo(z, 10, 'z component')
  }

  function expectVec3Equality(v1: IVec3, v2: IVec3) {
    expect(v1.x).toBeCloseTo(v2.x, 10, 'x component')
    expect(v1.y).toBeCloseTo(v2.y, 10, 'y component')
    expect(v1.z).toBeCloseTo(v2.z, 10, 'z component')
  }

  describe('#new', () => {
    it ('initializes with 0', () => {
      expectVec3Components(new BoundingBox().min, 0, 0, 0)
      expectVec3Components(new BoundingBox().max, 0, 0, 0)
    })
    it ('initializes with values', () => {
      expectVec3Components(new BoundingBox(1, 2, 3, 4, 5, 6).min, 1, 2, 3)
      expectVec3Components(new BoundingBox(1, 2, 3, 4, 5, 6).max, 4, 5, 6)
    })
  })

  describe('#init', () => {
    it ('initializes components', () => {
      expectVec3Components(new BoundingBox().init(1, 2, 3, 4, 5, 6).min, 1, 2, 3)
      expectVec3Components(new BoundingBox().init(1, 2, 3, 4, 5, 6).max, 4, 5, 6)

      expectVec3Components(new BoundingBox(1, 2, 3, 4, 5, 6).init().min, 0, 0, 0)
      expectVec3Components(new BoundingBox(1, 2, 3, 4, 5, 6).init().max, 0, 0, 0)
    })
  })

  describe('.create', () => {
    it ('initializes components', () => {
      expectVec3Components(BoundingBox.create(1, 2, 3, 4, 5, 6).min, 1, 2, 3)
      expectVec3Components(BoundingBox.create(1, 2, 3, 4, 5, 6).max, 4, 5, 6)

      expectVec3Components(BoundingBox.create().min, 0, 0, 0)
      expectVec3Components(BoundingBox.create().max, 0, 0, 0)
    })
  })

  describe('#initFrom', () => {
    it ('initializes components', () => {
      expectVec3Components(new BoundingBox().initFrom(new BoundingBox(1, 2, 3, 4, 5, 6)).min, 1, 2, 3)
      expectVec3Components(new BoundingBox().initFrom(new BoundingBox(1, 2, 3, 4, 5, 6)).max, 4, 5, 6)
    })
  })

  describe('.createFrom', () => {
    it ('initializes components', () => {
      expectVec3Components(BoundingBox.createFrom(new BoundingBox(1, 2, 3, 4, 5, 6)).min, 1, 2, 3)
      expectVec3Components(BoundingBox.createFrom(new BoundingBox(1, 2, 3, 4, 5, 6)).max, 4, 5, 6)
    })
  })

  describe('#initFromMinMax', () => {
    it ('initializes components', () => {
      expectVec3Components(new BoundingBox().initFromMinMax(Vec3.create(1, 2, 3), Vec3.create(4, 5, 6)).min, 1, 2, 3)
      expectVec3Components(new BoundingBox().initFromMinMax(Vec3.create(1, 2, 3), Vec3.create(4, 5, 6)).max, 4, 5, 6)
    })
  })

  describe('#createFromMinMax', () => {
    it ('initializes components', () => {
      expectVec3Components(BoundingBox.createFromMinMax(Vec3.create(1, 2, 3), Vec3.create(4, 5, 6)).min, 1, 2, 3)
      expectVec3Components(BoundingBox.createFromMinMax(Vec3.create(1, 2, 3), Vec3.create(4, 5, 6)).max, 4, 5, 6)
    })
  })

  describe('#initFromSphere', () => {
    it ('creates from sphere', () => {
      const box1 = new BoundingBox().initFromSphere(new BoundingSphere(0, 0, 0, 1))
      expectVec3Equality(box1.min, Vec3.create(-1, -1, -1))
      expectVec3Equality(box1.max, Vec3.create(1, 1, 1))
    })
  })

  describe('.createFromSphere', () => {
    it ('creates from sphere', () => {
      const box1 = BoundingBox.createFromSphere(new BoundingSphere(0, 0, 0, 1))
      expectVec3Equality(box1.min, Vec3.create(-1, -1, -1))
      expectVec3Equality(box1.max, Vec3.create(1, 1, 1))
    })
  })

  describe('#initFromBuffer', () => {
    it ('merges points', () => {
      const box1 = new BoundingBox().initFromBuffer([1, 2, 3, 4, 5, 6])
      expectVec3Equality(box1.min, Vec3.create(1, 2, 3))
      expectVec3Equality(box1.max, Vec3.create(4, 5, 6))
    })
  })

  describe('.createFromBuffer', () => {
    it ('merges points', () => {
      const box1 = BoundingBox.createFromBuffer([1, 2, 3, 4, 5, 6])
      expectVec3Equality(box1.min, Vec3.create(1, 2, 3))
      expectVec3Equality(box1.max, Vec3.create(4, 5, 6))
    })
  })

  describe('#initFromVec3Buffer', () => {
    it ('merges points', () => {
      const box1 = new BoundingBox().initFromVec3Buffer([Vec3.create(1, 2, 3), Vec3.create(4, 5, 6)])
      expectVec3Equality(box1.min, Vec3.create(1, 2, 3))
      expectVec3Equality(box1.max, Vec3.create(4, 5, 6))
    })
  })

  describe('.createFromVec3Buffer', () => {
    it ('merges points', () => {
      const box1 = BoundingBox.createFromVec3Buffer([Vec3.create(1, 2, 3), Vec3.create(4, 5, 6)])
      expectVec3Equality(box1.min, Vec3.create(1, 2, 3))
      expectVec3Equality(box1.max, Vec3.create(4, 5, 6))
    })
  })

  describe('#clone', () => {
    it ('creates a cloned instance', () => {
      const box1 = new BoundingBox(1, 2, 3, 4, 5, 6)
      const box2 = box1.clone()
      expect(box1).not.toBe(box2)
      expectVec3Equality(box2.min, box1.min)
      expectVec3Equality(box2.max, box1.max)
    })
    it ('clones into another instance', () => {
      const box1 = new BoundingBox(1, 2, 34, 5, 6)
      const box2 = new BoundingBox()
      const box3 = box1.clone(box2)
      expect(box1).not.toBe(box2)
      expect(box2).toBe(box3)
      expectVec3Equality(box2.min, box1.min)
      expectVec3Equality(box2.max, box1.max)
    })
  })

  describe('.clone', () => {
    it ('creates a cloned instance', () => {
      const box1 = new BoundingBox(1, 2, 3, 4, 5, 6)
      const box2 = BoundingBox.clone(box1)
      expect(box1).not.toBe(box2)
      expectVec3Equality(box2.min, box1.min)
      expectVec3Equality(box2.max, box1.max)
    })
    it ('clones into another instance', () => {
      const box1 = new BoundingBox(1, 2, 34, 5, 6)
      const box2 = new BoundingBox()
      const box3 = BoundingBox.clone(box1, box2)
      expect(box1).not.toBe(box2)
      expect(box2).toBe(box3)
      expectVec3Equality(box2.min, box1.min)
      expectVec3Equality(box2.max, box1.max)
    })
  })

  describe('#copy', () => {
    it ('copies components into array', () => {
      expect(new BoundingBox(1, 2, 3, 4, 5, 6).copy([])).toEqual([1, 2, 3, 4, 5, 6])
    })
  })

  describe('.copy', () => {
    it ('copies components into array', () => {
      expect(BoundingBox.copy(new BoundingBox(1, 2, 3, 4, 5, 6), [])).toEqual([1, 2, 3, 4, 5, 6])
    })
  })

  describe('#equals', () => {
    it ('compares components', () => {
      expect(new BoundingBox(0, 0, 0, 0, 0, 0).equals(new BoundingBox(0, 0, 0, 0, 0, 0))).toBe(true)
      expect(new BoundingBox(1, 0, 0, 0, 0, 0).equals(new BoundingBox(1, 0, 0, 0, 0, 0))).toBe(true)
      expect(new BoundingBox(0, 1, 0, 0, 0, 0).equals(new BoundingBox(0, 1, 0, 0, 0, 0))).toBe(true)
      expect(new BoundingBox(0, 0, 1, 0, 0, 0).equals(new BoundingBox(0, 0, 1, 0, 0, 0))).toBe(true)
      expect(new BoundingBox(0, 0, 0, 1, 0, 0).equals(new BoundingBox(0, 0, 0, 1, 0, 0))).toBe(true)
      expect(new BoundingBox(0, 0, 0, 0, 1, 0).equals(new BoundingBox(0, 0, 0, 0, 1, 0))).toBe(true)
      expect(new BoundingBox(0, 0, 0, 0, 0, 1).equals(new BoundingBox(0, 0, 0, 0, 0, 1))).toBe(true)

      expect(new BoundingBox(1, 0, 0, 0, 0, 0).equals(new BoundingBox(0, 0, 0, 0, 0, 0))).toBe(false)
      expect(new BoundingBox(0, 1, 0, 0, 0, 0).equals(new BoundingBox(0, 0, 0, 0, 0, 0))).toBe(false)
      expect(new BoundingBox(0, 0, 1, 0, 0, 0).equals(new BoundingBox(0, 0, 0, 0, 0, 0))).toBe(false)
      expect(new BoundingBox(0, 0, 0, 1, 0, 0).equals(new BoundingBox(0, 0, 0, 0, 0, 0))).toBe(false)
      expect(new BoundingBox(0, 0, 0, 0, 1, 0).equals(new BoundingBox(0, 0, 0, 0, 0, 0))).toBe(false)
      expect(new BoundingBox(0, 0, 0, 0, 0, 1).equals(new BoundingBox(0, 0, 0, 0, 0, 0))).toBe(false)
    })
  })

  describe('.equals', () => {
    it ('compares components', () => {
      expect(BoundingBox.equals(new BoundingBox(0, 0, 0, 0, 0, 0), new BoundingBox(0, 0, 0, 0, 0, 0))).toBe(true)
      expect(BoundingBox.equals(new BoundingBox(1, 0, 0, 0, 0, 0), new BoundingBox(1, 0, 0, 0, 0, 0))).toBe(true)
      expect(BoundingBox.equals(new BoundingBox(0, 1, 0, 0, 0, 0), new BoundingBox(0, 1, 0, 0, 0, 0))).toBe(true)
      expect(BoundingBox.equals(new BoundingBox(0, 0, 1, 0, 0, 0), new BoundingBox(0, 0, 1, 0, 0, 0))).toBe(true)
      expect(BoundingBox.equals(new BoundingBox(0, 0, 0, 1, 0, 0), new BoundingBox(0, 0, 0, 1, 0, 0))).toBe(true)
      expect(BoundingBox.equals(new BoundingBox(0, 0, 0, 0, 1, 0), new BoundingBox(0, 0, 0, 0, 1, 0))).toBe(true)
      expect(BoundingBox.equals(new BoundingBox(0, 0, 0, 0, 0, 1), new BoundingBox(0, 0, 0, 0, 0, 1))).toBe(true)

      expect(BoundingBox.equals(new BoundingBox(1, 0, 0, 0, 0, 0), new BoundingBox(0, 0, 0, 0, 0, 0))).toBe(false)
      expect(BoundingBox.equals(new BoundingBox(0, 1, 0, 0, 0, 0), new BoundingBox(0, 0, 0, 0, 0, 0))).toBe(false)
      expect(BoundingBox.equals(new BoundingBox(0, 0, 1, 0, 0, 0), new BoundingBox(0, 0, 0, 0, 0, 0))).toBe(false)
      expect(BoundingBox.equals(new BoundingBox(0, 0, 0, 1, 0, 0), new BoundingBox(0, 0, 0, 0, 0, 0))).toBe(false)
      expect(BoundingBox.equals(new BoundingBox(0, 0, 0, 0, 1, 0), new BoundingBox(0, 0, 0, 0, 0, 0))).toBe(false)
      expect(BoundingBox.equals(new BoundingBox(0, 0, 0, 0, 0, 1), new BoundingBox(0, 0, 0, 0, 0, 0))).toBe(false)
    })
  })

  describe('.copy', () => {
    it ('copies components into array', () => {
      expect(BoundingBox.copy(new BoundingBox(1, 2, 3, 4, 5, 6), [])).toEqual([1, 2, 3, 4, 5, 6])
    })
  })

  describe('#merge', () => {
    it ('merges two boxes', () => {
      const box1 = new BoundingBox(1, 2, 3, 4.1, 5.2, 6.3)
      const box2 = new BoundingBox(0.1, 0.2, 0.3, 4, 5, 6)
      const expect = new BoundingBox(0.1, 0.2, 0.3, 4.1, 5.2, 6.3)
      box1.merge(box2)
      expectVec3Equality(box1.min, expect.min)
      expectVec3Equality(box1.max, expect.max)
    })
  })

  describe('.merge', () => {
    it ('merges two boxes', () => {
      const box1 = new BoundingBox(1, 2, 3, 4.1, 5.2, 6.3)
      const box2 = new BoundingBox(0.1, 0.2, 0.3, 4, 5, 6)
      const expect = new BoundingBox(0.1, 0.2, 0.3, 4.1, 5.2, 6.3)
      BoundingBox.merge(box1, box2, box1)
      expectVec3Equality(box1.min, expect.min)
      expectVec3Equality(box1.max, expect.max)
    })
  })

  describe('#getCorner', () => {
    it ('gets the corner as Vec3', () => {
      const box = new BoundingBox(0, 0, 0, 1, 1, 1)
      expectVec3Components(box.getCorner(0), 0, 1, 1)
      expectVec3Components(box.getCorner(1), 1, 1, 1)
      expectVec3Components(box.getCorner(2), 1, 0, 1)
      expectVec3Components(box.getCorner(3), 0, 0, 1)
      expectVec3Components(box.getCorner(4), 0, 1, 0)
      expectVec3Components(box.getCorner(5), 1, 1, 0)
      expectVec3Components(box.getCorner(6), 1, 0, 0)
      expectVec3Components(box.getCorner(7), 0, 0, 0)
    })
  })

  describe('.getCorner', () => {
    it ('gets the corner as Vec3', () => {
      const box = new BoundingBox(0, 0, 0, 1, 1, 1)
      expectVec3Components(BoundingBox.getCorner(0, box.min, box.max), 0, 1, 1)
      expectVec3Components(BoundingBox.getCorner(1, box.min, box.max), 1, 1, 1)
      expectVec3Components(BoundingBox.getCorner(2, box.min, box.max), 1, 0, 1)
      expectVec3Components(BoundingBox.getCorner(3, box.min, box.max), 0, 0, 1)
      expectVec3Components(BoundingBox.getCorner(4, box.min, box.max), 0, 1, 0)
      expectVec3Components(BoundingBox.getCorner(5, box.min, box.max), 1, 1, 0)
      expectVec3Components(BoundingBox.getCorner(6, box.min, box.max), 1, 0, 0)
      expectVec3Components(BoundingBox.getCorner(7, box.min, box.max), 0, 0, 0)
    })
  })

  describe('#mergePoint', () => {
    it ('merges point into box', () => {
      let box1 = new BoundingBox(1, 2, 3, 4, 5, 6).mergePoint(Vec3.create(0, 2, 3))
      expectVec3Equality(box1.min, Vec3.create(0, 2, 3))
      expectVec3Equality(box1.max, Vec3.create(4, 5, 6))

      box1 = new BoundingBox(1, 2, 3, 4, 5, 6).mergePoint(Vec3.create(1, 1, 3))
      expectVec3Equality(box1.min, Vec3.create(1, 1, 3))
      expectVec3Equality(box1.max, Vec3.create(4, 5, 6))

      box1 = new BoundingBox(1, 2, 3, 4, 5, 6).mergePoint(Vec3.create(1, 2, 2))
      expectVec3Equality(box1.min, Vec3.create(1, 2, 2))
      expectVec3Equality(box1.max, Vec3.create(4, 5, 6))

      box1 = new BoundingBox(1, 2, 3, 4, 5, 6).mergePoint(Vec3.create(5, 5, 6))
      expectVec3Equality(box1.min, Vec3.create(1, 2, 3))
      expectVec3Equality(box1.max, Vec3.create(5, 5, 6))

      box1 = new BoundingBox(1, 2, 3, 4, 5, 6).mergePoint(Vec3.create(4, 6, 6))
      expectVec3Equality(box1.min, Vec3.create(1, 2, 3))
      expectVec3Equality(box1.max, Vec3.create(4, 6, 6))

      box1 = new BoundingBox(1, 2, 3, 4, 5, 6).mergePoint(Vec3.create(4, 5, 7))
      expectVec3Equality(box1.min, Vec3.create(1, 2, 3))
      expectVec3Equality(box1.max, Vec3.create(4, 5, 7))
    })
  })

  describe('.mergePoint', () => {
    it ('merges point into box', () => {
      let box1 = new BoundingBox(1, 2, 3, 4, 5, 6)
      BoundingBox.mergePoint(box1, Vec3.create(0, 2, 3), box1)
      expectVec3Equality(box1.min, Vec3.create(0, 2, 3))
      expectVec3Equality(box1.max, Vec3.create(4, 5, 6))

      box1 = new BoundingBox(1, 2, 3, 4, 5, 6)
      BoundingBox.mergePoint(box1, Vec3.create(1, 1, 3), box1)
      expectVec3Equality(box1.min, Vec3.create(1, 1, 3))
      expectVec3Equality(box1.max, Vec3.create(4, 5, 6))

      box1 = new BoundingBox(1, 2, 3, 4, 5, 6)
      BoundingBox.mergePoint(box1, Vec3.create(1, 2, 2), box1)
      expectVec3Equality(box1.min, Vec3.create(1, 2, 2))
      expectVec3Equality(box1.max, Vec3.create(4, 5, 6))

      box1 = new BoundingBox(1, 2, 3, 4, 5, 6)
      BoundingBox.mergePoint(box1, Vec3.create(5, 5, 6), box1)
      expectVec3Equality(box1.min, Vec3.create(1, 2, 3))
      expectVec3Equality(box1.max, Vec3.create(5, 5, 6))

      box1 = new BoundingBox(1, 2, 3, 4, 5, 6)
      BoundingBox.mergePoint(box1, Vec3.create(4, 6, 6), box1)
      expectVec3Equality(box1.min, Vec3.create(1, 2, 3))
      expectVec3Equality(box1.max, Vec3.create(4, 6, 6))

      box1 = new BoundingBox(1, 2, 3, 4, 5, 6)
      BoundingBox.mergePoint(box1, Vec3.create(4, 5, 7), box1)
      expectVec3Equality(box1.min, Vec3.create(1, 2, 3))
      expectVec3Equality(box1.max, Vec3.create(4, 5, 7))
    })
  })

  describe('.convert', () => {
    it ('converts from number[]', () => {
      const box1 = BoundingBox.convert([1, 2, 3, 4, 5, 6])
      expectVec3Equality(box1.min, Vec3.create(1, 2, 3))
      expectVec3Equality(box1.max, Vec3.create(4, 5, 6))
    })
  })

})
