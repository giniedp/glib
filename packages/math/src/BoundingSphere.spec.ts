import { BoundingBox, BoundingFrustum, BoundingSphere, IVec3, Mat4, Plane, Ray, Vec3 } from '@gglib/math'

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

  describe('#initFromArray', () => {
    it ('merges points', () => {
      expectComponents(new BoundingSphere().initFromArray([0, 0, 0, 1]), 0, 0, 0, 1)
    })
  })

  describe('.createFromArray', () => {
    it ('merges points', () => {
      expectComponents(BoundingSphere.createFromArray([0, 0, 0, 1]), 0, 0, 0, 1)
    })
  })

  describe('#initFromPoints', () => {
    it ('merges points', () => {
      const sphere = new BoundingSphere().initFromPoints([Vec3.create(0, 0, 0), Vec3.create(1, 1, 1)])
      expectComponents(sphere, 0.5, 0.5, 0.5, 0.8660254037844386)
    })
  })

  describe('.createFromPoints', () => {
    it ('merges points', () => {
      const sphere = BoundingSphere.createFromPoints([Vec3.create(0, 0, 0), Vec3.create(1, 1, 1)])
      expectComponents(sphere, 0.5, 0.5, 0.5, 0.8660254037844386)
    })
  })

  describe('#initFromPointsBuffer', () => {
    it ('merges points', () => {
      const sphere = new BoundingSphere().initFromPointsBuffer([0, 0, 0, 1, 1, 1])
      expectComponents(sphere, 0.5, 0.5, 0.5, 0.8660254037844386)
    })
  })

  describe('.createFromPointsBuffer', () => {
    it ('merges points', () => {
      const sphere = BoundingSphere.createFromPointsBuffer([0, 0, 0, 1, 1, 1])
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
      expect(new BoundingSphere(1, 2, 3, 4).toArray([])).toEqual([1, 2, 3, 4])
    })
  })

  describe('.copy', () => {
    it ('copies components into array', () => {
      expect(BoundingSphere.toArray(new BoundingSphere(1, 2, 3, 4), [])).toEqual([1, 2, 3, 4])
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

  describe('#intersectsRay', () => {
    it ('tests for intersection', () => {
      const sphere = BoundingSphere.create(1, 1, 1, 1)
      expect(sphere.intersectsRay(Ray.create(-1,  1,  1,  1,  0,  0))).toBe(true, 'from left')
      expect(sphere.intersectsRay(Ray.create( 3,  1,  1, -1,  0,  0))).toBe(true, 'from right')
      expect(sphere.intersectsRay(Ray.create( 1, -1,  1,  0,  1,  0))).toBe(true, 'from below')
      expect(sphere.intersectsRay(Ray.create( 1,  3,  1,  0, -1,  0))).toBe(true, 'from above')
      expect(sphere.intersectsRay(Ray.create( 1,  1, -1,  0,  0,  1))).toBe(true, 'from behind')
      expect(sphere.intersectsRay(Ray.create( 1,  1,  3,  0,  0, -1))).toBe(true, 'from infront')

      expect(sphere.intersectsRay(Ray.create(-1,  1,  1, -1,  0,  0))).toBe(false, 'away, left')
      expect(sphere.intersectsRay(Ray.create( 3,  1,  1,  1,  0,  0))).toBe(false, 'away, right')
      expect(sphere.intersectsRay(Ray.create( 1, -1,  1,  0, -1,  0))).toBe(false, 'away, below')
      expect(sphere.intersectsRay(Ray.create( 1,  3,  1,  0,  1,  0))).toBe(false, 'away, above')
      expect(sphere.intersectsRay(Ray.create( 1,  1, -1,  0,  0, -1))).toBe(false, 'away, behind')
      expect(sphere.intersectsRay(Ray.create( 1,  1,  3,  0,  0,  1))).toBe(false, 'away, infront')
    })
  })

  describe('#intersectsPlane', () => {
    it ('tests for intersection', () => {
      const sphere = BoundingSphere.create(1, 2, 3, 1)

      expect(sphere.intersectsPlane(Plane.create(1, 0, 0,  2.001))).toBe(false)
      expect(sphere.intersectsPlane(Plane.create(1, 0, 0,  2.000))).toBe(true)
      expect(sphere.intersectsPlane(Plane.create(1, 0, 0,  0.000))).toBe(true)
      expect(sphere.intersectsPlane(Plane.create(1, 0, 0, -0.001))).toBe(false)

      expect(sphere.intersectsPlane(Plane.create(0, 1, 0,  3.001))).toBe(false)
      expect(sphere.intersectsPlane(Plane.create(0, 1, 0,  3.000))).toBe(true)
      expect(sphere.intersectsPlane(Plane.create(0, 1, 0,  1.000))).toBe(true)
      expect(sphere.intersectsPlane(Plane.create(0, 1, 0, -1.001))).toBe(false)

      expect(sphere.intersectsPlane(Plane.create(0, 0, 1,  4.001))).toBe(false)
      expect(sphere.intersectsPlane(Plane.create(0, 0, 1,  4.000))).toBe(true)
      expect(sphere.intersectsPlane(Plane.create(0, 0, 1,  2.000))).toBe(true)
      expect(sphere.intersectsPlane(Plane.create(0, 0, 1, -2.001))).toBe(false)

      expect(sphere.intersectsPlane(Plane.create(-1, 0, 0, -2.001))).toBe(false)
      expect(sphere.intersectsPlane(Plane.create(-1, 0, 0, -2.000))).toBe(true)
      expect(sphere.intersectsPlane(Plane.create(-1, 0, 0,  0.000))).toBe(true)
      expect(sphere.intersectsPlane(Plane.create(-1, 0, 0,  0.001))).toBe(false)

      expect(sphere.intersectsPlane(Plane.create(0, -1, 0, -3.001))).toBe(false)
      expect(sphere.intersectsPlane(Plane.create(0, -1, 0, -3.000))).toBe(true)
      expect(sphere.intersectsPlane(Plane.create(0, -1, 0, -1.000))).toBe(true)
      expect(sphere.intersectsPlane(Plane.create(0, -1, 0, -0.999))).toBe(false)

      expect(sphere.intersectsPlane(Plane.create(0, 0, -1, -4.001))).toBe(false)
      expect(sphere.intersectsPlane(Plane.create(0, 0, -1, -4.000))).toBe(true)
      expect(sphere.intersectsPlane(Plane.create(0, 0, -1, -2.000))).toBe(true)
      expect(sphere.intersectsPlane(Plane.create(0, 0, -1, -1.999))).toBe(false)
    })
  })

  describe('#intersectsBox', () => {
    it ('tests for intersection', () => {
      const sphere = BoundingSphere.create(0.5, 0.5, 0.5, 0.5)

      expect(sphere.intersectsBox(BoundingBox.create(0, 0, 0, 1, 1, 1))).toBe(true)

      expect(sphere.intersectsBox(BoundingBox.create( 1.001, 0, 0,  2.000, 1, 1))).toBe(false)
      expect(sphere.intersectsBox(BoundingBox.create( 1.000, 0, 0,  2.000, 1, 1))).toBe(true)
      expect(sphere.intersectsBox(BoundingBox.create(-1.000, 0, 0,  0.000, 1, 1))).toBe(true)
      expect(sphere.intersectsBox(BoundingBox.create(-1.000, 0, 0, -0.001, 1, 1))).toBe(false)

      expect(sphere.intersectsBox(BoundingBox.create(0, 0,  1.001, 1, 1,  2.000))).toBe(false)
      expect(sphere.intersectsBox(BoundingBox.create(0, 0,  1.000, 1, 1,  2.000))).toBe(true)
      expect(sphere.intersectsBox(BoundingBox.create(0, 0, -1.000, 1, 1,  0.000))).toBe(true)
      expect(sphere.intersectsBox(BoundingBox.create(0, 0, -1.000, 1, 1, -0.001))).toBe(false)

      expect(sphere.intersectsBox(BoundingBox.create(0,  1.001, 0, 1,  2.000, 1))).toBe(false)
      expect(sphere.intersectsBox(BoundingBox.create(0,  1.000, 0, 1,  2.000, 1))).toBe(true)
      expect(sphere.intersectsBox(BoundingBox.create(0, -1.000, 0, 1,  0.000, 1))).toBe(true)
      expect(sphere.intersectsBox(BoundingBox.create(0, -1.000, 0, 1, -0.001, 1))).toBe(false)

    })
  })

  describe('#intersectsSphere', () => {
    it ('tests for intersection', () => {
      const sphere = BoundingSphere.create(1, 1, 1, 1)

      expect(sphere.intersectsSphere(BoundingSphere.create(1, 1, 1, 1))).toBe(true)

      expect(sphere.intersectsSphere(BoundingSphere.create( 3.001, 1, 1, 1))).toBe(false)
      expect(sphere.intersectsSphere(BoundingSphere.create( 3.000, 1, 1, 1))).toBe(true)
      expect(sphere.intersectsSphere(BoundingSphere.create(-1.000, 1, 1, 1))).toBe(true)
      expect(sphere.intersectsSphere(BoundingSphere.create(-1.001, 1, 1, 1))).toBe(false)

      expect(sphere.intersectsSphere(BoundingSphere.create(1,  3.001, 1, 1))).toBe(false)
      expect(sphere.intersectsSphere(BoundingSphere.create(1,  3.000, 1, 1))).toBe(true)
      expect(sphere.intersectsSphere(BoundingSphere.create(1, -1.000, 1, 1))).toBe(true)
      expect(sphere.intersectsSphere(BoundingSphere.create(1, -1.001, 1, 1))).toBe(false)

      expect(sphere.intersectsSphere(BoundingSphere.create(1, 1,  3.001, 1))).toBe(false)
      expect(sphere.intersectsSphere(BoundingSphere.create(1, 1,  3.000, 1))).toBe(true)
      expect(sphere.intersectsSphere(BoundingSphere.create(1, 1, -1.000, 1))).toBe(true)
      expect(sphere.intersectsSphere(BoundingSphere.create(1, 1, -1.001, 1))).toBe(false)
    })
  })

  describe('#containsPoint', () => {
    it ('tests for containment', () => {
      const sphere = BoundingSphere.create(0.5, 0.5, 0.5, 0.5)

      expect(sphere.intersectsPoint(Vec3.create(-0.001, 0.5, 0.5))).toBe(false)
      expect(sphere.intersectsPoint(Vec3.create( 0.000, 0.5, 0.5))).toBe(true)
      expect(sphere.intersectsPoint(Vec3.create( 0.001, 0.5, 0.5))).toBe(true)

      expect(sphere.intersectsPoint(Vec3.create(0.5, -0.001, 0.5))).toBe(false)
      expect(sphere.intersectsPoint(Vec3.create(0.5,  0.000, 0.5))).toBe(true)
      expect(sphere.intersectsPoint(Vec3.create(0.5,  0.001, 0.5))).toBe(true)

      expect(sphere.intersectsPoint(Vec3.create(0.5, 0.5, -0.001))).toBe(false)
      expect(sphere.intersectsPoint(Vec3.create(0.5, 0.5,  0.000))).toBe(true)
      expect(sphere.intersectsPoint(Vec3.create(0.5, 0.5,  0.001))).toBe(true)

      expect(sphere.intersectsPoint(Vec3.create(1 + 0.001, 0.5, 0.5))).toBe(false)
      expect(sphere.intersectsPoint(Vec3.create(1 + 0.000, 0.5, 0.5))).toBe(true)
      expect(sphere.intersectsPoint(Vec3.create(1 - 0.001, 0.5, 0.5))).toBe(true)

      expect(sphere.intersectsPoint(Vec3.create(0.5, 1 + 0.001, 0.5))).toBe(false)
      expect(sphere.intersectsPoint(Vec3.create(0.5, 1 + 0.000, 0.5))).toBe(true)
      expect(sphere.intersectsPoint(Vec3.create(0.5, 1 - 0.001, 0.5))).toBe(true)

      expect(sphere.intersectsPoint(Vec3.create(0.5, 0.5, 1 + 0.001))).toBe(false)
      expect(sphere.intersectsPoint(Vec3.create(0.5, 0.5, 1 + 0.000))).toBe(true)
      expect(sphere.intersectsPoint(Vec3.create(0.5, 0.5, 1 - 0.001))).toBe(true)
    })
  })

  describe('#containsBox', () => {
    it ('tests for containment', () => {
      const sphere = BoundingSphere.create(0.5, 0.5, 0.5, 0.5)

      // containment
      expect(sphere.containsBox(BoundingBox.create(0.25, 0.25, 0.25, 0.75, 0.75, 0.75))).toBe(true)

      // intersection
      expect(sphere.containsBox(BoundingBox.create(-1,  0,  0,  0,  1,  1))).toBe(false, 'left')
      expect(sphere.containsBox(BoundingBox.create( 1,  0,  0,  2,  1,  1))).toBe(false, 'right')
      expect(sphere.containsBox(BoundingBox.create( 0, -1,  0,  1, -0,  1))).toBe(false, 'below')
      expect(sphere.containsBox(BoundingBox.create( 0,  1,  0,  1,  2,  1))).toBe(false, 'above')
      expect(sphere.containsBox(BoundingBox.create( 0,  0, -1,  1,  1, -0))).toBe(false, 'behind')
      expect(sphere.containsBox(BoundingBox.create( 0,  0,  1,  1,  1,  2))).toBe(false, 'infront')

      // outside
      expect(sphere.containsBox(BoundingBox.create(-1.000, 0, 0, -0.001, 1, 1))).toBe(false, 'left')
      expect(sphere.containsBox(BoundingBox.create( 1.001, 0, 0,  2.000, 1, 1))).toBe(false, 'right')
      expect(sphere.containsBox(BoundingBox.create(0, -1.000, 0,  1, -0.001, 1))).toBe(false, 'below')
      expect(sphere.containsBox(BoundingBox.create(0,  1.001, 0,  1,  2.000, 1))).toBe(false, 'above')
      expect(sphere.containsBox(BoundingBox.create(0, 0, -1.000,  1, 1, -0.001))).toBe(false, 'behind')
      expect(sphere.containsBox(BoundingBox.create(0, 0,  1.001,  1, 1,  2.000))).toBe(false, 'infront')
    })
  })

  describe('#containsSphere', () => {
    it ('tests for containment', () => {
      const sphere = BoundingSphere.create(0.5, 0.5, 0.5, 0.5)

      // containment
      expect(sphere.containsSphere(BoundingSphere.create(0.5, 0.5, 0.5, 0.5))).toBe(true)

      // intersection
      expect(sphere.containsSphere(BoundingSphere.create(-1.0,  0.5,  0.5,  1))).toBe(false, 'left')
      expect(sphere.containsSphere(BoundingSphere.create( 2.0,  0.5,  0.5,  1))).toBe(false, 'right')
      expect(sphere.containsSphere(BoundingSphere.create( 0.5, -1.0,  0.5,  1))).toBe(false, 'below')
      expect(sphere.containsSphere(BoundingSphere.create( 0.5,  2.0,  0.5,  1))).toBe(false, 'above')
      expect(sphere.containsSphere(BoundingSphere.create( 0.5,  0.5, -1.0,  1))).toBe(false, 'behind')
      expect(sphere.containsSphere(BoundingSphere.create( 0.5,  0.5,  2.0,  1))).toBe(false, 'infront')

      // outside
      expect(sphere.containsSphere(BoundingSphere.create(-1.0,  0.5,  0.5,  0.999))).toBe(false, 'left')
      expect(sphere.containsSphere(BoundingSphere.create( 2.0,  0.5,  0.5,  0.999))).toBe(false, 'right')
      expect(sphere.containsSphere(BoundingSphere.create( 0.5, -1.0,  0.5,  0.999))).toBe(false, 'below')
      expect(sphere.containsSphere(BoundingSphere.create( 0.5,  2.0,  0.5,  0.999))).toBe(false, 'above')
      expect(sphere.containsSphere(BoundingSphere.create( 0.5,  0.5, -1.0,  0.999))).toBe(false, 'behind')
      expect(sphere.containsSphere(BoundingSphere.create( 0.5,  0.5,  2.0,  0.999))).toBe(false, 'infront')
    })
  })

  describe('#containsFrustum', () => {
    it ('tests for containment', () => {
      const frustum = new BoundingFrustum(Mat4.createIdentity())
      const r = Math.sqrt(3) + Number.EPSILON
      // containment
      expect(BoundingSphere.create(0, 0, 0, r).containsFrustum(frustum)).toBe(true)

      // intersection
      expect(BoundingSphere.create( 2,  2,  2, r).containsFrustum(frustum)).toBe(false)
      expect(BoundingSphere.create( 2,  2, -2, r).containsFrustum(frustum)).toBe(false)
      expect(BoundingSphere.create( 2, -2,  2, r).containsFrustum(frustum)).toBe(false)
      expect(BoundingSphere.create( 2, -2, -2, r).containsFrustum(frustum)).toBe(false)
      expect(BoundingSphere.create(-2,  2,  2, r).containsFrustum(frustum)).toBe(false)
      expect(BoundingSphere.create(-2,  2, -2, r).containsFrustum(frustum)).toBe(false)
      expect(BoundingSphere.create(-2, -2,  2, r).containsFrustum(frustum)).toBe(false)
      expect(BoundingSphere.create(-2, -2, -2, r).containsFrustum(frustum)).toBe(false)

      // outside
      expect(BoundingSphere.create( 2,  2,  2, r - Number.EPSILON).containsFrustum(frustum)).toBe(false)
      expect(BoundingSphere.create( 2,  2, -2, r - Number.EPSILON).containsFrustum(frustum)).toBe(false)
      expect(BoundingSphere.create( 2, -2,  2, r - Number.EPSILON).containsFrustum(frustum)).toBe(false)
      expect(BoundingSphere.create( 2, -2, -2, r - Number.EPSILON).containsFrustum(frustum)).toBe(false)
      expect(BoundingSphere.create(-2,  2,  2, r - Number.EPSILON).containsFrustum(frustum)).toBe(false)
      expect(BoundingSphere.create(-2,  2, -2, r - Number.EPSILON).containsFrustum(frustum)).toBe(false)
      expect(BoundingSphere.create(-2, -2,  2, r - Number.EPSILON).containsFrustum(frustum)).toBe(false)
      expect(BoundingSphere.create(-2, -2, -2, r - Number.EPSILON).containsFrustum(frustum)).toBe(false)
    })
  })

  describe('#containmentOfBox', () => {
    it ('tests for containment', () => {
      const sphere = BoundingSphere.create(0.5, 0.5, 0.5, 0.5)

      // containment
      expect(sphere.containmentOfBox(BoundingBox.create(0.25, 0.25, 0.25, 0.75, 0.75, 0.75))).toBe(2)

      // intersection
      expect(sphere.containmentOfBox(BoundingBox.create(-1,  0,  0,  0,  1,  1))).toBe(1, 'left')
      expect(sphere.containmentOfBox(BoundingBox.create( 1,  0,  0,  2,  1,  1))).toBe(1, 'right')
      expect(sphere.containmentOfBox(BoundingBox.create( 0, -1,  0,  1, -0,  1))).toBe(1, 'below')
      expect(sphere.containmentOfBox(BoundingBox.create( 0,  1,  0,  1,  2,  1))).toBe(1, 'above')
      expect(sphere.containmentOfBox(BoundingBox.create( 0,  0, -1,  1,  1, -0))).toBe(1, 'behind')
      expect(sphere.containmentOfBox(BoundingBox.create( 0,  0,  1,  1,  1,  2))).toBe(1, 'infront')

      // outside
      expect(sphere.containmentOfBox(BoundingBox.create(-1.000, 0, 0, -0.001, 1, 1))).toBe(0, 'left')
      expect(sphere.containmentOfBox(BoundingBox.create( 1.001, 0, 0,  2.000, 1, 1))).toBe(0, 'right')
      expect(sphere.containmentOfBox(BoundingBox.create(0, -1.000, 0,  1, -0.001, 1))).toBe(0, 'below')
      expect(sphere.containmentOfBox(BoundingBox.create(0,  1.001, 0,  1,  2.000, 1))).toBe(0, 'above')
      expect(sphere.containmentOfBox(BoundingBox.create(0, 0, -1.000,  1, 1, -0.001))).toBe(0, 'behind')
      expect(sphere.containmentOfBox(BoundingBox.create(0, 0,  1.001,  1, 1,  2.000))).toBe(0, 'infront')
    })
  })

  describe('#containmentOfSphere', () => {
    it ('tests for containment', () => {
      const sphere = BoundingSphere.create(0.5, 0.5, 0.5, 0.5)

      // containment
      expect(sphere.containmentOfSphere(BoundingSphere.create(0.5, 0.5, 0.5, 0.5))).toBe(2)

      // intersection
      expect(sphere.containmentOfSphere(BoundingSphere.create(-1.0,  0.5,  0.5,  1))).toBe(1, 'left')
      expect(sphere.containmentOfSphere(BoundingSphere.create( 2.0,  0.5,  0.5,  1))).toBe(1, 'right')
      expect(sphere.containmentOfSphere(BoundingSphere.create( 0.5, -1.0,  0.5,  1))).toBe(1, 'below')
      expect(sphere.containmentOfSphere(BoundingSphere.create( 0.5,  2.0,  0.5,  1))).toBe(1, 'above')
      expect(sphere.containmentOfSphere(BoundingSphere.create( 0.5,  0.5, -1.0,  1))).toBe(1, 'behind')
      expect(sphere.containmentOfSphere(BoundingSphere.create( 0.5,  0.5,  2.0,  1))).toBe(1, 'infront')

      // outside
      expect(sphere.containmentOfSphere(BoundingSphere.create(-1.0,  0.5,  0.5,  0.999))).toBe(0, 'left')
      expect(sphere.containmentOfSphere(BoundingSphere.create( 2.0,  0.5,  0.5,  0.999))).toBe(0, 'right')
      expect(sphere.containmentOfSphere(BoundingSphere.create( 0.5, -1.0,  0.5,  0.999))).toBe(0, 'below')
      expect(sphere.containmentOfSphere(BoundingSphere.create( 0.5,  2.0,  0.5,  0.999))).toBe(0, 'above')
      expect(sphere.containmentOfSphere(BoundingSphere.create( 0.5,  0.5, -1.0,  0.999))).toBe(0, 'behind')
      expect(sphere.containmentOfSphere(BoundingSphere.create( 0.5,  0.5,  2.0,  0.999))).toBe(0, 'infront')
    })
  })

  describe('#containmentOfFrustum', () => {
    it ('tests for containment', () => {
      const frustum = new BoundingFrustum(Mat4.createIdentity())
      const r = Math.sqrt(3) + Number.EPSILON
      // containment
      expect(BoundingSphere.create(0, 0, 0, r).containmentOfFrustum(frustum)).toBe(2)

      // intersection
      expect(BoundingSphere.create( 2,  2,  2, r).containmentOfFrustum(frustum)).toBe(1)
      expect(BoundingSphere.create( 2,  2, -2, r).containmentOfFrustum(frustum)).toBe(1)
      expect(BoundingSphere.create( 2, -2,  2, r).containmentOfFrustum(frustum)).toBe(1)
      expect(BoundingSphere.create( 2, -2, -2, r).containmentOfFrustum(frustum)).toBe(1)
      expect(BoundingSphere.create(-2,  2,  2, r).containmentOfFrustum(frustum)).toBe(1)
      expect(BoundingSphere.create(-2,  2, -2, r).containmentOfFrustum(frustum)).toBe(1)
      expect(BoundingSphere.create(-2, -2,  2, r).containmentOfFrustum(frustum)).toBe(1)
      expect(BoundingSphere.create(-2, -2, -2, r).containmentOfFrustum(frustum)).toBe(1)

      // outside
      expect(BoundingSphere.create( 2,  2,  2, r - Number.EPSILON).containmentOfFrustum(frustum)).toBe(0)
      expect(BoundingSphere.create( 2,  2, -2, r - Number.EPSILON).containmentOfFrustum(frustum)).toBe(0)
      expect(BoundingSphere.create( 2, -2,  2, r - Number.EPSILON).containmentOfFrustum(frustum)).toBe(0)
      expect(BoundingSphere.create( 2, -2, -2, r - Number.EPSILON).containmentOfFrustum(frustum)).toBe(0)
      expect(BoundingSphere.create(-2,  2,  2, r - Number.EPSILON).containmentOfFrustum(frustum)).toBe(0)
      expect(BoundingSphere.create(-2,  2, -2, r - Number.EPSILON).containmentOfFrustum(frustum)).toBe(0)
      expect(BoundingSphere.create(-2, -2,  2, r - Number.EPSILON).containmentOfFrustum(frustum)).toBe(0)
      expect(BoundingSphere.create(-2, -2, -2, r - Number.EPSILON).containmentOfFrustum(frustum)).toBe(0)
    })
  })
})
