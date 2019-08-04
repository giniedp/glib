import { IVec4, Mat2, Mat3, Mat4, Quat, Vec4 } from '@gglib/math'

describe('Vec4', () => {

  function expectComponents(v: IVec4, x: number, y: number, z: number, w: number) {
    expect(v.x).toBeCloseTo(x, 10, 'x component of Vec4 invalid')
    expect(v.y).toBeCloseTo(y, 10, 'y component of Vec4 invalid')
    expect(v.z).toBeCloseTo(z, 10, 'z component of Vec4 invalid')
    expect(v.w).toBeCloseTo(w, 10, 'w component of Vec4 invalid')
  }

  function expectEquality(v1: IVec4, v2: IVec4) {
    expect(v1.x).toBeCloseTo(v2.x, 10, 'x component of Vec4 invalid')
    expect(v1.y).toBeCloseTo(v2.y, 10, 'y component of Vec4 invalid')
    expect(v1.z).toBeCloseTo(v2.z, 10, 'z component of Vec4 invalid')
    expect(v1.w).toBeCloseTo(v2.w, 10, 'w component of Vec4 invalid')
  }

  let a = new Vec4()
  let b = new Vec4()
  let c = new Vec4()
  let d = new Vec4()

  beforeEach(() => {
    a = new Vec4()
    b = new Vec4()
    c = new Vec4()
    d = new Vec4()
  })

  describe('#constructor', () => {
    it ('initializes all components', () => {
      expectComponents(new Vec4(1, 2, 3, 4), 1, 2, 3, 4)
    })
    it ('initializes to 0 without arguments', () => {
      expectComponents(new Vec4(), 0, 0, 0, 0)
    })
  })

  describe('#setX', () => {
    it ('set the value', () => expectComponents(a.setX(1), 1, 0, 0, 0))
    it ('returns same instance', () => expect(a.setX(1)).toBe(a))
  })
  describe('#setY', () => {
    it ('set the value', () => expectComponents(a.setY(1), 0, 1, 0, 0))
    it ('returns same instance', () => expect(a.setY(1)).toBe(a))
  })
  describe('#setZ', () => {
    it ('set the value', () => expectComponents(a.setZ(1), 0, 0, 1, 0))
    it ('returns same instance', () => expect(a.setZ(1)).toBe(a))
  })
  describe('#setW', () => {
    it ('set the value', () => expectComponents(a.setW(1), 0, 0, 0, 1))
    it ('returns same instance', () => expect(a.setW(1)).toBe(a))
  })
  describe('#set', () => {
    it ('set x value by key', () => expectComponents(a.set('x', 1), 1, 0, 0, 0))
    it ('set y value by key', () => expectComponents(a.set('y', 1), 0, 1, 0, 0))
    it ('set z value by key', () => expectComponents(a.set('z', 1), 0, 0, 1, 0))
    it ('set w value by key', () => expectComponents(a.set('w', 1), 0, 0, 0, 1))
    it ('set x value by index', () => expectComponents(a.set(0, 1), 1, 0, 0, 0))
    it ('set y value by index', () => expectComponents(a.set(1, 1), 0, 1, 0, 0))
    it ('set z value by index', () => expectComponents(a.set(2, 1), 0, 0, 1, 0))
    it ('set w value by index', () => expectComponents(a.set(3, 1), 0, 0, 0, 1))
    it ('returns same instance', () => expect(a.set(0, 1)).toBe(a))
  })
  describe('#get', () => {
    beforeEach(() => {
      a = Vec4.create(1, 2, 3, 4)
    })
    it ('gets x value by key', () => expect(a.get('x')).toEqual(1))
    it ('gets y value by key', () => expect(a.get('y')).toEqual(2))
    it ('gets z value by key', () => expect(a.get('z')).toEqual(3))
    it ('gets w value by key', () => expect(a.get('w')).toEqual(4))
    it ('gets x value by index', () => expect(a.get(0)).toEqual(1))
    it ('gets y value by index', () => expect(a.get(1)).toEqual(2))
    it ('gets z value by index', () => expect(a.get(2)).toEqual(3))
    it ('gets w value by index', () => expect(a.get(3)).toEqual(4))
  })
  describe('#init', () => {
    it ('inits all components', () => expectComponents(a.init(1, 2, 3, 4), 1, 2, 3, 4))
    it ('returns same instance', () => expect(a.init(1, 2, 3, 4)).toBe(a))
  })
  describe('.create', () => {
    it ('creates a new vector', () => {
      expectComponents(Vec4.create(), 0, 0, 0, 0)
      expectComponents(Vec4.create(1, 2, 3, 4), 1, 2, 3, 4)
    })
  })
  describe('#initZero', () => {
    it ('creates a new vector', () => {
      expectComponents(Vec4.create(1, 2, 3, 4).initZero(), 0, 0, 0, 0)
    })
  })
  describe('.createZero', () => {
    it ('creates a new vector', () => {
      expectComponents(Vec4.createZero(), 0, 0, 0, 0)
    })
  })
  describe('#initOne', () => {
    it ('creates a new vector', () => {
      expectComponents(Vec4.create(1, 2, 3, 4).initOne(), 1, 1, 1, 1)
    })
  })
  describe('.createOne', () => {
    it ('creates a new vector', () => {
      expectComponents(Vec4.createOne(), 1, 1, 1, 1)
    })
  })
  describe('#initFrom', () => {
    beforeEach(() => {
      b = Vec4.create(1, 2, 3, 4)
    })
    it ('inits all components', () => expectComponents(a.initFrom(b), 1, 2, 3, 4))
    it ('returns same instance', () => expect(a.initFrom(b)).toBe(a))
  })
  describe('.createFrom', () => {
    beforeEach(() => {
      b = Vec4.create(1, 2, 3, 4)
    })
    it ('inits all components', () => expectComponents(Vec4.createFrom(b), 1, 2, 3, 4))
  })
  describe('#initFromBuffer', () => {
    it ('inits all components', () => expectComponents(a.initFromBuffer([1, 2, 3, 4, 5], 1), 2, 3, 4, 5))
    it ('returns same instance', () => expect(a.initFromBuffer([1, 2, 3, 4, 5], 1)).toBe(a))
  })
  describe('.createFromBuffer', () => {
    it ('inits all components', () => expectComponents(Vec4.createFromBuffer([1, 2, 3, 4, 5], 1), 2, 3, 4, 5))
  })
  describe('#clone', () => {
    beforeEach(() => {
      a = Vec4.create(1, 2, 3, 4)
    })
    it ('clones all components', () => expectComponents(a.clone(), 1, 2, 3, 4))
    it ('returns new instance', () => expect(a.clone()).not.toBe(a))
  })
  describe('.clone', () => {
    beforeEach(() => {
      a = Vec4.create(1, 2, 3, 4)
    })
    it ('clones all components', () => expectComponents(Vec4.clone(a), 1, 2, 3, 4))
    it ('returns new instance', () => expect(Vec4.clone(a)).not.toBe(a))
  })
  describe('#toArray', () => {
    beforeEach(() => {
      a = Vec4.create(1, 2, 3, 4)
    })
    it ('copies components', () => expect(a.toArray()).toEqual([1, 2, 3, 4]))
    it ('copies components at offset', () => expect(a.toArray([0, 0, 0, 0, 0], 1)).toEqual([0, 1, 2, 3, 4]))
  })
  describe('.toArray', () => {
    beforeEach(() => {
      a = Vec4.create(1, 2, 3, 4)
    })
    it ('copies components', () => expect(Vec4.toArray(a, [])).toEqual([1, 2, 3, 4]))
    it ('copies components at offset', () => expect(Vec4.toArray(a, [0, 0, 0, 0, 0], 1)).toEqual([0, 1, 2, 3, 4]))
  })
  describe('.toArray', () => {
    beforeEach(() => {
      a = Vec4.create(1, 2, 3, 4)
    })
    it ('copies components', () => expect(Vec4.toArray(a, [])).toEqual([1, 2, 3, 4]))
    it ('copies components at offset', () => expect(Vec4.toArray(a, [0, 0, 0, 0, 0], 1)).toEqual([0, 1, 2, 3, 4]))
  })
  describe('#equals', () => {
    it ('compares components', () => {
      expect(Vec4.create(0, 0, 0, 0).equals(Vec4.create(0, 0, 0, 0))).toBe(true)
      expect(Vec4.create(1, 0, 0, 0).equals(Vec4.create(1, 0, 0, 0))).toBe(true)
      expect(Vec4.create(0, 1, 0, 0).equals(Vec4.create(0, 1, 0, 0))).toBe(true)
      expect(Vec4.create(0, 0, 1, 0).equals(Vec4.create(0, 0, 1, 0))).toBe(true)
      expect(Vec4.create(0, 0, 0, 1).equals(Vec4.create(0, 0, 0, 1))).toBe(true)
      expect(Vec4.create(0, 0, 0, 0).equals(Vec4.create(1, 0, 0, 0))).toBe(false)
      expect(Vec4.create(0, 0, 0, 0).equals(Vec4.create(0, 1, 0, 0))).toBe(false)
      expect(Vec4.create(0, 0, 0, 0).equals(Vec4.create(0, 0, 1, 0))).toBe(false)
      expect(Vec4.create(0, 0, 0, 0).equals(Vec4.create(0, 0, 0, 1))).toBe(false)
    })
  })
  describe('.equals', () => {
    it ('compares components', () => {
      expect(Vec4.equals(Vec4.create(0, 0, 0, 0), Vec4.create(0, 0, 0, 0))).toBe(true)
      expect(Vec4.equals(Vec4.create(1, 0, 0, 0), Vec4.create(1, 0, 0, 0))).toBe(true)
      expect(Vec4.equals(Vec4.create(0, 1, 0, 0), Vec4.create(0, 1, 0, 0))).toBe(true)
      expect(Vec4.equals(Vec4.create(0, 0, 1, 0), Vec4.create(0, 0, 1, 0))).toBe(true)
      expect(Vec4.equals(Vec4.create(0, 0, 0, 1), Vec4.create(0, 0, 0, 1))).toBe(true)
      expect(Vec4.equals(Vec4.create(0, 0, 0, 0), Vec4.create(1, 0, 0, 0))).toBe(false)
      expect(Vec4.equals(Vec4.create(0, 0, 0, 0), Vec4.create(0, 1, 0, 0))).toBe(false)
      expect(Vec4.equals(Vec4.create(0, 0, 0, 0), Vec4.create(0, 0, 1, 0))).toBe(false)
      expect(Vec4.equals(Vec4.create(0, 0, 0, 0), Vec4.create(0, 0, 0, 1))).toBe(false)
    })
  })
  describe('#length', () => {
    it ('calculates length', () => {
      expect(Vec4.create(2, 0, 0, 0).length()).toBe(2)
      expect(Vec4.create(0, 3, 0, 0).length()).toBe(3)
      expect(Vec4.create(0, 0, 4, 0).length()).toBe(4)
      expect(Vec4.create(0, 0, 0, 5).length()).toBe(5)
    })
  })
  describe('.len', () => {
    it ('calculates length', () => {
      expect(Vec4.len(Vec4.create(2, 0, 0, 0))).toBe(2)
      expect(Vec4.len(Vec4.create(0, 3, 0, 0))).toBe(3)
      expect(Vec4.len(Vec4.create(0, 0, 4, 0))).toBe(4)
      expect(Vec4.len(Vec4.create(0, 0, 0, 5))).toBe(5)
    })
  })
  describe('#lengthSquared', () => {
    it ('calculates length', () => {
      expect(Vec4.create(2, 0, 0, 0).lengthSquared()).toBe(4)
      expect(Vec4.create(0, 3, 0, 0).lengthSquared()).toBe(9)
      expect(Vec4.create(0, 0, 4, 0).lengthSquared()).toBe(16)
      expect(Vec4.create(0, 0, 0, 5).lengthSquared()).toBe(25)
    })
  })
  describe('.lengthSquared', () => {
    it ('calculates length', () => {
      expect(Vec4.lengthSquared(Vec4.create(2, 0, 0, 0))).toBe(4)
      expect(Vec4.lengthSquared(Vec4.create(0, 3, 0, 0))).toBe(9)
      expect(Vec4.lengthSquared(Vec4.create(0, 0, 4, 0))).toBe(16)
      expect(Vec4.lengthSquared(Vec4.create(0, 0, 0, 5))).toBe(25)
    })
  })
  describe('#distance', () => {
    it ('calculates distance', () => {
      expect(Vec4.create(2, 0, 0, 0).distance(Vec4.create(4, 0, 0, 0))).toBe(2)
      expect(Vec4.create(0, 3, 0, 0).distance(Vec4.create(0, 6, 0, 0))).toBe(3)
      expect(Vec4.create(0, 0, 4, 0).distance(Vec4.create(0, 0, 8, 0))).toBe(4)
      expect(Vec4.create(0, 0, 0, 5).distance(Vec4.create(0, 0, 0, 10))).toBe(5)
    })
  })
  describe('.distance', () => {
    it ('calculates distance', () => {
      expect(Vec4.distance(Vec4.create(2, 0, 0, 0), Vec4.create(4, 0, 0, 0))).toBe(2)
      expect(Vec4.distance(Vec4.create(0, 3, 0, 0), Vec4.create(0, 6, 0, 0))).toBe(3)
      expect(Vec4.distance(Vec4.create(0, 0, 4, 0), Vec4.create(0, 0, 8, 0))).toBe(4)
      expect(Vec4.distance(Vec4.create(0, 0, 0, 5), Vec4.create(0, 0, 0, 10))).toBe(5)
    })
  })
  describe('#distanceSquared', () => {
    it ('calculates distance', () => {
      expect(Vec4.create(2, 0, 0, 0).distanceSquared(Vec4.create(4, 0, 0, 0))).toBe(4)
      expect(Vec4.create(0, 3, 0, 0).distanceSquared(Vec4.create(0, 6, 0, 0))).toBe(9)
      expect(Vec4.create(0, 0, 4, 0).distanceSquared(Vec4.create(0, 0, 8, 0))).toBe(16)
      expect(Vec4.create(0, 0, 0, 5).distanceSquared(Vec4.create(0, 0, 0, 10))).toBe(25)
    })
  })
  describe('.distanceSquared', () => {
    it ('calculates distance', () => {
      expect(Vec4.distanceSquared(Vec4.create(2, 0, 0, 0), Vec4.create(4, 0, 0, 0))).toBe(4)
      expect(Vec4.distanceSquared(Vec4.create(0, 3, 0, 0), Vec4.create(0, 6, 0, 0))).toBe(9)
      expect(Vec4.distanceSquared(Vec4.create(0, 0, 4, 0), Vec4.create(0, 0, 8, 0))).toBe(16)
      expect(Vec4.distanceSquared(Vec4.create(0, 0, 0, 5), Vec4.create(0, 0, 0, 10))).toBe(25)
    })
  })
  describe('#dot', () => {
    it ('calculates dot', () => {
      expect(Vec4.create(2, 0, 0, 0).dot(Vec4.create(4, 0, 0, 0))).toBe(8)
      expect(Vec4.create(0, 3, 0, 0).dot(Vec4.create(0, 6, 0, 0))).toBe(18)
      expect(Vec4.create(0, 0, 4, 0).dot(Vec4.create(0, 0, 8, 0))).toBe(32)
      expect(Vec4.create(0, 0, 0, 5).dot(Vec4.create(0, 0, 0, 10))).toBe(50)
    })
  })
  describe('.dot', () => {
    it ('calculates dot', () => {
      expect(Vec4.dot(Vec4.create(2, 0, 0, 0), Vec4.create(4, 0, 0, 0))).toBe(8)
      expect(Vec4.dot(Vec4.create(0, 3, 0, 0), Vec4.create(0, 6, 0, 0))).toBe(18)
      expect(Vec4.dot(Vec4.create(0, 0, 4, 0), Vec4.create(0, 0, 8, 0))).toBe(32)
      expect(Vec4.dot(Vec4.create(0, 0, 0, 5), Vec4.create(0, 0, 0, 10))).toBe(50)
    })
  })
  describe('#normalize', () => {
    it ('normalizes', () => expect(Vec4.create(1, 2, 3, 4).normalize().length()).toBeCloseTo(1))
  })
  describe('.normalize', () => {
    it ('normalizes', () => expect(Vec4.len(Vec4.normalize(Vec4.create(1, 2, 3, 4)))).toBeCloseTo(1))
  })
  describe('#invert', () => {
    it ('inverts', () => expectComponents(Vec4.create(2, 4, 8, 16).invert(), 0.5, 0.25, 0.125, 0.0625))
    it ('return instance', () => expect(a.init(2, 4, 8, 16).invert()).toBe(a))
  })
  describe('.invert', () => {
    it ('inverts', () => expectComponents(Vec4.invert(Vec4.create(2, 4, 8, 16)), 0.5, 0.25, 0.125, 0.0625))
  })
  describe('#negate', () => {
    it ('negates', () => expectComponents(Vec4.create(2, 4, 8, 16).negate(), -2, -4, -8, -16))
    it ('return instance', () => expect(a.init(2, 4, 8, 16).negate()).toBe(a))
  })
  describe('.negate', () => {
    it ('negates', () => expectComponents(Vec4.negate(Vec4.create(2, 4, 8, 16)), -2, -4, -8, -16))
  })
  describe('add operations', () => {
    beforeEach(() => {
      a = Vec4.create(1, 2, 3, 4)
      b = Vec4.create(5, 6, 7, 8)
      c = Vec4.create(6, 8, 10, 12)
    })
    describe('#add', () => {
      it ('calculates C = A + B', () => {
        expectEquality(a.add(b), c)
      })
      it ('returns instance', () => {
        expect(a.add(b)).toBe(a)
      })
    })
    describe('.add', () => {
      it ('adds', () => expectEquality(Vec4.add(a, b), c))
      it ('returns new instance', () => {
        let res = Vec4.add(a, b)
        expect(res).not.toBe(a)
        expect(res).not.toBe(b)
      })
      it ('returns given instance', () => expect(Vec4.add(a, b, d)).toBe(d))
    })
    describe('#addScaled', () => {
      it ('adds', () => {
        a = Vec4.create(1, 2, 3, 4)
        b = Vec4.create(5, 6, 7, 8)
        c = a.addScaled(b, 0.5)
        expectComponents(c, 3.5, 5, 6.5, 8)
        expect(a).toBe(c)
      })
    })
    describe('#addScalar', () => {
      it ('adds', () => {
        a = Vec4.create(1, 2, 3, 4)
        c = a.addScalar(0.5)
        expectComponents(c, 1.5, 2.5, 3.5, 4.5)
        expect(a).toBe(c)
      })
    })
    describe('.addScalar', () => {
      it ('adds', () => {
        a = Vec4.create(1, 2, 3, 4)
        Vec4.addScalar(a, 0.5, c)
        expectComponents(c, 1.5, 2.5, 3.5, 4.5)
        expect(a).not.toBe(c)
      })
    })
  })

  describe('subtract operation', () => {
    beforeEach(() => {
      a = Vec4.create(5, 6, 7, 8)
      b = Vec4.create(4, 3, 2, 1)
      c = Vec4.create(1, 3, 5, 7)
    })
    describe('#subtract', () => {
      it ('subtracts', () => expectEquality(a.subtract(b), c))
      it ('returns instance', () => expect(a.subtract(b)).toBe(a))
    })
    describe('.subtract', () => {
      it ('subtracts', () => expectEquality(Vec4.subtract(a, b), c))
      it ('returns new instance', () => {
        let res = Vec4.subtract(a, b)
        expect(res).not.toBe(a)
        expect(res).not.toBe(b)
      })
      it ('returns given instance', () => expect(Vec4.subtract(a, b, d)).toBe(d))
    })
    describe('#subtractScaled', () => {
      it ('subtracts', () => {
        a = Vec4.create(5, 6, 7, 8)
        b = Vec4.create(1, 2, 3, 4)
        c = a.subtractScaled(b, 0.5)
        expectComponents(c, 4.5, 5, 5.5, 6)
        expect(a).toBe(c)
      })
    })
    describe('#subtractScalar', () => {
      it ('subtracts', () => {
        a = Vec4.create(1, 2, 3, 4)
        c = a.subtractScalar(0.5)
        expectComponents(c, 0.5, 1.5, 2.5, 3.5)
        expect(a).toBe(c)
      })
    })
    describe('.subtractScalar', () => {
      it ('subtracts', () => {
        a = Vec4.create(1, 2, 3, 4)
        Vec4.subtractScalar(a, 0.5, c)
        expectComponents(c, 0.5, 1.5, 2.5, 3.5)
        expect(a).not.toBe(c)
      })
    })
  })

  describe('multiply operation', () => {
    beforeEach(() => {
      a = Vec4.create(1, 2, 3, 4)
      b = Vec4.create(5, 6, 7, 8)
      c = Vec4.create(5, 12, 21, 32)
    })
    describe('#multiply', () => {
      it ('multiplies', () => expectEquality(a.multiply(b), c))
      it ('returns instance', () => expect(a.multiply(b)).toBe(a))
    })
    describe('.multiply', () => {
      it ('multiplies', () => expectEquality(Vec4.multiply(a, b), c))
      it ('returns new instance', () => {
        let res = Vec4.multiply(a, b)
        expect(res).not.toBe(a)
        expect(res).not.toBe(b)
      })
      it ('returns given instance', () => expect(Vec4.multiply(a, b, d)).toBe(d))
    })
    describe('#multiplyScalar', () => {
      it ('multiplies', () => {
        a = Vec4.create(1, 2, 3, 4)
        c = a.multiplyScalar(0.5)
        expectComponents(c, 0.5, 1, 1.5, 2)
        expect(a).toBe(c)
      })
    })
    describe('.multiplyScalar', () => {
      it ('multiplies', () => {
        a = Vec4.create(1, 2, 3, 4)
        Vec4.multiplyScalar(a, 0.5, c)
        expectComponents(c, 0.5, 1, 1.5, 2)
        expect(a).not.toBe(c)
      })
    })
    describe('#multiplyAdd', () => {
      it ('multiplies', () => {
        a = Vec4.create(1, 2, 3, 4)
        b = Vec4.create(5, 6, 7, 8)
        c = Vec4.create(9, 10, 11, 12)
        d = a.multiplyAdd(b, c)
        expectComponents(d, 14, 22, 32, 44)
        expect(a).toBe(d)
      })
    })
    describe('.multiplyAdd', () => {
      it ('multiplies', () => {
        a = Vec4.create(1, 2, 3, 4)
        b = Vec4.create(5, 6, 7, 8)
        c = Vec4.create(9, 10, 11, 12)
        const e = Vec4.multiplyAdd(a, b, c, d)
        expectComponents(d, 14, 22, 32, 44)
        expect(d).toBe(e)
      })
    })
    describe('#multiplyScalarAdd', () => {
      it ('multiplies', () => {
        a = Vec4.create(1, 2, 3, 4)
        c = a.multiplyScalarAdd(0.5, Vec4.create(4, 3, 2, 1))
        expectComponents(c, 4.5, 4, 3.5, 3)
        expect(a).toBe(c)
      })
    })
    describe('.multiplyScalarAdd', () => {
      it ('multiplies', () => {
        a = Vec4.create(1, 2, 3, 4)
        c = Vec4.multiplyScalarAdd(a, 0.5, Vec4.create(4, 3, 2, 1))
        expectComponents(c, 4.5, 4, 3.5, 3)
        expect(a).not.toBe(c)
      })
    })
  })

  describe('divide operation', () => {
    beforeEach(() => {
      a = Vec4.create(4, 16, 64, 256)
      b = Vec4.create(2, 4, 8, 16)
      c = Vec4.create(2, 4, 8, 16)
    })
    describe('#divide', () => {
      it ('divides', () => expectEquality(a.divide(b), c))
      it ('returns instance', () => expect(a.divide(b)).toBe(a))
    })
    describe('.divide', () => {
      it ('divides', () => expectEquality(Vec4.divide(a, b), c))
      it ('returns new instance', () => {
        let res = Vec4.divide(a, b)
        expect(res).not.toBe(a)
        expect(res).not.toBe(b)
      })
      it ('returns given instance', () => expect(Vec4.divide(a, b, d)).toBe(d))
    })
    describe('#divideScalar', () => {
      it ('divides', () => {
        a = Vec4.create(1, 2, 3, 4)
        c = a.divideScalar(2)
        expectComponents(c, 0.5, 1, 1.5, 2)
        expect(a).toBe(c)
      })
    })
    describe('.divideScalar', () => {
      it ('divides', () => {
        a = Vec4.create(1, 2, 3, 4)
        Vec4.divideScalar(a, 2, c)
        expectComponents(c, 0.5, 1, 1.5, 2)
        expect(a).not.toBe(c)
      })
    })
  })

  describe('.clamp', () => {
    it ('clamps to min', () => {
      a = Vec4.create(1, 2, 3, 4)
      b = Vec4.create(1.5, 2.5, 3.5, 4.5)
      c = Vec4.clamp(Vec4.create(0.9, 1.9, 2.9, 3.9), a, b)
      expectComponents(c, 1, 2, 3, 4)
    })

    it ('clamps to max', () => {
      a = Vec4.create(1, 2, 3, 4)
      b = Vec4.create(1.5, 2.5, 3.5, 4.5)
      c = Vec4.clamp(Vec4.create(1.6, 2.6, 3.6, 4.6), a, b)
      expectComponents(c, 1.5, 2.5, 3.5, 4.5)
    })
  })

  describe('.clampScalar', () => {
    it ('clamps to min', () => {
      c = Vec4.clampScalar(Vec4.create(1, 2, 3, 4), 5, 10)
      expectComponents(c, 5, 5, 5, 5)
    })

    it ('clamps to max', () => {
      c = Vec4.clampScalar(Vec4.create(3, 4, 5, 6), 1, 2)
      expectComponents(c, 2, 2, 2, 2)
    })
  })

  describe('.min', () => {
    it ('gets min of the components', () => {
      expectComponents(Vec4.min(Vec4.create(1, 2, 3, 4), Vec4.create(5, 6, 7, 8)), 1, 2, 3, 4)
      expectComponents(Vec4.min(Vec4.create(5, 6, 7, 8), Vec4.create(1, 2, 3, 4)), 1, 2, 3, 4)
    })
  })

  describe('.minScalar', () => {
    it ('gets min of the components', () => {
      expectComponents(Vec4.minScalar(Vec4.create(1, 2, 3, 4), 0.5), 0.5, 0.5, 0.5, 0.5)
      expectComponents(Vec4.minScalar(Vec4.create(1, 2, 3, 4), 5), 1, 2, 3, 4)
    })
  })

  describe('.max', () => {
    it ('gets max of the components', () => {
      expectComponents(Vec4.max(Vec4.create(1, 2, 3, 4), Vec4.create(5, 6, 7, 8)), 5, 6, 7, 8)
      expectComponents(Vec4.max(Vec4.create(5, 6, 7, 8), Vec4.create(1, 2, 3, 4)), 5, 6, 7, 8)
    })
  })

  describe('.maxScalar', () => {
    it ('gets maxScalar of the components', () => {
      expectComponents(Vec4.maxScalar(Vec4.create(1, 2, 3, 4), 5), 5, 5, 5, 5)
      expectComponents(Vec4.maxScalar(Vec4.create(1, 2, 3, 4), 0.5), 1, 2, 3, 4)
    })
  })

  describe('.lerp', () => {
    it ('interpolates of the components', () => {
      expectComponents(Vec4.lerp(Vec4.create(1, 2, 3, 4), Vec4.create(5, 6, 7, 8), 0.5), 3, 4, 5, 6)
    })
  })

  describe('.barycentric', () => {
    it ('interpolates the components', () => {
      expectComponents(
        Vec4.barycentric(
          Vec4.create(1, 2, 3, 4),
          Vec4.create(5, 6, 7, 8),
          Vec4.create(9, 10, 11, 12), 0.5, 0.5),
          7, 8, 9, 10,
    )
    })
  })

  describe('.smooth', () => {
    it ('interpolates the components', () => {
      expectComponents(Vec4.smooth(Vec4.create(1, 2, 3, 4), Vec4.create(5, 6, 7, 8), 0.5), 3, 4, 5, 6)
    })
  })

  describe('.convert', () => {
    it ('converts number', () => {
      expectComponents(Vec4.convert(1), 1, 1, 1, 1)
    })

    it ('converts number[]', () => {
      expectComponents(Vec4.convert([1, 2, 3, 4]), 1, 2, 3, 4)
      expectComponents(Vec4.convert([null, null, null, null]), 0, 0, 0, 0)
    })

    it ('converts IVec4', () => {
      expectComponents(Vec4.convert({ x: 1, y: 2, z: 3, w: 4}), 1, 2, 3, 4)
      expectComponents(Vec4.convert({} as any), 0, 0, 0, 0)
    })
  })

  describe('#transformByQuat', () => {
    it ('transforms by quaternion', () => {
      expectComponents(Vec4.create(1, 1, 1, 1).transformByQuat(Quat.createAxisAngle({ x: 1, y: 0, z: 0}, Math.PI * 0.5)),  1, -1,  1, 1)
      expectComponents(Vec4.create(1, 1, 1, 1).transformByQuat(Quat.createAxisAngle({ x: 0, y: 1, z: 0}, Math.PI * 0.5)),  1,  1, -1, 1)
      expectComponents(Vec4.create(1, 1, 1, 1).transformByQuat(Quat.createAxisAngle({ x: 0, y: 0, z: 1}, Math.PI * 0.5)), -1,  1,  1, 1)
    })
  })

  describe('#transformByMat4', () => {
    it ('transforms by Mat4', () => {
      expectComponents(Vec4.create(1, 1, 1, 1).transformByMat4(Mat4.createAxisAngleV({ x: 1, y: 0, z: 0}, Math.PI * 0.5)),  1, -1,  1, 1)
      expectComponents(Vec4.create(1, 1, 1, 1).transformByMat4(Mat4.createAxisAngleV({ x: 0, y: 1, z: 0}, Math.PI * 0.5)),  1,  1, -1, 1)
      expectComponents(Vec4.create(1, 1, 1, 1).transformByMat4(Mat4.createAxisAngleV({ x: 0, y: 0, z: 1}, Math.PI * 0.5)), -1,  1,  1, 1)
      expectComponents(Vec4.create(1, 1, 1, 1).transformByMat4(Mat4.createTranslation(1, 2, 3)), 2,  3,  4, 1)
    })
  })

  describe('#transformByMat3', () => {
    it ('transforms by Mat3', () => {
      expectComponents(Vec4.create(1, 1, 1, 1).transformByMat3(Mat3.createAxisAngleV({ x: 1, y: 0, z: 0}, Math.PI * 0.5)),  1, -1,  1, 1)
      expectComponents(Vec4.create(1, 1, 1, 1).transformByMat3(Mat3.createAxisAngleV({ x: 0, y: 1, z: 0}, Math.PI * 0.5)),  1,  1, -1, 1)
      expectComponents(Vec4.create(1, 1, 1, 1).transformByMat3(Mat3.createAxisAngleV({ x: 0, y: 0, z: 1}, Math.PI * 0.5)), -1,  1,  1, 1)
    })
  })

  describe('#transformByMat2', () => {
    it ('transforms by Mat2', () => {
      expectComponents(Vec4.create(1, 1, 1, 1).transformByMat2(Mat2.createRotationX(Math.PI * 0.5)),  1,  0,  1, 1)
      expectComponents(Vec4.create(1, 1, 1, 1).transformByMat2(Mat2.createRotationY(Math.PI * 0.5)),  0,  1,  1, 1)
      expectComponents(Vec4.create(1, 1, 1, 1).transformByMat2(Mat2.createRotationZ(Math.PI * 0.5)), -1,  1,  1, 1)
    })
  })

  describe('#format', () => {
    it ('formats components', () => {
      expect(Vec4.create(1, 2, 3, 4).format()).toBe('1.00000,2.00000,3.00000,4.00000')
    })
  })
})
