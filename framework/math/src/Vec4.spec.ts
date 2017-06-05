import { IVec4, Vec4 } from '@glib/math'

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
      let v = new Vec4(1, 2, 3, 4)
      expectComponents(v, 1, 2, 3, 4)
    })

    it ('is valid without parameters', () => {
      let v = new Vec4()
      expectComponents(v, 0, 0, 0, 0)
    })
  })

  describe('#setX', () => {
    it ('set the value', () => expectComponents(a.setX(1), 1, 0, 0, 0) )
    it ('returns same instance', () => expect(a.setX(1)).toBe(a))
  })
  describe('#setY', () => {
    it ('set the value', () => expectComponents(a.setY(1), 0, 1, 0, 0) )
    it ('returns same instance', () => expect(a.setY(1)).toBe(a))
  })
  describe('#setZ', () => {
    it ('set the value', () => expectComponents(a.setZ(1), 0, 0, 1, 0) )
    it ('returns same instance', () => expect(a.setZ(1)).toBe(a))
  })
  describe('#setW', () => {
    it ('set the value', () => expectComponents(a.setW(1), 0, 0, 0, 1) )
    it ('returns same instance', () => expect(a.setW(1)).toBe(a))
  })
  describe('#set', () => {
    it ('set x value', () => expectComponents(a.set(0, 1), 1, 0, 0, 0) )
    it ('set x value', () => expectComponents(a.set('x', 1), 1, 0, 0, 0) )
    it ('set y value', () => expectComponents(a.set(1, 1), 0, 1, 0, 0) )
    it ('set y value', () => expectComponents(a.set('y', 1), 0, 1, 0, 0) )
    it ('set z value', () => expectComponents(a.set(2, 1), 0, 0, 1, 0) )
    it ('set z value', () => expectComponents(a.set('z', 1), 0, 0, 1, 0) )
    it ('set w value', () => expectComponents(a.set(3, 1), 0, 0, 0, 1) )
    it ('set w value', () => expectComponents(a.set('w', 1), 0, 0, 0, 1) )
    it ('returns same instance', () => expect(a.set(0, 1)).toBe(a))
  })
  describe('#get', () => {
    beforeEach(() => {
      a = new Vec4(1, 2, 3, 4)
    })
    it ('set x value', () => expect(a.get(0)).toEqual(1))
    it ('set x value', () => expect(a.get('x')).toEqual(1))
    it ('set y value', () => expect(a.get(1)).toEqual(2))
    it ('set y value', () => expect(a.get('y')).toEqual(2))
    it ('set z value', () => expect(a.get(2)).toEqual(3))
    it ('set z value', () => expect(a.get('z')).toEqual(3))
    it ('set w value', () => expect(a.get(3)).toEqual(4))
    it ('set w value', () => expect(a.get('w')).toEqual(4))
  })
  describe('#init', () => {
    it ('inits all components', () => expectComponents(a.init(1, 2, 3, 4), 1, 2, 3, 4) )
    it ('returns same instance', () => expect(a.init(1, 2, 3, 4)).toBe(a))
  })
  describe('#initFrom', () => {
    beforeEach(() => {
      b = new Vec4(1, 2, 3, 4)
    })
    it ('inits all components', () => expectComponents(a.initFrom(b), 1, 2, 3, 4) )
    it ('returns same instance', () => expect(a.initFrom(b)).toBe(a))
  })
  describe('#initFromBuffer', () => {
    it ('inits all components', () => expectComponents(a.initFromBuffer([1, 2, 3, 4, 5], 1), 2, 3, 4, 5) )
    it ('returns same instance', () => expect(a.initFromBuffer([1, 2, 3, 4, 5], 1)).toBe(a))
  })
  describe('#clone', () => {
    beforeEach(() => {
      a = new Vec4(1, 2, 3, 4)
    })
    it ('clones all components', () => expectComponents(a.clone(), 1, 2, 3, 4) )
    it ('returns new instance', () => expect(a.clone()).not.toBe(a))
  })
  describe('#length', () => {
    it ('calculates length', () => {
      expect(new Vec4(2, 0, 0, 0).length()).toBe(2)
      expect(new Vec4(0, 3, 0, 0).length()).toBe(3)
      expect(new Vec4(0, 0, 4, 0).length()).toBe(4)
      expect(new Vec4(0, 0, 0, 5).length()).toBe(5)
    })
  })
  describe('#lengthSquared', () => {
    it ('calculates length', () => {
      expect(new Vec4(2, 0, 0, 0).lengthSquared()).toBe(4)
      expect(new Vec4(0, 3, 0, 0).lengthSquared()).toBe(9)
      expect(new Vec4(0, 0, 4, 0).lengthSquared()).toBe(16)
      expect(new Vec4(0, 0, 0, 5).lengthSquared()).toBe(25)
    })
  })
  describe('#distance', () => {
    it ('calculates distance', () => {
      expect(new Vec4(2, 0, 0, 0).distance(new Vec4(4, 0, 0, 0))).toBe(2)
      expect(new Vec4(0, 3, 0, 0).distance(new Vec4(0, 6, 0, 0))).toBe(3)
      expect(new Vec4(0, 0, 4, 0).distance(new Vec4(0, 0, 8, 0))).toBe(4)
      expect(new Vec4(0, 0, 0, 5).distance(new Vec4(0, 0, 0, 10))).toBe(5)
    })
  })
  describe('#distanceSquared', () => {
    it ('calculates distance', () => {
      expect(new Vec4(2, 0, 0, 0).distanceSquared(new Vec4(4, 0, 0, 0))).toBe(4)
      expect(new Vec4(0, 3, 0, 0).distanceSquared(new Vec4(0, 6, 0, 0))).toBe(9)
      expect(new Vec4(0, 0, 4, 0).distanceSquared(new Vec4(0, 0, 8, 0))).toBe(16)
      expect(new Vec4(0, 0, 0, 5).distanceSquared(new Vec4(0, 0, 0, 10))).toBe(25)
    })
  })
  describe('#dot', () => {
    it ('calculates dot', () => {
      expect(new Vec4(2, 0, 0, 0).dot(new Vec4(4, 0, 0, 0))).toBe(8)
      expect(new Vec4(0, 3, 0, 0).dot(new Vec4(0, 6, 0, 0))).toBe(18)
      expect(new Vec4(0, 0, 4, 0).dot(new Vec4(0, 0, 8, 0))).toBe(32)
      expect(new Vec4(0, 0, 0, 5).dot(new Vec4(0, 0, 0, 10))).toBe(50)
    })
  })
  describe('#normalize', () => {
    it ('normalizes', () => expect(new Vec4(1, 2, 3, 4).normalize().length()).toBeCloseTo(1) )
  })
  describe('#normalizeOut', () => {
    it ('normalizes', () => expect(new Vec4(1, 2, 3, 4).normalizeOut(a).length()).toBeCloseTo(1) )
    it ('returns out parameter', () => expect(new Vec4(1, 2, 3, 4).normalizeOut(a)).toBe(a) )
  })
  describe('#invert', () => {
    it ('inverts', () => expectComponents(new Vec4(2, 4, 8, 16).invert(), 0.5, 0.25, 0.125, 0.0625) )
    it ('return instance', () => expect(a.init(2, 4, 8, 16).invert()).toBe(a) )
  })
  describe('#invertOut', () => {
    it ('inverts', () => expectComponents(new Vec4(2, 4, 8, 16).invertOut(a), 0.5, 0.25, 0.125, 0.0625) )
    it ('return instance', () => expect(a.init(2, 4, 8, 16).invertOut(b)).toBe(b) )
  })
  describe('#negate', () => {
    it ('negates', () => expectComponents(new Vec4(2, 4, 8, 16).negate(), -2, -4, -8, -16) )
    it ('return instance', () => expect(a.init(2, 4, 8, 16).negate()).toBe(a) )
  })
  describe('#negateOut', () => {
    it ('negates', () => expectComponents(new Vec4(2, 4, 8, 16).negateOut(a), -2, -4, -8, -16) )
    it ('return instance', () => expect(a.init(2, 4, 8, 16).negateOut(b)).toBe(b) )
  })

  describe('add operations', () => {
    beforeEach(() => {
      a = new Vec4(1, 2, 3, 4)
      b = new Vec4(5, 6, 7, 8)
      c = new Vec4(6, 8, 10, 12)
    })
    describe('#add', () => {
      it ('adds components', () => expectEquality(a.add(b), c))
      it ('returns instance', () => expect(a.add(b)).toBe(a))
    })
    describe('#addOut', () => {
      it ('adds components', () => expectEquality(a.addOut(b), c))
      it ('returns new instance', () => expect(a.addOut(b)).not.toBe(a))
      it ('returns given instance', () => expect(a.addOut(b, d)).toBe(d))
    })
    describe('.add', () => {
      it ('adds components', () => expectEquality(Vec4.add(a, b), c))
      it ('returns new instance', () => {
        let res = Vec4.add(a, b)
        expect(res).not.toBe(a)
        expect(res).not.toBe(b)
      })
      it ('returns given instance', () => expect(Vec4.add(a, b, d)).toBe(d))
    })
  })

  describe('operation', () => {
    beforeEach(() => {
      a = new Vec4(5, 6, 7, 8)
      b = new Vec4(4, 3, 2, 1)
      c = new Vec4(1, 3, 5, 7)
    })
    describe('#subtract', () => {
      it ('subtracts components', () => expectEquality(a.subtract(b), c))
      it ('returns instance', () => expect(a.subtract(b)).toBe(a))
    })
    describe('#subtractOut', () => {
      it ('subtracts components', () => expectEquality(a.subtractOut(b), c))
      it ('returns new instance', () => expect(a.subtractOut(b)).not.toBe(a))
      it ('returns given instance', () => expect(a.subtractOut(b, d)).toBe(d))
    })
    describe('.subtract', () => {
      it ('subtracts components', () => expectEquality(Vec4.subtract(a, b), c))
      it ('returns new instance', () => {
        let res = Vec4.subtract(a, b)
        expect(res).not.toBe(a)
        expect(res).not.toBe(b)
      })
      it ('returns given instance', () => expect(Vec4.subtract(a, b, d)).toBe(d))
    })
  })

  describe('operation', () => {
    beforeEach(() => {
      a = new Vec4(1, 2, 3, 4)
      b = new Vec4(5, 6, 7, 8)
      c = new Vec4(5, 12, 21, 32)
    })
    describe('#multiply', () => {
      it ('multiplys components', () => expectEquality(a.multiply(b), c))
      it ('returns instance', () => expect(a.multiply(b)).toBe(a))
    })
    describe('#multiplyOut', () => {
      it ('multiplys components', () => expectEquality(a.multiplyOut(b), c))
      it ('returns new instance', () => expect(a.multiplyOut(b)).not.toBe(a))
      it ('returns given instance', () => expect(a.multiplyOut(b, d)).toBe(d))
    })
    describe('.multiply', () => {
      it ('multiplys components', () => expectEquality(Vec4.multiply(a, b), c))
      it ('returns new instance', () => {
        let res = Vec4.multiply(a, b)
        expect(res).not.toBe(a)
        expect(res).not.toBe(b)
      })
      it ('returns given instance', () => expect(Vec4.multiply(a, b, d)).toBe(d))
    })
  })

  describe('operation', () => {
    beforeEach(() => {
      a = new Vec4(4, 16, 64, 256)
      b = new Vec4(2, 4, 8, 16)
      c = new Vec4(2, 4, 8, 16)
    })
    describe('#divide', () => {
      it ('divides components', () => expectEquality(a.divide(b), c))
      it ('returns instance', () => expect(a.divide(b)).toBe(a))
    })
    describe('#divideOut', () => {
      it ('divides components', () => expectEquality(a.divideOut(b), c))
      it ('returns new instance', () => expect(a.divideOut(b)).not.toBe(a))
      it ('returns given instance', () => expect(a.divideOut(b, d)).toBe(d))
    })
    describe('.divide', () => {
      it ('divides components', () => expectEquality(Vec4.divide(a, b), c))
      it ('returns new instance', () => {
        let res = Vec4.divide(a, b)
        expect(res).not.toBe(a)
        expect(res).not.toBe(b)
      })
      it ('returns given instance', () => expect(Vec4.divide(a, b, d)).toBe(d))
    })
  })
})
