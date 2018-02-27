import { IVec2, Vec2 } from '@glib/math'

describe('Vec2', () => {

  function expectComponents(v: IVec2, x: number, y: number) {
    expect(v.x).toBeCloseTo(x, 10, 'x component of Vec2 invalid')
    expect(v.y).toBeCloseTo(y, 10, 'y component of Vec2 invalid')
  }

  function expectEquality(v1: IVec2, v2: IVec2) {
    expect(v1.x).toBeCloseTo(v2.x, 10, 'x component of Vec2 invalid')
    expect(v1.y).toBeCloseTo(v2.y, 10, 'y component of Vec2 invalid')
  }

  let a = new Vec2()
  let b = new Vec2()
  let c = new Vec2()
  let d = new Vec2()

  beforeEach(() => {
    a = new Vec2()
    b = new Vec2()
    c = new Vec2()
    d = new Vec2()
  })

  describe('#constructor', () => {
    it ('initializes all components', () => {
      let v = new Vec2(1, 2)
      expectComponents(v, 1, 2)
    })

    it ('is valid without parameters', () => {
      let v = new Vec2()
      expectComponents(v, 0, 0)
    })
  })

  describe('#setX', () => {
    it ('set the value', () => expectComponents(a.setX(1), 1, 0))
    it ('returns same instance', () => expect(a.setX(1)).toBe(a))
  })
  describe('#setY', () => {
    it ('set the value', () => expectComponents(a.setY(1), 0, 1))
    it ('returns same instance', () => expect(a.setY(1)).toBe(a))
  })
  describe('#set', () => {
    it ('set x value', () => expectComponents(a.set(0, 1), 1, 0))
    it ('set x value', () => expectComponents(a.set('x', 1), 1, 0))
    it ('set y value', () => expectComponents(a.set(1, 1), 0, 1))
    it ('set y value', () => expectComponents(a.set('y', 1), 0, 1))
    it ('returns same instance', () => expect(a.set(0, 1)).toBe(a))
  })
  describe('#get', () => {
    beforeEach(() => {
      a = new Vec2(1, 2)
    })
    it ('set x value', () => expect(a.get(0)).toEqual(1))
    it ('set x value', () => expect(a.get('x')).toEqual(1))
    it ('set y value', () => expect(a.get(1)).toEqual(2))
    it ('set y value', () => expect(a.get('y')).toEqual(2))
  })
  describe('#init', () => {
    it ('inits all components', () => expectComponents(a.init(1, 2), 1, 2))
    it ('returns same instance', () => expect(a.init(1, 2)).toBe(a))
  })
  describe('#initZero', () => {
    it ('initializess a new Vec2', () => {
      expectComponents(Vec2.create(1, 2).initZero(), 0, 0)
    })
  })
  describe('.createZero', () => {
    it ('creates a new Vec2', () => {
      expectComponents(Vec2.createZero(), 0, 0)
    })
  })
  describe('.initOne', () => {
    it ('initializes with 1', () => {
      expectComponents(Vec2.create().initOne(), 1, 1)
    })
  })
  describe('.createOne', () => {
    it ('creates a new Vec2', () => {
      expectComponents(Vec2.createOne(), 1, 1)
    })
  })
  describe('#initFrom', () => {
    beforeEach(() => {
      b = new Vec2(1, 2)
    })
    it ('inits all components', () => expectComponents(a.initFrom(b), 1, 2))
    it ('returns same instance', () => expect(a.initFrom(b)).toBe(a))
  })
  describe('.createFrom', () => {
    it ('inits all components', () => {
      expectComponents(Vec2.createFrom(Vec2.create(1, 2)), 1, 2)
    })
  })
  describe('#initFromBuffer', () => {
    it ('inits all components', () => expectComponents(a.initFromBuffer([1, 2, 3, 4], 1), 2, 3))
    it ('returns same instance', () => expect(a.initFromBuffer([1, 2, 3, 4, 5], 1)).toBe(a))
  })
  describe('.createFromBuffer', () => {
    it ('inits all components', () => expectComponents(Vec2.createFromBuffer([1, 2, 3, 4], 1), 2, 3))
  })
  describe('#clone', () => {
    beforeEach(() => {
      a = new Vec2(1, 2)
    })
    it ('clones all components', () => expectComponents(a.clone(), 1, 2))
    it ('returns new instance', () => expect(a.clone()).not.toBe(a))
  })
  describe('.clone', () => {
    beforeEach(() => {
      a = new Vec2(1, 2)
    })
    it ('clones all components', () => expectComponents(Vec2.clone(a), 1, 2))
    it ('returns new instance', () => expect(Vec2.clone(a)).not.toBe(a))
  })
  describe('#copy', () => {
    beforeEach(() => {
      a = new Vec2(1, 2)
    })
    it ('copies components', () => expect(a.copy([])).toEqual([1, 2]))
    it ('copies components at offset', () => expect(a.copy([0, 0, 0, 0, 0], 1)).toEqual([0, 1, 2, 0, 0]))
  })
  describe('.copy', () => {
    beforeEach(() => {
      a = new Vec2(1, 2)
    })
    it ('copies components', () => expect(Vec2.copy(a, [])).toEqual([1, 2]))
    it ('copies components at offset', () => expect(Vec2.copy(a, [0, 0, 0, 0, 0], 1)).toEqual([0, 1, 2, 0, 0]))
  })
  describe('#equals', () => {
    it ('compares components', () => {
      expect(Vec2.create(0, 0).equals(Vec2.create(0, 0))).toBe(true)
      expect(Vec2.create(1, 0).equals(Vec2.create(1, 0))).toBe(true)
      expect(Vec2.create(0, 1).equals(Vec2.create(0, 1))).toBe(true)
      expect(Vec2.create(0, 0).equals(Vec2.create(1, 0))).toBe(false)
      expect(Vec2.create(0, 0).equals(Vec2.create(0, 1))).toBe(false)
    })
  })
  describe('.equals', () => {
    it ('compares components', () => {
      expect(Vec2.equals(Vec2.create(0, 0), Vec2.create(0, 0))).toBe(true)
      expect(Vec2.equals(Vec2.create(1, 0), Vec2.create(1, 0))).toBe(true)
      expect(Vec2.equals(Vec2.create(0, 1), Vec2.create(0, 1))).toBe(true)
      expect(Vec2.equals(Vec2.create(0, 0), Vec2.create(1, 0))).toBe(false)
      expect(Vec2.equals(Vec2.create(0, 0), Vec2.create(0, 1))).toBe(false)
    })
  })
  describe('#length', () => {
    it ('calculates length', () => {
      expect(new Vec2(2, 0).length()).toBe(2)
      expect(new Vec2(0, 3).length()).toBe(3)
    })
  })
  describe('.len', () => {
    it ('calculates length', () => {
      expect(Vec2.len(new Vec2(2, 0))).toBe(2)
      expect(Vec2.len(new Vec2(0, 3))).toBe(3)
    })
  })
  describe('#lengthSquared', () => {
    it ('calculates length', () => {
      expect(new Vec2(2, 0).lengthSquared()).toBe(4)
      expect(new Vec2(0, 3).lengthSquared()).toBe(9)
    })
  })
  describe('.lengthSquared', () => {
    it ('calculates length', () => {
      expect(Vec2.lengthSquared(new Vec2(2, 0))).toBe(4)
      expect(Vec2.lengthSquared(new Vec2(0, 3))).toBe(9)
    })
  })
  describe('#distance', () => {
    it ('calculates distance', () => {
      expect(new Vec2(2, 0).distance(new Vec2(4, 0))).toBe(2)
      expect(new Vec2(0, 3).distance(new Vec2(0, 6))).toBe(3)
    })
  })
  describe('.distance', () => {
    it ('calculates distance', () => {
      expect(Vec2.distance(new Vec2(2, 0), new Vec2(4, 0))).toBe(2)
      expect(Vec2.distance(new Vec2(0, 3), new Vec2(0, 6))).toBe(3)
    })
  })
  describe('#distanceSquared', () => {
    it ('calculates distance', () => {
      expect(new Vec2(2, 0).distanceSquared(new Vec2(4, 0))).toBe(4)
      expect(new Vec2(0, 3).distanceSquared(new Vec2(0, 6))).toBe(9)
    })
  })
  describe('.distanceSquared', () => {
    it ('calculates distance', () => {
      expect(Vec2.distanceSquared(new Vec2(2, 0), new Vec2(4, 0))).toBe(4)
      expect(Vec2.distanceSquared(new Vec2(0, 3), new Vec2(0, 6))).toBe(9)
    })
  })
  describe('#dot', () => {
    it ('calculates dot', () => {
      expect(new Vec2(2, 0).dot(new Vec2(4, 0))).toBe(8)
      expect(new Vec2(0, 3).dot(new Vec2(0, 6))).toBe(18)
    })
  })
  describe('.dot', () => {
    it ('calculates dot', () => {
      expect(Vec2.dot(new Vec2(2, 0), new Vec2(4, 0))).toBe(8)
      expect(Vec2.dot(new Vec2(0, 3), new Vec2(0, 6))).toBe(18)
    })
  })
  describe('#normalize', () => {
    it ('normalizes', () => expect(new Vec2(1, 2).normalize().length()).toBeCloseTo(1))
  })
  describe('.normalize', () => {
    it ('normalizes', () => expect(Vec2.len(Vec2.normalize(new Vec2(1, 2)))).toBeCloseTo(1))
  })
  describe('#invert', () => {
    it ('inverts', () => expectComponents(new Vec2(2, 4).invert(), 0.5, 0.25))
    it ('return instance', () => expect(a.init(2, 4).invert()).toBe(a))
  })
  describe('.invert', () => {
    it ('inverts', () => expectComponents(Vec2.invert(new Vec2(2, 4)), 0.5, 0.25))
  })
  describe('#negate', () => {
    it ('negates', () => expectComponents(new Vec2(2, 4).negate(), -2, -4))
    it ('return instance', () => expect(a.init(2, 4).negate()).toBe(a))
  })
  describe('.negate', () => {
    it ('negates', () => expectComponents(Vec2.negate(new Vec2(2, 4)), -2, -4))
  })
  describe('add operations', () => {
    beforeEach(() => {
      a = new Vec2(1, 2)
      b = new Vec2(5, 6)
      c = new Vec2(6, 8)
    })
    describe('#add', () => {
      it ('adds', () => expectEquality(a.add(b), c))
      it ('returns instance', () => expect(a.add(b)).toBe(a))
    })
    describe('.add', () => {
      it ('adds', () => expectEquality(Vec2.add(a, b), c))
      it ('returns new instance', () => {
        let res = Vec2.add(a, b)
        expect(res).not.toBe(a)
        expect(res).not.toBe(b)
      })
      it ('returns given instance', () => expect(Vec2.add(a, b, d)).toBe(d))
    })
    describe('#addScaled', () => {
      it ('adds', () => {
        a = new Vec2(1, 2)
        b = new Vec2(5, 6)
        c = a.addScaled(b, 0.5)
        expectComponents(c, 3.5, 5)
        expect(a).toBe(c)
      })
    })
    describe('#addScalar', () => {
      it ('adds', () => {
        a = new Vec2(1, 2)
        c = a.addScalar(0.5)
        expectComponents(c, 1.5, 2.5)
        expect(a).toBe(c)
      })
    })
    describe('.addScalar', () => {
      it ('adds', () => {
        a = new Vec2(1, 2)
        Vec2.addScalar(a, 0.5, c)
        expectComponents(c, 1.5, 2.5)
        expect(a).not.toBe(c)
      })
    })
  })

  describe('subtract operation', () => {
    beforeEach(() => {
      a = new Vec2(5, 6)
      b = new Vec2(4, 3)
      c = new Vec2(1, 3)
    })
    describe('#subtract', () => {
      it ('subtracts', () => expectEquality(a.subtract(b), c))
      it ('returns instance', () => expect(a.subtract(b)).toBe(a))
    })
    describe('.subtract', () => {
      it ('subtracts', () => expectEquality(Vec2.subtract(a, b), c))
      it ('returns new instance', () => {
        let res = Vec2.subtract(a, b)
        expect(res).not.toBe(a)
        expect(res).not.toBe(b)
      })
      it ('returns given instance', () => expect(Vec2.subtract(a, b, d)).toBe(d))
    })
    describe('#subtractScaled', () => {
      it ('subtracts', () => {
        a = new Vec2(5, 6)
        b = new Vec2(1, 2)
        c = a.subtractScaled(b, 0.5)
        expectComponents(c, 4.5, 5)
        expect(a).toBe(c)
      })
    })
    describe('#subtractScalar', () => {
      it ('subtracts', () => {
        a = new Vec2(1, 2)
        c = a.subtractScalar(0.5)
        expectComponents(c, 0.5, 1.5)
        expect(a).toBe(c)
      })
    })
    describe('.subtractScalar', () => {
      it ('subtracts', () => {
        a = new Vec2(1, 2)
        Vec2.subtractScalar(a, 0.5, c)
        expectComponents(c, 0.5, 1.5)
        expect(a).not.toBe(c)
      })
    })
  })

  describe('multiply operation', () => {
    beforeEach(() => {
      a = new Vec2(1, 2)
      b = new Vec2(5, 6)
      c = new Vec2(5, 12)
    })
    describe('#multiply', () => {
      it ('multiplys', () => expectEquality(a.multiply(b), c))
      it ('returns instance', () => expect(a.multiply(b)).toBe(a))
    })
    describe('.multiply', () => {
      it ('multiplys', () => expectEquality(Vec2.multiply(a, b), c))
      it ('returns new instance', () => {
        let res = Vec2.multiply(a, b)
        expect(res).not.toBe(a)
        expect(res).not.toBe(b)
      })
      it ('returns given instance', () => expect(Vec2.multiply(a, b, d)).toBe(d))
    })
    describe('#multiplyScalar', () => {
      it ('multiplys', () => {
        a = new Vec2(1, 2)
        c = a.multiplyScalar(0.5)
        expectComponents(c, 0.5, 1)
        expect(a).toBe(c)
      })
    })
    describe('.multiplyScalar', () => {
      it ('multiplys', () => {
        a = new Vec2(1, 2)
        Vec2.multiplyScalar(a, 0.5, c)
        expectComponents(c, 0.5, 1)
        expect(a).not.toBe(c)
      })
    })
    describe('#multiplyScalarAdd', () => {
      it ('calculates C = A * s + B', () => {
        const A = Vec2.create(1, 2)
        const s = 0.5
        const B = Vec2.create(4, 5)
        let C = Vec2.create()
        C = A.multiplyScalarAdd(s, B)
        expectComponents(A, 4.5, 6)
        expect(A).toBe(C)
      })
    })
    describe('.multiplyScalarAdd', () => {
      it ('calculates C = A * s + B', () => {
        const A = Vec2.create(1, 2)
        const s = 0.5
        const B = Vec2.create(4, 5)
        let C = Vec2.create()
        Vec2.multiplyScalarAdd(A, s, B, C)
        expectComponents(C, 4.5, 6)
        expect(A).not.toBe(C)

        C = Vec2.multiplyScalarAdd(A, s, B)
        expectComponents(C, 4.5, 6)
        expect(A).not.toBe(C)
      })
    })
    describe('#multiplyAdd', () => {
      it ('multiplys', () => {
        a = new Vec2(1, 2)
        b = new Vec2(5, 6)
        c = new Vec2(9, 10)
        d = a.multiplyAdd(b, c)
        expectComponents(d, 14, 22)
        expect(a).toBe(d)
      })
    })
    describe('.multiplyAdd', () => {
      it ('multiplys', () => {
        a = new Vec2(1, 2)
        b = new Vec2(5, 6)
        c = new Vec2(9, 10)
        const e = Vec2.multiplyAdd(a, b, c, d)
        expectComponents(d, 14, 22)
        expect(d).toBe(e)
      })
    })
  })

  describe('divide operation', () => {
    beforeEach(() => {
      a = new Vec2(4, 16)
      b = new Vec2(2, 4)
      c = new Vec2(2, 4)
    })
    describe('#divide', () => {
      it ('divides', () => expectEquality(a.divide(b), c))
      it ('returns instance', () => expect(a.divide(b)).toBe(a))
    })
    describe('.divide', () => {
      it ('divides', () => expectEquality(Vec2.divide(a, b), c))
      it ('returns new instance', () => {
        let res = Vec2.divide(a, b)
        expect(res).not.toBe(a)
        expect(res).not.toBe(b)
      })
      it ('returns given instance', () => expect(Vec2.divide(a, b, d)).toBe(d))
    })
    describe('#divideScalar', () => {
      it ('divides', () => {
        a = new Vec2(1, 2)
        c = a.divideScalar(2)
        expectComponents(c, 0.5, 1)
        expect(a).toBe(c)
      })
    })
    describe('.divideScalar', () => {
      it ('divides', () => {
        a = new Vec2(1, 2)
        Vec2.divideScalar(a, 2, c)
        expectComponents(c, 0.5, 1)
        expect(a).not.toBe(c)
      })
    })
  })

  describe('.create', () => {
    it ('creates a new Vec2', () => {
      expectComponents(Vec2.create(), 0, 0)
      expectComponents(Vec2.create(1, 2), 1, 2)
    })
  })

  describe('.clamp', () => {
    it ('clamps to min', () => {
      a = new Vec2(1, 2)
      b = new Vec2(1.5, 2.5)
      c = Vec2.clamp(new Vec2(0.9, 1.9), a, b)
      expectComponents(c, 1, 2)
    })

    it ('clamps to max', () => {
      a = new Vec2(1, 2)
      b = new Vec2(1.5, 2.5)
      c = Vec2.clamp(new Vec2(1.6, 2.6), a, b)
      expectComponents(c, 1.5, 2.5)
    })
  })

  describe('.clampScalar', () => {
    it ('clamps to min', () => {
      c = Vec2.clampScalar(new Vec2(1, 2), 5, 10)
      expectComponents(c, 5, 5)
    })

    it ('clamps to max', () => {
      c = Vec2.clampScalar(new Vec2(3, 4), 1, 2)
      expectComponents(c, 2, 2)
    })
  })

  describe('.min', () => {
    it ('gets min of the components', () => {
      expectComponents(Vec2.min(new Vec2(1, 2), new Vec2(5, 6)), 1, 2)
      expectComponents(Vec2.min(new Vec2(5, 6), new Vec2(1, 2)), 1, 2)
    })
  })

  describe('.minScalar', () => {
    it ('gets min of the components', () => {
      expectComponents(Vec2.minScalar(new Vec2(1, 2), 0.5), 0.5, 0.5)
      expectComponents(Vec2.minScalar(new Vec2(1, 2), 5), 1, 2)
    })
  })

  describe('.max', () => {
    it ('gets max of the components', () => {
      expectComponents(Vec2.max(new Vec2(1, 2), new Vec2(5, 6)), 5, 6)
      expectComponents(Vec2.max(new Vec2(5, 6), new Vec2(1, 2)), 5, 6)
    })
  })

  describe('.maxScalar', () => {
    it ('gets maxScalar of the components', () => {
      expectComponents(Vec2.maxScalar(new Vec2(1, 2), 5), 5, 5)
      expectComponents(Vec2.maxScalar(new Vec2(1, 2), 0.5), 1, 2)
    })
  })

  describe('.lerp', () => {
    it ('interpolates of the components', () => {
      expectComponents(Vec2.lerp(new Vec2(1, 2), new Vec2(5, 6), 0.5), 3, 4)
    })
  })

  describe('.barycentric', () => {
    it ('interpolates the components', () => {
      expectComponents(Vec2.barycentric(new Vec2(1, 2), new Vec2(5, 6), new Vec2(9, 10), 0.5, 0.5), 7, 8)
    })
  })

  describe('.smooth', () => {
    it ('interpolates the components', () => {
      expectComponents(Vec2.smooth(new Vec2(1, 2), new Vec2(5, 6), 0.5), 3, 4)
    })
  })

  describe('.convert', () => {
    it ('converts number', () => {
      expectComponents(Vec2.convert(1), 1, 1)
    })

    it ('converts number[]', () => {
      expectComponents(Vec2.convert([1, 2, 3]), 1, 2)
      expectComponents(Vec2.convert([null, null, null, null]), 0, 0)
    })

    it ('converts IVec2', () => {
      expectComponents(Vec2.convert({ x: 1, y: 2 }), 1, 2)
      expectComponents(Vec2.convert({} as any), 0, 0)
    })
  })

  describe('#format', () => {
    it ('formats components', () => {
      expect(Vec2.create(1, 2).format()).toBe('1.00000,2.00000')
    })
  })
})
