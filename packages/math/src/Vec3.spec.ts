import { IVec3, Mat2, Mat3, Mat4, Quat, Vec3 } from './index'

describe('Vec3', () => {

  function expectComponents(v: IVec3, x: number, y: number, z: number) {
    expect(v.x).toBeCloseTo(x, 10, 'x component of Vec3 invalid')
    expect(v.y).toBeCloseTo(y, 10, 'y component of Vec3 invalid')
    expect(v.z).toBeCloseTo(z, 10, 'z component of Vec3 invalid')
  }

  function expectEquality(v1: IVec3, v2: IVec3) {
    expect(v1.x).toBeCloseTo(v2.x, 10, 'x component of Vec3 invalid')
    expect(v1.y).toBeCloseTo(v2.y, 10, 'y component of Vec3 invalid')
    expect(v1.z).toBeCloseTo(v2.z, 10, 'z component of Vec3 invalid')
  }

  let a = new Vec3()
  let b = new Vec3()
  let c = new Vec3()
  let d = new Vec3()

  beforeEach(() => {
    a = new Vec3()
    b = new Vec3()
    c = new Vec3()
    d = new Vec3()
  })

  describe('#constructor', () => {
    it ('initializes all components', () => {
      let v = new Vec3(1, 2, 3)
      expectComponents(v, 1, 2, 3)
    })

    it ('is valid without parameters', () => {
      let v = new Vec3()
      expectComponents(v, 0, 0, 0)
    })
  })

  describe('#setX', () => {
    it ('set the value', () => expectComponents(a.setX(1), 1, 0, 0))
    it ('returns same instance', () => expect(a.setX(1)).toBe(a))
  })
  describe('#setY', () => {
    it ('set the value', () => expectComponents(a.setY(1), 0, 1, 0))
    it ('returns same instance', () => expect(a.setY(1)).toBe(a))
  })
  describe('#setZ', () => {
    it ('set the value', () => expectComponents(a.setZ(1), 0, 0, 1))
    it ('returns same instance', () => expect(a.setZ(1)).toBe(a))
  })
  describe('#set', () => {
    it ('set x value', () => expectComponents(a.set(0, 1), 1, 0, 0))
    it ('set x value', () => expectComponents(a.set('x', 1), 1, 0, 0))
    it ('set y value', () => expectComponents(a.set(1, 1), 0, 1, 0))
    it ('set y value', () => expectComponents(a.set('y', 1), 0, 1, 0))
    it ('set z value', () => expectComponents(a.set(2, 1), 0, 0, 1))
    it ('set z value', () => expectComponents(a.set('z', 1), 0, 0, 1))
    it ('returns same instance', () => expect(a.set(0, 1)).toBe(a))
  })
  describe('#get', () => {
    beforeEach(() => {
      a = new Vec3(1, 2, 3)
    })
    it ('set x value', () => expect(a.get(0)).toEqual(1))
    it ('set x value', () => expect(a.get('x')).toEqual(1))
    it ('set y value', () => expect(a.get(1)).toEqual(2))
    it ('set y value', () => expect(a.get('y')).toEqual(2))
    it ('set z value', () => expect(a.get(2)).toEqual(3))
    it ('set z value', () => expect(a.get('z')).toEqual(3))
  })
  describe('#init', () => {
    it ('inits all components', () => expectComponents(a.init(1, 2, 3), 1, 2, 3))
    it ('returns same instance', () => expect(a.init(1, 2, 3)).toBe(a))
  })
  describe('#initZero', () => {
    it ('creates a new Vec3', () => {
      expectComponents(new Vec3(1, 2, 3).initZero(), 0, 0, 0)
    })
  })
  describe('.createZero', () => {
    it ('creates a new Vec3', () => {
      expectComponents(Vec3.createZero(), 0, 0, 0)
    })
  })
  describe('#initOne', () => {
    it ('creates a new Vec3', () => {
      expectComponents(new Vec3(1, 2, 3).initOne(), 1, 1, 1)
    })
  })
  describe('.createOne', () => {
    it ('creates a new Vec3', () => {
      expectComponents(Vec3.createOne(), 1, 1, 1)
    })
  })
  describe('#initFrom', () => {
    beforeEach(() => {
      b = new Vec3(1, 2, 3)
    })
    it ('inits all components', () => expectComponents(a.initFrom(b), 1, 2, 3))
    it ('returns same instance', () => expect(a.initFrom(b)).toBe(a))
  })
  describe('.createFrom', () => {
    beforeEach(() => {
      b = new Vec3(1, 2, 3)
    })
    it ('inits all components', () => expectComponents(Vec3.createFrom(b), 1, 2, 3))
  })
  describe('#initFromBuffer', () => {
    it ('inits all components', () => expectComponents(a.initFromArray([1, 2, 3, 4], 1), 2, 3, 4))
    it ('returns same instance', () => expect(a.initFromArray([1, 2, 3, 4, 5], 1)).toBe(a))
  })
  describe('.createFromBuffer', () => {
    it ('inits all components', () => expectComponents(Vec3.createFromArray([1, 2, 3, 4], 1), 2, 3, 4))
  })
  describe('#clone', () => {
    beforeEach(() => {
      a = new Vec3(1, 2, 3)
    })
    it ('clones all components', () => expectComponents(a.clone(), 1, 2, 3))
    it ('returns new instance', () => expect(a.clone()).not.toBe(a))
  })
  describe('.clone', () => {
    beforeEach(() => {
      a = new Vec3(1, 2, 3)
    })
    it ('clones all components', () => expectComponents(Vec3.clone(a), 1, 2, 3))
    it ('returns new instance', () => expect(Vec3.clone(a)).not.toBe(a))
  })
  describe('#toArray', () => {
    beforeEach(() => {
      a = new Vec3(1, 2, 3)
    })
    it ('copies components', () => expect(a.toArray()).toEqual([1, 2, 3]))
    it ('copies components at offset', () => expect(a.toArray([0, 0, 0, 0, 0], 1)).toEqual([0, 1, 2, 3, 0]))
  })
  describe('.toArray', () => {
    beforeEach(() => {
      a = new Vec3(1, 2, 3)
    })
    it ('copies components', () => expect(Vec3.toArray(a, [])).toEqual([1, 2, 3]))
    it ('copies components at offset', () => expect(Vec3.toArray(a, [0, 0, 0, 0, 0], 1)).toEqual([0, 1, 2, 3, 0]))
  })
  describe('#equals', () => {
    it ('compares components', () => {
      expect(Vec3.create(0, 0, 0).equals(Vec3.create(0, 0, 0))).toBe(true)
      expect(Vec3.create(1, 0, 0).equals(Vec3.create(1, 0, 0))).toBe(true)
      expect(Vec3.create(0, 1, 0).equals(Vec3.create(0, 1, 0))).toBe(true)
      expect(Vec3.create(0, 0, 1).equals(Vec3.create(0, 0, 1))).toBe(true)
      expect(Vec3.create(0, 0, 0).equals(Vec3.create(1, 0, 0))).toBe(false)
      expect(Vec3.create(0, 0, 0).equals(Vec3.create(0, 1, 0))).toBe(false)
      expect(Vec3.create(0, 0, 0).equals(Vec3.create(0, 0, 1))).toBe(false)
    })
  })
  describe('.equals', () => {
    it ('compares components', () => {
      expect(Vec3.equals(Vec3.create(0, 0, 0), Vec3.create(0, 0, 0))).toBe(true)
      expect(Vec3.equals(Vec3.create(1, 0, 0), Vec3.create(1, 0, 0))).toBe(true)
      expect(Vec3.equals(Vec3.create(0, 1, 0), Vec3.create(0, 1, 0))).toBe(true)
      expect(Vec3.equals(Vec3.create(0, 0, 1), Vec3.create(0, 0, 1))).toBe(true)
      expect(Vec3.equals(Vec3.create(0, 0, 0), Vec3.create(1, 0, 0))).toBe(false)
      expect(Vec3.equals(Vec3.create(0, 0, 0), Vec3.create(0, 1, 0))).toBe(false)
      expect(Vec3.equals(Vec3.create(0, 0, 0), Vec3.create(0, 0, 1))).toBe(false)
    })
  })
  describe('#length', () => {
    it ('calculates length', () => {
      expect(Vec3.create(2, 0, 0).length()).toBe(2)
      expect(Vec3.create(0, 3, 0).length()).toBe(3)
      expect(Vec3.create(0, 0, 4).length()).toBe(4)
    })
  })
  describe('.len', () => {
    it ('calculates length', () => {
      expect(Vec3.len(Vec3.create(2, 0, 0))).toBe(2)
      expect(Vec3.len(Vec3.create(0, 3, 0))).toBe(3)
      expect(Vec3.len(Vec3.create(0, 0, 4))).toBe(4)
    })
  })
  describe('#lengthSquared', () => {
    it ('calculates length', () => {
      expect(new Vec3(2, 0, 0).lengthSquared()).toBe(4)
      expect(new Vec3(0, 3, 0).lengthSquared()).toBe(9)
      expect(new Vec3(0, 0, 4).lengthSquared()).toBe(16)
    })
  })
  describe('.lengthSquared', () => {
    it ('calculates length', () => {
      expect(Vec3.lengthSquared(new Vec3(2, 0, 0))).toBe(4)
      expect(Vec3.lengthSquared(new Vec3(0, 3, 0))).toBe(9)
      expect(Vec3.lengthSquared(new Vec3(0, 0, 4))).toBe(16)
    })
  })
  describe('#distance', () => {
    it ('calculates distance', () => {
      expect(new Vec3(2, 0, 0).distance(new Vec3(4, 0, 0))).toBe(2)
      expect(new Vec3(0, 3, 0).distance(new Vec3(0, 6, 0))).toBe(3)
      expect(new Vec3(0, 0, 4).distance(new Vec3(0, 0, 8))).toBe(4)
    })
  })
  describe('.distance', () => {
    it ('calculates distance', () => {
      expect(Vec3.distance(new Vec3(2, 0, 0), new Vec3(4, 0, 0))).toBe(2)
      expect(Vec3.distance(new Vec3(0, 3, 0), new Vec3(0, 6, 0))).toBe(3)
      expect(Vec3.distance(new Vec3(0, 0, 4), new Vec3(0, 0, 8))).toBe(4)
    })
  })
  describe('#distanceSquared', () => {
    it ('calculates distance', () => {
      expect(new Vec3(2, 0, 0).distanceSquared(new Vec3(4, 0, 0))).toBe(4)
      expect(new Vec3(0, 3, 0).distanceSquared(new Vec3(0, 6, 0))).toBe(9)
      expect(new Vec3(0, 0, 4).distanceSquared(new Vec3(0, 0, 8))).toBe(16)
    })
  })
  describe('.distanceSquared', () => {
    it ('calculates distance', () => {
      expect(Vec3.distanceSquared(new Vec3(2, 0, 0), new Vec3(4, 0, 0))).toBe(4)
      expect(Vec3.distanceSquared(new Vec3(0, 3, 0), new Vec3(0, 6, 0))).toBe(9)
      expect(Vec3.distanceSquared(new Vec3(0, 0, 4), new Vec3(0, 0, 8))).toBe(16)
    })
  })
  describe('#dot', () => {
    it ('calculates dot', () => {
      expect(Vec3.create(2, 0, 0).dot(Vec3.create(4, 0, 0))).toBe(8)
      expect(Vec3.create(0, 3, 0).dot(Vec3.create(0, 6, 0))).toBe(18)
      expect(Vec3.create(0, 0, 4).dot(Vec3.create(0, 0, 8))).toBe(32)
    })
  })
  describe('.dot', () => {
    it ('calculates dot', () => {
      expect(Vec3.dot(Vec3.create(2, 0, 0), Vec3.create(4, 0, 0))).toBe(8)
      expect(Vec3.dot(Vec3.create(0, 3, 0), Vec3.create(0, 6, 0))).toBe(18)
      expect(Vec3.dot(Vec3.create(0, 0, 4), Vec3.create(0, 0, 8))).toBe(32)
    })
  })
  describe('#cross', () => {
    it ('calculates cross product', () => {
      expectComponents(Vec3.create(1, 0, 0).cross(Vec3.create(0, 1, 0)), 0, 0, 1)
      expectComponents(Vec3.create(0, 1, 0).cross(Vec3.create(0, 0, 1)), 1, 0, 0)
      expectComponents(Vec3.create(0, 0, 1).cross(Vec3.create(1, 0, 0)), 0, 1, 0)
    })
  })
  describe('.cross', () => {
    it ('calculates cross product', () => {
      expectComponents(Vec3.cross(Vec3.create(1, 0, 0), Vec3.create(0, 1, 0)), 0, 0, 1)
      expectComponents(Vec3.cross(Vec3.create(0, 1, 0), Vec3.create(0, 0, 1)), 1, 0, 0)
      expectComponents(Vec3.cross(Vec3.create(0, 0, 1), Vec3.create(1, 0, 0)), 0, 1, 0)
    })
  })
  describe('#normalize', () => {
    it ('normalizes', () => expect(new Vec3(1, 2, 3).normalize().length()).toBeCloseTo(1))
  })
  describe('.normalize', () => {
    it ('normalizes', () => expect(Vec3.len(Vec3.normalize(new Vec3(1, 2, 3)))).toBeCloseTo(1))
  })
  describe('#invert', () => {
    it ('inverts', () => expectComponents(new Vec3(2, 4, 8).invert(), 0.5, 0.25, 0.125))
    it ('return instance', () => expect(a.init(2, 4, 8).invert()).toBe(a))
  })
  describe('.invert', () => {
    it ('inverts', () => expectComponents(Vec3.invert(new Vec3(2, 4, 8)), 0.5, 0.25, 0.125))
  })
  describe('#negate', () => {
    it ('negates', () => expectComponents(new Vec3(2, 4, 8).negate(), -2, -4, -8))
    it ('return instance', () => expect(a.init(2, 4, 8).negate()).toBe(a))
  })
  describe('.negate', () => {
    it ('negates', () => expectComponents(Vec3.negate(new Vec3(2, 4, 8)), -2, -4, -8))
  })
  describe('add operations', () => {
    beforeEach(() => {
      a = new Vec3(1, 2, 3)
      b = new Vec3(5, 6, 7)
      c = new Vec3(6, 8, 10)
    })
    describe('#add', () => {
      it ('adds', () => expectEquality(a.add(b), c))
      it ('returns instance', () => expect(a.add(b)).toBe(a))
    })
    describe('.add', () => {
      it ('adds', () => expectEquality(Vec3.add(a, b), c))
      it ('returns new instance', () => {
        let res = Vec3.add(a, b)
        expect(res).not.toBe(a)
        expect(res).not.toBe(b)
      })
      it ('returns given instance', () => expect(Vec3.add(a, b, d)).toBe(d))
    })
    describe('#addScaled', () => {
      it ('adds', () => {
        a = new Vec3(1, 2, 3)
        b = new Vec3(5, 6, 7)
        c = a.addScaled(b, 0.5)
        expectComponents(c, 3.5, 5, 6.5)
        expect(a).toBe(c)
      })
    })
    describe('#addScalar', () => {
      it ('adds', () => {
        a = new Vec3(1, 2, 3)
        c = a.addScalar(0.5)
        expectComponents(c, 1.5, 2.5, 3.5)
        expect(a).toBe(c)
      })
    })
    describe('.addScalar', () => {
      it ('adds', () => {
        a = new Vec3(1, 2, 3)
        Vec3.addScalar(a, 0.5, c)
        expectComponents(c, 1.5, 2.5, 3.5)
        expect(a).not.toBe(c)
      })
    })
  })

  describe('subtract operation', () => {
    beforeEach(() => {
      a = new Vec3(5, 6, 7)
      b = new Vec3(4, 3, 2)
      c = new Vec3(1, 3, 5)
    })
    describe('#subtract', () => {
      it ('subtracts', () => expectEquality(a.subtract(b), c))
      it ('returns instance', () => expect(a.subtract(b)).toBe(a))
    })
    describe('.subtract', () => {
      it ('subtracts', () => expectEquality(Vec3.subtract(a, b), c))
      it ('returns new instance', () => {
        let res = Vec3.subtract(a, b)
        expect(res).not.toBe(a)
        expect(res).not.toBe(b)
      })
      it ('returns given instance', () => expect(Vec3.subtract(a, b, d)).toBe(d))
    })
    describe('#subtractScaled', () => {
      it ('subtracts', () => {
        a = new Vec3(5, 6, 7)
        b = new Vec3(1, 2, 3)
        c = a.subtractScaled(b, 0.5)
        expectComponents(c, 4.5, 5, 5.5)
        expect(a).toBe(c)
      })
    })
    describe('#subtractScalar', () => {
      it ('subtracts', () => {
        a = new Vec3(1, 2, 3)
        c = a.subtractScalar(0.5)
        expectComponents(c, 0.5, 1.5, 2.5)
        expect(a).toBe(c)
      })
    })
    describe('.subtractScalar', () => {
      it ('subtracts', () => {
        a = new Vec3(1, 2, 3)
        Vec3.subtractScalar(a, 0.5, c)
        expectComponents(c, 0.5, 1.5, 2.5)
        expect(a).not.toBe(c)
      })
    })
  })

  describe('multiply operation', () => {
    beforeEach(() => {
      a = new Vec3(1, 2, 3)
      b = new Vec3(5, 6, 7)
      c = new Vec3(5, 12, 21)
    })
    describe('#multiply', () => {
      it ('multiplies', () => expectEquality(a.multiply(b), c))
      it ('returns instance', () => expect(a.multiply(b)).toBe(a))
    })
    describe('.multiply', () => {
      it ('multiplies', () => expectEquality(Vec3.multiply(a, b), c))
      it ('returns new instance', () => {
        let res = Vec3.multiply(a, b)
        expect(res).not.toBe(a)
        expect(res).not.toBe(b)
      })
      it ('returns given instance', () => expect(Vec3.multiply(a, b, d)).toBe(d))
    })
    describe('#multiplyScalar', () => {
      it ('multiplies', () => {
        a = new Vec3(1, 2, 3)
        c = a.multiplyScalar(0.5)
        expectComponents(c, 0.5, 1, 1.5)
        expect(a).toBe(c)
      })
    })
    describe('.multiplyScalar', () => {
      it ('calculates C = A * s', () => {
        const A = Vec3.create(1, 2, 3)
        const s = 0.5
        let C = Vec3.create()
        Vec3.multiplyScalar(A, s, C)
        expectComponents(C, 0.5, 1, 1.5)
        expect(A).not.toBe(C)

        C = Vec3.multiplyScalar(A, s)
        expectComponents(C, 0.5, 1, 1.5)
        expect(A).not.toBe(C)
      })
    })
    describe('.multiplyScalarAdd', () => {
      it ('calculates C = A * s + B', () => {
        const A = Vec3.create(1, 2, 3)
        const s = 0.5
        const B = Vec3.create(4, 5, 6)
        let C = Vec3.create()
        Vec3.multiplyScalarAdd(A, s, B, C)
        expectComponents(C, 4.5, 6, 7.5)
        expect(A).not.toBe(C)

        C = Vec3.multiplyScalarAdd(A, s, B)
        expectComponents(C, 4.5, 6, 7.5)
        expect(A).not.toBe(C)
      })
    })
    describe('#multiplyAdd', () => {
      it ('multiplies', () => {
        a = new Vec3(1, 2, 3)
        b = new Vec3(5, 6, 7)
        c = new Vec3(9, 10, 11)
        d = a.multiplyAdd(b, c)
        expectComponents(d, 14, 22, 32)
        expect(a).toBe(d)
      })
    })
    describe('.multiplyAdd', () => {
      it ('multiplies', () => {
        a = new Vec3(1, 2, 3)
        b = new Vec3(5, 6, 7)
        c = new Vec3(9, 10, 11)
        const e = Vec3.multiplyAdd(a, b, c, d)
        expectComponents(d, 14, 22, 32)
        expect(d).toBe(e)
      })
    })
  })

  describe('divide operation', () => {
    beforeEach(() => {
      a = new Vec3(4, 16, 64)
      b = new Vec3(2, 4, 8)
      c = new Vec3(2, 4, 8)
    })
    describe('#divide', () => {
      it ('divides', () => expectEquality(a.divide(b), c))
      it ('returns instance', () => expect(a.divide(b)).toBe(a))
    })
    describe('.divide', () => {
      it ('divides', () => expectEquality(Vec3.divide(a, b), c))
      it ('returns new instance', () => {
        let res = Vec3.divide(a, b)
        expect(res).not.toBe(a)
        expect(res).not.toBe(b)
      })
      it ('returns given instance', () => expect(Vec3.divide(a, b, d)).toBe(d))
    })
    describe('#divideScalar', () => {
      it ('divides', () => {
        a = new Vec3(1, 2, 3)
        c = a.divideScalar(2)
        expectComponents(c, 0.5, 1, 1.5)
        expect(a).toBe(c)
      })
    })
    describe('.divideScalar', () => {
      it ('divides', () => {
        a = new Vec3(1, 2, 3)
        Vec3.divideScalar(a, 2, c)
        expectComponents(c, 0.5, 1, 1.5)
        expect(a).not.toBe(c)
      })
    })
  })

  describe('.zero', () => {
    it ('creates a new Vec3', () => {
      expectComponents(Vec3.createZero(), 0, 0, 0)
    })
  })

  describe('.one', () => {
    it ('creates a new Vec3', () => {
      expectComponents(Vec3.createOne(), 1, 1, 1)
    })
  })

  describe('.create', () => {
    it ('creates a new Vec3', () => {
      expectComponents(Vec3.create(), 0, 0, 0)
      expectComponents(Vec3.create(1, 2, 3), 1, 2, 3)
    })
  })

  describe('.clamp', () => {
    it ('clamps to min', () => {
      a = new Vec3(1, 2, 3)
      b = new Vec3(1.5, 2.5, 3.5)
      c = Vec3.clamp(new Vec3(0.9, 1.9, 2.9), a, b)
      expectComponents(c, 1, 2, 3)
    })

    it ('clamps to max', () => {
      a = new Vec3(1, 2, 3)
      b = new Vec3(1.5, 2.5, 3.5)
      c = Vec3.clamp(new Vec3(1.6, 2.6, 3.6), a, b)
      expectComponents(c, 1.5, 2.5, 3.5)
    })
  })

  describe('.clampScalar', () => {
    it ('clamps to min', () => {
      c = Vec3.clampScalar(new Vec3(1, 2, 3), 5, 10)
      expectComponents(c, 5, 5, 5)
    })

    it ('clamps to max', () => {
      c = Vec3.clampScalar(new Vec3(3, 4, 5), 1, 2)
      expectComponents(c, 2, 2, 2)
    })
  })

  describe('.min', () => {
    it ('gets min of the components', () => {
      expectComponents(Vec3.min(new Vec3(1, 2, 3), new Vec3(5, 6, 7)), 1, 2, 3)
      expectComponents(Vec3.min(new Vec3(5, 6, 7), new Vec3(1, 2, 3)), 1, 2, 3)
    })
  })

  describe('.minScalar', () => {
    it ('gets min of the components', () => {
      expectComponents(Vec3.minScalar(new Vec3(1, 2, 3), 0.5), 0.5, 0.5, 0.5)
      expectComponents(Vec3.minScalar(new Vec3(1, 2, 3), 5), 1, 2, 3)
    })
  })

  describe('.max', () => {
    it ('gets max of the components', () => {
      expectComponents(Vec3.max(new Vec3(1, 2, 3), new Vec3(5, 6, 7)), 5, 6, 7)
      expectComponents(Vec3.max(new Vec3(5, 6, 7), new Vec3(1, 2, 3)), 5, 6, 7)
    })
  })

  describe('.maxScalar', () => {
    it ('gets maxScalar of the components', () => {
      expectComponents(Vec3.maxScalar(new Vec3(1, 2, 3), 5), 5, 5, 5)
      expectComponents(Vec3.maxScalar(new Vec3(1, 2, 3), 0.5), 1, 2, 3)
    })
  })

  describe('.lerp', () => {
    it ('interpolates of the components', () => {
      expectComponents(Vec3.lerp(new Vec3(1, 2, 3), new Vec3(5, 6, 7), 0.5), 3, 4, 5)
    })
  })

  describe('.barycentric', () => {
    it ('interpolates the components', () => {
      expectComponents(Vec3.barycentric(new Vec3(1, 2, 3), new Vec3(5, 6, 7), new Vec3(9, 10, 11), 0.5, 0.5), 7, 8, 9)
    })
  })

  describe('.smooth', () => {
    it ('interpolates the components', () => {
      expectComponents(Vec3.smooth(new Vec3(1, 2, 3), new Vec3(5, 6, 7), 0.5), 3, 4, 5)
    })
  })

  describe('.convert', () => {
    it ('converts number', () => {
      expectComponents(Vec3.convert(1), 1, 1, 1)
    })

    it ('converts number[]', () => {
      expectComponents(Vec3.convert([1, 2, 3]), 1, 2, 3)
      expectComponents(Vec3.convert([null, null, null, null]), 0, 0, 0)
    })

    it ('converts IVec3', () => {
      expectComponents(Vec3.convert({ x: 1, y: 2, z: 3 }), 1, 2, 3)
      expectComponents(Vec3.convert({} as any), 0, 0, 0)
    })
  })

  describe('#transformByQuat', () => {
    it ('transforms by quaternion', () => {
      expectComponents(Vec3.create(1, 1, 1).transformByQuat(Quat.createAxisAngle({ x: 1, y: 0, z: 0}, Math.PI * 0.5)),  1, -1,  1)
      expectComponents(Vec3.create(1, 1, 1).transformByQuat(Quat.createAxisAngle({ x: 0, y: 1, z: 0}, Math.PI * 0.5)),  1,  1, -1)
      expectComponents(Vec3.create(1, 1, 1).transformByQuat(Quat.createAxisAngle({ x: 0, y: 0, z: 1}, Math.PI * 0.5)), -1,  1,  1)
    })
  })

  describe('#transformByMat4', () => {
    it ('transforms by Mat4', () => {
      expectComponents(Vec3.create(1, 1, 1).transformByMat4(Mat4.createAxisAngleV({ x: 1, y: 0, z: 0}, Math.PI * 0.5)),  1, -1,  1)
      expectComponents(Vec3.create(1, 1, 1).transformByMat4(Mat4.createAxisAngleV({ x: 0, y: 1, z: 0}, Math.PI * 0.5)),  1,  1, -1)
      expectComponents(Vec3.create(1, 1, 1).transformByMat4(Mat4.createAxisAngleV({ x: 0, y: 0, z: 1}, Math.PI * 0.5)), -1,  1,  1)
    })
  })

  describe('#transformByMat3', () => {
    it ('transforms by Mat3', () => {
      expectComponents(Vec3.create(1, 1, 1).transformByMat3(Mat3.createAxisAngleV({ x: 1, y: 0, z: 0}, Math.PI * 0.5)),  1, -1,  1)
      expectComponents(Vec3.create(1, 1, 1).transformByMat3(Mat3.createAxisAngleV({ x: 0, y: 1, z: 0}, Math.PI * 0.5)),  1,  1, -1)
      expectComponents(Vec3.create(1, 1, 1).transformByMat3(Mat3.createAxisAngleV({ x: 0, y: 0, z: 1}, Math.PI * 0.5)), -1,  1,  1)
    })
  })

  describe('#transformByMat2', () => {
    it ('transforms by Mat2', () => {
      expectComponents(Vec3.create(1, 1, 1).transformByMat2(Mat2.createRotationX(Math.PI * 0.5)),  1,  0,  1)
      expectComponents(Vec3.create(1, 1, 1).transformByMat2(Mat2.createRotationY(Math.PI * 0.5)),  0,  1,  1)
      expectComponents(Vec3.create(1, 1, 1).transformByMat2(Mat2.createRotationZ(Math.PI * 0.5)), -1,  1,  1)
    })
  })

  describe('#format', () => {
    it ('formats components', () => {
      expect(Vec3.create(1, 2, 3).format()).toBe('1.00000,2.00000,3.00000')
    })
  })
})
