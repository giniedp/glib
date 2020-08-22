import { BoundingBox, BoundingSphere, IVec3, Ray, Vec3, Vec4 } from './index'

describe('Ray', () => {

  function expectVec3Components(v: IVec3, parts: number[]) {
    expect(v.x).toBeCloseTo(parts[0], 10, 'x component')
    expect(v.y).toBeCloseTo(parts[1], 10, 'y component')
    expect(v.z).toBeCloseTo(parts[2], 10, 'z component')
  }

  describe('new', () => {
    it ('initializes with components', () => {
      expectVec3Components(new Ray().position, [0, 0, 0])
      expectVec3Components(new Ray().direction, [0, 0, 0])

      expectVec3Components(new Ray(1, 2, 3).position, [1, 2, 3])
      expectVec3Components(new Ray(1, 2, 3).direction, [0, 0, 0])

      expectVec3Components(new Ray(1, 2, 3, 4, 5, 6).position, [1, 2, 3])
      expectVec3Components(new Ray(1, 2, 3, 4, 5, 6).direction, [4, 5, 6])
    })
  })

  describe('#init', () => {
    it ('initializes the components', () => {
      expectVec3Components(new Ray().init(1, 2, 3, 4, 5, 6).position, [1, 2, 3])
      expectVec3Components(new Ray().init(1, 2, 3, 4, 5, 6).direction, [4, 5, 6])
      expectVec3Components(new Ray(1, 2, 3, 4, 5, 6).init().position, [0, 0, 0])
      expectVec3Components(new Ray(1, 2, 3, 4, 5, 6).init().direction, [0, 0, 0])
    })
  })

  describe('.create', () => {
    it ('initializes the components', () => {
      expectVec3Components(Ray.create().position, [0, 0, 0])
      expectVec3Components(Ray.create().direction, [0, 0, 0])

      expectVec3Components(Ray.create(1, 2, 3, 4, 5, 6).position, [1, 2, 3])
      expectVec3Components(Ray.create(1, 2, 3, 4, 5, 6).direction, [4, 5, 6])
    })
  })

  describe('#initFrom', () => {
    it ('takes components from other ray', () => {
      expectVec3Components(new Ray().initFrom(new Ray(1, 2, 3, 4, 5, 6)).position, [1, 2, 3])
      expectVec3Components(new Ray().initFrom(new Ray(1, 2, 3, 4, 5, 6)).direction, [4, 5, 6])
    })
  })

  describe('.createFrom', () => {
    it ('takes components from other ray', () => {
      expectVec3Components(Ray.createFrom(new Ray(1, 2, 3, 4, 5, 6)).position, [1, 2, 3])
      expectVec3Components(Ray.createFrom(new Ray(1, 2, 3, 4, 5, 6)).direction, [4, 5, 6])
    })
  })

  describe('#initFromVectors', () => {
    it ('takes components from other ray', () => {
      expectVec3Components(new Ray().initV(Vec3.create(1, 2, 3), Vec3.create(4, 5, 6)).position, [1, 2, 3])
      expectVec3Components(new Ray().initV(Vec3.create(1, 2, 3), Vec3.create(4, 5, 6)).direction, [4, 5, 6])
    })
  })

  describe('.createFromVectors', () => {
    it ('takes components from other ray', () => {
      expectVec3Components(Ray.createV(Vec3.create(1, 2, 3), Vec3.create(4, 5, 6)).position, [1, 2, 3])
      expectVec3Components(Ray.createV(Vec3.create(1, 2, 3), Vec3.create(4, 5, 6)).direction, [4, 5, 6])
    })
  })

  describe('#equals', () => {
    it ('compares all components', () => {
      expect(Ray.create(0, 0, 0, 0, 0, 0).equals(Ray.create(0, 0, 0, 0, 0, 0))).toBe(true)
      expect(Ray.create(1, 0, 0, 0, 0, 0).equals(Ray.create(1, 0, 0, 0, 0, 0))).toBe(true)
      expect(Ray.create(0, 1, 0, 0, 0, 0).equals(Ray.create(0, 1, 0, 0, 0, 0))).toBe(true)
      expect(Ray.create(0, 0, 1, 0, 0, 0).equals(Ray.create(0, 0, 1, 0, 0, 0))).toBe(true)
      expect(Ray.create(0, 0, 0, 1, 0, 0).equals(Ray.create(0, 0, 0, 1, 0, 0))).toBe(true)
      expect(Ray.create(0, 0, 0, 0, 1, 0).equals(Ray.create(0, 0, 0, 0, 1, 0))).toBe(true)
      expect(Ray.create(0, 0, 0, 0, 0, 1).equals(Ray.create(0, 0, 0, 0, 0, 1))).toBe(true)

      expect(Ray.create(1, 0, 0, 0, 0, 0).equals(Ray.create(0, 0, 0, 0, 0, 0))).toBe(false)
      expect(Ray.create(0, 1, 0, 0, 0, 0).equals(Ray.create(0, 0, 0, 0, 0, 0))).toBe(false)
      expect(Ray.create(0, 0, 1, 0, 0, 0).equals(Ray.create(0, 0, 0, 0, 0, 0))).toBe(false)
      expect(Ray.create(0, 0, 0, 1, 0, 0).equals(Ray.create(0, 0, 0, 0, 0, 0))).toBe(false)
      expect(Ray.create(0, 0, 0, 0, 1, 0).equals(Ray.create(0, 0, 0, 0, 0, 0))).toBe(false)
      expect(Ray.create(0, 0, 0, 0, 0, 1).equals(Ray.create(0, 0, 0, 0, 0, 0))).toBe(false)
    })
  })

  describe('.equals', () => {
    it ('compares all components', () => {
      expect(Ray.equals(Ray.create(0, 0, 0, 0, 0, 0), Ray.create(0, 0, 0, 0, 0, 0))).toBe(true)
      expect(Ray.equals(Ray.create(1, 0, 0, 0, 0, 0), Ray.create(1, 0, 0, 0, 0, 0))).toBe(true)
      expect(Ray.equals(Ray.create(0, 1, 0, 0, 0, 0), Ray.create(0, 1, 0, 0, 0, 0))).toBe(true)
      expect(Ray.equals(Ray.create(0, 0, 1, 0, 0, 0), Ray.create(0, 0, 1, 0, 0, 0))).toBe(true)
      expect(Ray.equals(Ray.create(0, 0, 0, 1, 0, 0), Ray.create(0, 0, 0, 1, 0, 0))).toBe(true)
      expect(Ray.equals(Ray.create(0, 0, 0, 0, 1, 0), Ray.create(0, 0, 0, 0, 1, 0))).toBe(true)
      expect(Ray.equals(Ray.create(0, 0, 0, 0, 0, 1), Ray.create(0, 0, 0, 0, 0, 1))).toBe(true)

      expect(Ray.equals(Ray.create(1, 0, 0, 0, 0, 0), Ray.create(0, 0, 0, 0, 0, 0))).toBe(false)
      expect(Ray.equals(Ray.create(0, 1, 0, 0, 0, 0), Ray.create(0, 0, 0, 0, 0, 0))).toBe(false)
      expect(Ray.equals(Ray.create(0, 0, 1, 0, 0, 0), Ray.create(0, 0, 0, 0, 0, 0))).toBe(false)
      expect(Ray.equals(Ray.create(0, 0, 0, 1, 0, 0), Ray.create(0, 0, 0, 0, 0, 0))).toBe(false)
      expect(Ray.equals(Ray.create(0, 0, 0, 0, 1, 0), Ray.create(0, 0, 0, 0, 0, 0))).toBe(false)
      expect(Ray.equals(Ray.create(0, 0, 0, 0, 0, 1), Ray.create(0, 0, 0, 0, 0, 0))).toBe(false)
    })
  })

  describe('#clone', () => {
    it('clones', () => {
      const R = new Ray(1, 2, 3, 4, 5, 6)
      expect(R.clone()).not.toBe(R)
      expect(R.clone().position).not.toBe(R.position)
      expect(R.clone().direction).not.toBe(R.direction)
      expectVec3Components(R.clone().position, [1, 2, 3])
      expectVec3Components(R.clone().direction, [4, 5, 6])
    })
  })

  describe('.clone', () => {
    it('clones', () => {
      const R = new Ray(1, 2, 3, 4, 5, 6)
      expect(Ray.clone(R)).not.toBe(R)
      expect(Ray.clone(R).position).not.toBe(R.position)
      expect(Ray.clone(R).direction).not.toBe(R.direction)
      expectVec3Components(Ray.clone(R).position, [1, 2, 3])
      expectVec3Components(Ray.clone(R).direction, [4, 5, 6])
    })
  })

  describe('#positionAt', () => {
    it('returns position at distance', () => {
      expectVec3Components(new Ray(1, 2, 3, 1, 1, 1).positionAt(10), [11, 12, 13])
    })
  })

  describe('.positionAt', () => {
    it('returns position at distance', () => {
      expectVec3Components(Ray.positionAt(new Ray(1, 2, 3, 1, 1, 1), 10), [11, 12, 13])
    })
  })

  describe('intersection', () => {
    it('#intersectsSphere', () => {
      const sphere = new BoundingSphere(0, 0, 0, 1)

      expect(Ray.create(0, 0, 0, 1, 0, 0).intersectsSphere(sphere)).toBe(true, 'inside')

      expect(Ray.create(-2, 0, 0,  1, 0, 0).intersectsSphere(sphere)).toBe(true, 'left to right')
      expect(Ray.create( 2, 0, 0, -1, 0, 0).intersectsSphere(sphere)).toBe(true, 'right to left')

      expect(Ray.create(0, -2, 0, 0,  1, 0).intersectsSphere(sphere)).toBe(true, 'top to bottom')
      expect(Ray.create(0,  2, 0, 0, -1, 0).intersectsSphere(sphere)).toBe(true, 'bottom to top')

      expect(Ray.create(0, 0, -2, 0, 0,  1).intersectsSphere(sphere)).toBe(true, 'back to front')
      expect(Ray.create(0, 0,  2, 0, 0, -1).intersectsSphere(sphere)).toBe(true, 'front to back')

      // away from sphere
      expect(Ray.create(-2, 0, 0, -1, 0, 0).intersectsSphere(sphere)).toEqual(false)
      expect(Ray.create( 2, 0, 0,  1, 0, 0).intersectsSphere(sphere)).toEqual(false)

      expect(Ray.create(0, -2, 0, 0, -1, 0).intersectsSphere(sphere)).toEqual(false)
      expect(Ray.create(0,  2, 0, 0,  1, 0).intersectsSphere(sphere)).toEqual(false)

      expect(Ray.create(0, 0, -2, 0, 0, -1).intersectsSphere(sphere)).toEqual(false)
      expect(Ray.create(0, 0,  2, 0, 0,  1).intersectsSphere(sphere)).toEqual(false)

      // along the spherer
      expect(Ray.create(-2, 1, 1,  1, 0, 0).intersectsSphere(sphere)).toEqual(false)
      expect(Ray.create( 2, 1, 1, -1, 0, 0).intersectsSphere(sphere)).toEqual(false)

      expect(Ray.create(1, -2, 1, 0,  1, 0).intersectsSphere(sphere)).toEqual(false)
      expect(Ray.create(1,  2, 1, 0, -1, 0).intersectsSphere(sphere)).toEqual(false)

      expect(Ray.create(1, 1, -2, 0, 0,  1).intersectsSphere(sphere)).toEqual(false)
      expect(Ray.create(1, 1,  2, 0, 0, -1).intersectsSphere(sphere)).toEqual(false)
    })

    it('#intersectsSphereAt', () => {
      const sphere = new BoundingSphere(0, 0, 0, 1)

      expect(Ray.create(0, 0, 0, 1, 0, 0).intersectsSphereAt(sphere)).toBe(1, 'inside')
      expect(Ray.create(0.5, 0, 0, 1, 0, 0).intersectsSphereAt(sphere)).toBe(0.5, 'inside')

      expect(Ray.create(-2, 0, 0,  1, 0, 0).intersectsSphereAt(sphere)).toBe(1, 'left to right')
      expect(Ray.create( 2, 0, 0, -1, 0, 0).intersectsSphereAt(sphere)).toBe(1, 'right to left')

      expect(Ray.create(0, -2, 0, 0,  1, 0).intersectsSphereAt(sphere)).toBe(1, 'top to bottom')
      expect(Ray.create(0,  2, 0, 0, -1, 0).intersectsSphereAt(sphere)).toBe(1, 'bottom to top')

      expect(Ray.create(0, 0, -2, 0, 0,  1).intersectsSphereAt(sphere)).toBe(1, 'back to front')
      expect(Ray.create(0, 0,  2, 0, 0, -1).intersectsSphereAt(sphere)).toBe(1, 'front to back')

      // away from sphere
      expect(Ray.create(-2, 0, 0, -1, 0, 0).intersectsSphereAt(sphere)).toEqual(Number.NaN)
      expect(Ray.create( 2, 0, 0,  1, 0, 0).intersectsSphereAt(sphere)).toEqual(Number.NaN)

      expect(Ray.create(0, -2, 0, 0, -1, 0).intersectsSphereAt(sphere)).toEqual(Number.NaN)
      expect(Ray.create(0,  2, 0, 0,  1, 0).intersectsSphereAt(sphere)).toEqual(Number.NaN)

      expect(Ray.create(0, 0, -2, 0, 0, -1).intersectsSphereAt(sphere)).toEqual(Number.NaN)
      expect(Ray.create(0, 0,  2, 0, 0,  1).intersectsSphereAt(sphere)).toEqual(Number.NaN)

      // along the spherer
      expect(Ray.create(-2, 1, 1,  1, 0, 0).intersectsSphereAt(sphere)).toEqual(Number.NaN)
      expect(Ray.create( 2, 1, 1, -1, 0, 0).intersectsSphereAt(sphere)).toEqual(Number.NaN)

      expect(Ray.create(1, -2, 1, 0,  1, 0).intersectsSphereAt(sphere)).toEqual(Number.NaN)
      expect(Ray.create(1,  2, 1, 0, -1, 0).intersectsSphereAt(sphere)).toEqual(Number.NaN)

      expect(Ray.create(1, 1, -2, 0, 0,  1).intersectsSphereAt(sphere)).toEqual(Number.NaN)
      expect(Ray.create(1, 1,  2, 0, 0, -1).intersectsSphereAt(sphere)).toEqual(Number.NaN)
    })

    it('#intersectsBox', () => {
      const box = new BoundingBox(-0.9, -0.9, -0.9, 0.9, 0.9, 0.9)

      expect(Ray.create(0, 0, 0, 1, 0, 0).intersectsBox(box)).toBe(true)

      expect(Ray.create(-2, 0, 0,  1, 0, 0).intersectsBox(box)).toBe(true, 'left to right')
      expect(Ray.create( 2, 0, 0, -1, 0, 0).intersectsBox(box)).toBe(true, 'right to left')

      expect(Ray.create(0, -2, 0, 0,  1, 0).intersectsBox(box)).toBe(true, 'top to bottom')
      expect(Ray.create(0,  2, 0, 0, -1, 0).intersectsBox(box)).toBe(true, 'bottom to top')

      expect(Ray.create(0, 0, -2, 0, 0,  1).intersectsBox(box)).toBe(true, 'back to front')
      expect(Ray.create(0, 0,  2, 0, 0, -1).intersectsBox(box)).toBe(true, 'front to back')

      // away from sphere
      expect(Ray.create(-2, 0, 0, -1, 0, 0).intersectsBox(box)).toEqual(false)
      expect(Ray.create( 2, 0, 0,  1, 0, 0).intersectsBox(box)).toEqual(false)

      expect(Ray.create(0, -2, 0, 0, -1, 0).intersectsBox(box)).toEqual(false)
      expect(Ray.create(0,  2, 0, 0,  1, 0).intersectsBox(box)).toEqual(false)

      expect(Ray.create(0, 0, -2, 0, 0, -1).intersectsBox(box)).toEqual(false)
      expect(Ray.create(0, 0,  2, 0, 0,  1).intersectsBox(box)).toEqual(false)

      // along the spherer
      expect(Ray.create(-2, 1, 1,  1, 0, 0).intersectsBox(box)).toEqual(false)
      expect(Ray.create( 2, 1, 1, -1, 0, 0).intersectsBox(box)).toEqual(false)

      expect(Ray.create(1, -2, 1, 0,  1, 0).intersectsBox(box)).toEqual(false)
      expect(Ray.create(1,  2, 1, 0, -1, 0).intersectsBox(box)).toEqual(false)

      expect(Ray.create(1, 1, -2, 0, 0,  1).intersectsBox(box)).toEqual(false)
      expect(Ray.create(1, 1,  2, 0, 0, -1).intersectsBox(box)).toEqual(false)

    })

    it('#intersectsBoxAt', () => {
      const box = new BoundingBox(-0.9, -0.9, -0.9, 0.9, 0.9, 0.9)

      expect(Ray.create(0, 0, 0, 1, 0, 0).intersectsBoxAt(box)).toBeCloseTo(0)

      expect(Ray.create(-2, 0, 0,  1, 0, 0).intersectsBoxAt(box)).toBe(1.1, 'left to right')
      expect(Ray.create( 2, 0, 0, -1, 0, 0).intersectsBoxAt(box)).toBe(1.1, 'right to left')

      expect(Ray.create(0, -2, 0, 0,  1, 0).intersectsBoxAt(box)).toBe(1.1, 'top to bottom')
      expect(Ray.create(0,  2, 0, 0, -1, 0).intersectsBoxAt(box)).toBe(1.1, 'bottom to top')

      expect(Ray.create(0, 0, -2, 0, 0,  1).intersectsBoxAt(box)).toBe(1.1, 'back to front')
      expect(Ray.create(0, 0,  2, 0, 0, -1).intersectsBoxAt(box)).toBe(1.1, 'front to back')

      // away from sphere
      expect(Ray.create(-2, 0, 0, -1, 0, 0).intersectsBoxAt(box)).toEqual(Number.NaN)
      expect(Ray.create( 2, 0, 0,  1, 0, 0).intersectsBoxAt(box)).toEqual(Number.NaN)

      expect(Ray.create(0, -2, 0, 0, -1, 0).intersectsBoxAt(box)).toEqual(Number.NaN)
      expect(Ray.create(0,  2, 0, 0,  1, 0).intersectsBoxAt(box)).toEqual(Number.NaN)

      expect(Ray.create(0, 0, -2, 0, 0, -1).intersectsBoxAt(box)).toEqual(Number.NaN)
      expect(Ray.create(0, 0,  2, 0, 0,  1).intersectsBoxAt(box)).toEqual(Number.NaN)

      // along the spherer
      expect(Ray.create(-2, 1, 1,  1, 0, 0).intersectsBoxAt(box)).toEqual(Number.NaN)
      expect(Ray.create( 2, 1, 1, -1, 0, 0).intersectsBoxAt(box)).toEqual(Number.NaN)

      expect(Ray.create(1, -2, 1, 0,  1, 0).intersectsBoxAt(box)).toEqual(Number.NaN)
      expect(Ray.create(1,  2, 1, 0, -1, 0).intersectsBoxAt(box)).toEqual(Number.NaN)

      expect(Ray.create(1, 1, -2, 0, 0,  1).intersectsBoxAt(box)).toEqual(Number.NaN)
      expect(Ray.create(1, 1,  2, 0, 0, -1).intersectsBoxAt(box)).toEqual(Number.NaN)

    })

    it('#intersectsPlane', () => {
      const ray1 = new Ray(0, 0, 0, 0, 1, 0)
      const plane = Vec4.create(0, 1, 0, 1)
      expect(ray1.intersectsPlane(plane)).toBe(true)
      expect(ray1.intersectsPlaneAt(plane)).toBeCloseTo(1)
    })

    // it('#intersectsTriangle', () => {
    //   const R = Ray.createFromVectors(Vec3.Zero, Vec3.Forward)
    //   const T1 = Vec3.create(-1, -1, -1)
    //   const T2 = Vec3.create( 0,  1, -1)
    //   const T3 = Vec3.create( 1, -1, -1)
    //   expect(R.intersectsTriangle(T1, T2, T3)).toBe(true)
    //   expect(R.intersectsTriangleAt(T1, T2, T3)).toBeCloseTo(-1)
    // })
  })
})
