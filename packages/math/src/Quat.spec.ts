import { IVec3, IVec4, Quat, Vec3 } from '@gglib/math'

describe('Quat', () => {

  function expectComponents(v: IVec4, x: number, y: number, z: number, w: number) {
    expect(v.x).toBeCloseTo(x, 10, 'x component')
    expect(v.y).toBeCloseTo(y, 10, 'y component')
    expect(v.z).toBeCloseTo(z, 10, 'z component')
    expect(v.w).toBeCloseTo(w, 10, 'w component')
  }

  function expectV3Components(v: IVec3, x: number, y: number, z: number) {
    expect(v.x).toBeCloseTo(x, 10, 'x component')
    expect(v.y).toBeCloseTo(y, 10, 'y component')
    expect(v.z).toBeCloseTo(z, 10, 'z component')
  }

  function expectEquality(v1: IVec4, v2: IVec4) {
    expect(v1.x).toBeCloseTo(v2.x, 10, 'x component')
    expect(v1.y).toBeCloseTo(v2.y, 10, 'y component')
    expect(v1.z).toBeCloseTo(v2.z, 10, 'z component')
    expect(v1.w).toBeCloseTo(v2.w, 10, 'w component')
  }

  let a = new Quat()
  let b = new Quat()
  let c = new Quat()
  let d = new Quat()

  beforeEach(() => {
    a = new Quat()
    b = new Quat()
    c = new Quat()
    d = new Quat()
  })

  describe('#constructor', () => {
    it ('initializes all components', () => {
      let v = new Quat(1, 2, 3, 4)
      expectComponents(v, 1, 2, 3, 4)
    })

    it ('is valid without parameters', () => {
      let v = new Quat()
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
      a = new Quat(1, 2, 3, 4)
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
      b = new Quat(1, 2, 3, 4)
    })
    it ('inits all components', () => expectComponents(a.initFrom(b), 1, 2, 3, 4) )
    it ('returns same instance', () => expect(a.initFrom(b)).toBe(a))
  })
  describe('.createFrom', () => {
    beforeEach(() => {
      b = new Quat(1, 2, 3, 4)
    })
    it ('inits all components', () => expectComponents(Quat.createFrom(b), 1, 2, 3, 4) )
  })
  describe('#initFromBuffer', () => {
    it ('inits all components', () => expectComponents(a.initFromBuffer([1, 2, 3, 4, 5], 1), 2, 3, 4, 5) )
    it ('returns same instance', () => expect(a.initFromBuffer([1, 2, 3, 4, 5], 1)).toBe(a))
  })
  describe('.createFromBuffer', () => {
    it ('inits all components', () => expectComponents(Quat.createFromBuffer([1, 2, 3, 4, 5], 1), 2, 3, 4, 5) )
  })
  describe('#clone', () => {
    beforeEach(() => {
      a = new Quat(1, 2, 3, 4)
    })
    it ('clones all components', () => expectComponents(a.clone(), 1, 2, 3, 4) )
    it ('returns new instance', () => expect(a.clone()).not.toBe(a))
  })
  describe('.clone', () => {
    beforeEach(() => {
      a = new Quat(1, 2, 3, 4)
    })
    it ('clones all components', () => expectComponents(Quat.clone(a), 1, 2, 3, 4) )
    it ('returns new instance', () => expect(Quat.clone(a)).not.toBe(a))
  })
  describe('#toArray', () => {
    beforeEach(() => {
      a = new Quat(1, 2, 3, 4)
    })
    it ('copies components', () => expect(a.toArray()).toEqual([1, 2, 3, 4]))
    it ('copies components at offset', () => expect(a.toArray([0, 0, 0, 0, 0], 1)).toEqual([0, 1, 2, 3, 4]))
  })
  describe('.toArray', () => {
    beforeEach(() => {
      a = new Quat(1, 2, 3, 4)
    })
    it ('copies components', () => expect(Quat.toArray(a, [])).toEqual([1, 2, 3, 4]))
    it ('copies components at offset', () => expect(Quat.toArray(a, [0, 0, 0, 0, 0], 1)).toEqual([0, 1, 2, 3, 4]))
  })
  describe('#equals', () => {
    it ('compares components', () => {
      expect(Quat.create(0, 0, 0, 0).equals(Quat.create(0, 0, 0, 0))).toBe(true)
      expect(Quat.create(1, 0, 0, 0).equals(Quat.create(1, 0, 0, 0))).toBe(true)
      expect(Quat.create(0, 1, 0, 0).equals(Quat.create(0, 1, 0, 0))).toBe(true)
      expect(Quat.create(0, 0, 1, 0).equals(Quat.create(0, 0, 1, 0))).toBe(true)
      expect(Quat.create(0, 0, 0, 1).equals(Quat.create(0, 0, 0, 1))).toBe(true)
      expect(Quat.create(0, 0, 0, 0).equals(Quat.create(1, 0, 0, 0))).toBe(false)
      expect(Quat.create(0, 0, 0, 0).equals(Quat.create(0, 1, 0, 0))).toBe(false)
      expect(Quat.create(0, 0, 0, 0).equals(Quat.create(0, 0, 1, 0))).toBe(false)
      expect(Quat.create(0, 0, 0, 0).equals(Quat.create(0, 0, 0, 1))).toBe(false)
    })
  })
  describe('.equals', () => {
    it ('compares components', () => {
      expect(Quat.equals(Quat.create(0, 0, 0, 0), Quat.create(0, 0, 0, 0))).toBe(true)
      expect(Quat.equals(Quat.create(1, 0, 0, 0), Quat.create(1, 0, 0, 0))).toBe(true)
      expect(Quat.equals(Quat.create(0, 1, 0, 0), Quat.create(0, 1, 0, 0))).toBe(true)
      expect(Quat.equals(Quat.create(0, 0, 1, 0), Quat.create(0, 0, 1, 0))).toBe(true)
      expect(Quat.equals(Quat.create(0, 0, 0, 1), Quat.create(0, 0, 0, 1))).toBe(true)
      expect(Quat.equals(Quat.create(0, 0, 0, 0), Quat.create(1, 0, 0, 0))).toBe(false)
      expect(Quat.equals(Quat.create(0, 0, 0, 0), Quat.create(0, 1, 0, 0))).toBe(false)
      expect(Quat.equals(Quat.create(0, 0, 0, 0), Quat.create(0, 0, 1, 0))).toBe(false)
      expect(Quat.equals(Quat.create(0, 0, 0, 0), Quat.create(0, 0, 0, 1))).toBe(false)
    })
  })
  describe('#length', () => {
    it ('calculates length', () => {
      expect(new Quat(2, 0, 0, 0).length()).toBe(2)
      expect(new Quat(0, 3, 0, 0).length()).toBe(3)
      expect(new Quat(0, 0, 4, 0).length()).toBe(4)
      expect(new Quat(0, 0, 0, 5).length()).toBe(5)
    })
  })
  describe('.len', () => {
    it ('calculates length', () => {
      expect(Quat.len(new Quat(2, 0, 0, 0))).toBe(2)
      expect(Quat.len(new Quat(0, 3, 0, 0))).toBe(3)
      expect(Quat.len(new Quat(0, 0, 4, 0))).toBe(4)
      expect(Quat.len(new Quat(0, 0, 0, 5))).toBe(5)
    })
  })
  describe('#lengthSquared', () => {
    it ('calculates length', () => {
      expect(new Quat(2, 0, 0, 0).lengthSquared()).toBe(4)
      expect(new Quat(0, 3, 0, 0).lengthSquared()).toBe(9)
      expect(new Quat(0, 0, 4, 0).lengthSquared()).toBe(16)
      expect(new Quat(0, 0, 0, 5).lengthSquared()).toBe(25)
    })
  })
  describe('.lengthSquared', () => {
    it ('calculates length', () => {
      expect(Quat.lengthSquared(new Quat(2, 0, 0, 0))).toBe(4)
      expect(Quat.lengthSquared(new Quat(0, 3, 0, 0))).toBe(9)
      expect(Quat.lengthSquared(new Quat(0, 0, 4, 0))).toBe(16)
      expect(Quat.lengthSquared(new Quat(0, 0, 0, 5))).toBe(25)
    })
  })
  describe('#dot', () => {
    it ('calculates dot', () => {
      expect(new Quat(2, 0, 0, 0).dot(new Quat(4, 0, 0, 0))).toBe(8)
      expect(new Quat(0, 3, 0, 0).dot(new Quat(0, 6, 0, 0))).toBe(18)
      expect(new Quat(0, 0, 4, 0).dot(new Quat(0, 0, 8, 0))).toBe(32)
      expect(new Quat(0, 0, 0, 5).dot(new Quat(0, 0, 0, 10))).toBe(50)
    })
  })
  describe('.dot', () => {
    it ('calculates dot', () => {
      expect(Quat.dot(new Quat(2, 0, 0, 0), new Quat(4, 0, 0, 0))).toBe(8)
      expect(Quat.dot(new Quat(0, 3, 0, 0), new Quat(0, 6, 0, 0))).toBe(18)
      expect(Quat.dot(new Quat(0, 0, 4, 0), new Quat(0, 0, 8, 0))).toBe(32)
      expect(Quat.dot(new Quat(0, 0, 0, 5), new Quat(0, 0, 0, 10))).toBe(50)
    })
  })
  describe('#normalize', () => {
    it ('normalizes', () => expect(new Quat(1, 2, 3, 4).normalize().length()).toBeCloseTo(1) )
  })
  describe('.normalize', () => {
    it ('normalizes', () => expect(Quat.len(Quat.normalize(new Quat(1, 2, 3, 4)))).toBeCloseTo(1) )
  })
  describe('#invert', () => {
    it ('inverts', () => {
      const q1 = new Quat(2, 4, 8, 16).normalize()
      expectComponents(Quat.multiply(q1, q1.clone().invert()), 0, 0, 0, 1)
    })
    it ('return instance', () => expect(a.init(2, 4, 8, 16).invert()).toBe(a) )
  })
  describe('.invert', () => {
    it ('inverts', () => {
      const q1 = new Quat(2, 4, 8, 16).normalize()
      expectComponents(Quat.multiply(q1, Quat.invert(q1)), 0, 0, 0, 1)
    })
  })
  describe('#negate', () => {
    it ('negates', () => expectComponents(new Quat(2, 4, 8, 16).negate(), -2, -4, -8, -16) )
    it ('return instance', () => expect(a.init(2, 4, 8, 16).negate()).toBe(a) )
  })
  describe('.negate', () => {
    it ('negates', () => expectComponents(Quat.negate(new Quat(2, 4, 8, 16)), -2, -4, -8, -16) )
  })
  describe('#conjugate', () => {
    it ('conjugates', () => expectComponents(new Quat(2, 4, 8, 16).conjugate(), -2, -4, -8, 16) )
    it ('return instance', () => expect(a.init(2, 4, 8, 16).conjugate()).toBe(a) )
  })
  describe('.conjugate', () => {
    it ('conjugates', () => expectComponents(Quat.conjugate(new Quat(2, 4, 8, 16)), -2, -4, -8, 16) )
  })
  describe('add operations', () => {
    beforeEach(() => {
      a = new Quat(1, 2, 3, 4)
      b = new Quat(5, 6, 7, 8)
      c = new Quat(6, 8, 10, 12)
    })
    describe('#add', () => {
      it ('adds', () => expectEquality(a.add(b), c))
      it ('returns instance', () => expect(a.add(b)).toBe(a))
    })
    describe('.add', () => {
      it ('adds', () => expectEquality(Quat.add(a, b), c))
      it ('returns new instance', () => {
        let res = Quat.add(a, b)
        expect(res).not.toBe(a)
        expect(res).not.toBe(b)
      })
      it ('returns given instance', () => expect(Quat.add(a, b, d)).toBe(d))
    })
  })

  describe('subtract operation', () => {
    beforeEach(() => {
      a = new Quat(5, 6, 7, 8)
      b = new Quat(4, 3, 2, 1)
      c = new Quat(1, 3, 5, 7)
    })
    describe('#subtract', () => {
      it ('subtracts', () => expectEquality(a.subtract(b), c))
      it ('returns instance', () => expect(a.subtract(b)).toBe(a))
    })
    describe('.subtract', () => {
      it ('subtracts', () => expectEquality(Quat.subtract(a, b), c))
      it ('returns new instance', () => {
        let res = Quat.subtract(a, b)
        expect(res).not.toBe(a)
        expect(res).not.toBe(b)
      })
      it ('returns given instance', () => expect(Quat.subtract(a, b, d)).toBe(d))
    })
  })

  describe('#multiply', () => {
    it ('multiplies', () => {
      expectComponents(new Quat(1, 2, 3, 4).multiply(new Quat(5, 6, 7, 8)), 24, 48, 48, -6)
    })
  })

  describe('.multiply', () => {
    it ('multiplies', () => {
      expectComponents(Quat.multiply(new Quat(1, 2, 3, 4), new Quat(5, 6, 7, 8)), 24, 48, 48, -6)
    })
  })

  describe('#concat', () => {
    it ('multiplies', () => {
      expectComponents(new Quat(5, 6, 7, 8).concat(new Quat(1, 2, 3, 4)), 24, 48, 48, -6)
    })
  })

  describe('.concat', () => {
    it ('multiplies', () => {
      expectComponents(Quat.concat(new Quat(5, 6, 7, 8), new Quat(1, 2, 3, 4)), 24, 48, 48, -6)
    })
  })

  describe('#divide', () => {
    it ('divides', () => {
      expectEquality(
        new Quat(1, 2, 3, 4).divide(new Quat(5, 6, 7, 8)),
        new Quat(1, 2, 3, 4).multiply(new Quat(5, 6, 7, 8).invert()),
      )
    })
  })

  describe('.divide', () => {
    it ('divides', () => {
      expectEquality(
        Quat.divide(new Quat(1, 2, 3, 4), new Quat(5, 6, 7, 8)),
        new Quat(1, 2, 3, 4).multiply(new Quat(5, 6, 7, 8).invert()),
      )
    })
  })

  describe('.zero', () => {
    it ('creates a new Quat', () => {
      expectComponents(Quat.createZero(), 0, 0, 0, 0)
    })
  })

  describe('#initZero', () => {
    it ('initializes to zero', () => {
      expectComponents(new Quat(1, 2, 3, 4).initZero(), 0, 0, 0, 0)
    })
  })

  describe('.identity', () => {
    it ('creates a new Quat', () => {
      expectComponents(Quat.createIdentity(), 0, 0, 0, 1)
    })
  })

  describe('#initIdentity', () => {
    it ('initializes to identity', () => {
      expectComponents(new Quat(1, 2, 3, 4).initIdentity(), 0, 0, 0, 1)
    })
  })

  describe('.create', () => {
    it ('creates a new Quat', () => {
      expectComponents(Quat.create(), 0, 0, 0, 0)
      expectComponents(Quat.create(1, 2, 3, 4), 1, 2, 3, 4)
    })
  })

  describe('.from', () => {
    it ('converts number', () => {
      expectComponents(Quat.convert(1), 1, 1, 1, 1)
    })

    it ('converts number[]', () => {
      expectComponents(Quat.convert([1, 2, 3, 4]), 1, 2, 3, 4)
      expectComponents(Quat.convert([null, null, null, null]), 0, 0, 0, 0)
    })

    it ('converts Quat', () => {
      expectComponents(Quat.convert({ x: 1, y: 2, z: 3, w: 4}), 1, 2, 3, 4)
      expectComponents(Quat.convert({} as any), 0, 0, 0, 0)
    })
  })

  describe('.transform', () => {
    it ('transforms an IVec3', () => {
      expectV3Components(Quat.transform(Quat.createAxisAngle(Vec3.Right, 0.5 * Math.PI), Vec3.create(1, 0, 0)), 1,  0, 0)
      expectV3Components(Quat.transform(Quat.createAxisAngle(Vec3.Right, 0.5 * Math.PI), Vec3.create(0, 1, 0)), 0,  0, 1)
      expectV3Components(Quat.transform(Quat.createAxisAngle(Vec3.Right, 0.5 * Math.PI), Vec3.create(0, 0, 1)), 0, -1, 0)

      expectV3Components(Quat.transform(Quat.createAxisAngle(Vec3.Up, 0.5 * Math.PI), Vec3.create(1, 0, 0)), 0, 0, -1)
      expectV3Components(Quat.transform(Quat.createAxisAngle(Vec3.Up, 0.5 * Math.PI), Vec3.create(0, 1, 0)), 0, 1,  0)
      expectV3Components(Quat.transform(Quat.createAxisAngle(Vec3.Up, 0.5 * Math.PI), Vec3.create(0, 0, 1)), 1, 0,  0)

      expectV3Components(Quat.transform(Quat.createAxisAngle(Vec3.Backward, 0.5 * Math.PI), Vec3.create(1, 0, 0)),  0, 1, 0)
      expectV3Components(Quat.transform(Quat.createAxisAngle(Vec3.Backward, 0.5 * Math.PI), Vec3.create(0, 1, 0)), -1, 0, 0)
      expectV3Components(Quat.transform(Quat.createAxisAngle(Vec3.Backward, 0.5 * Math.PI), Vec3.create(0, 0, 1)),  0, 0, 1)
    })
  })

  describe('#transform', () => {
    it ('transforms an IVec3', () => {
      expectV3Components(Quat.createAxisAngle(Vec3.Right, 0.5 * Math.PI).transform(Vec3.create(1, 0, 0)), 1,  0, 0)
      expectV3Components(Quat.createAxisAngle(Vec3.Right, 0.5 * Math.PI).transform(Vec3.create(0, 1, 0)), 0,  0, 1)
      expectV3Components(Quat.createAxisAngle(Vec3.Right, 0.5 * Math.PI).transform(Vec3.create(0, 0, 1)), 0, -1, 0)

      expectV3Components(Quat.createAxisAngle(Vec3.Up, 0.5 * Math.PI).transform(Vec3.create(1, 0, 0)), 0, 0, -1)
      expectV3Components(Quat.createAxisAngle(Vec3.Up, 0.5 * Math.PI).transform(Vec3.create(0, 1, 0)), 0, 1,  0)
      expectV3Components(Quat.createAxisAngle(Vec3.Up, 0.5 * Math.PI).transform(Vec3.create(0, 0, 1)), 1, 0,  0)

      expectV3Components(Quat.createAxisAngle(Vec3.Backward, 0.5 * Math.PI).transform(Vec3.create(1, 0, 0)),  0, 1, 0)
      expectV3Components(Quat.createAxisAngle(Vec3.Backward, 0.5 * Math.PI).transform(Vec3.create(0, 1, 0)), -1, 0, 0)
      expectV3Components(Quat.createAxisAngle(Vec3.Backward, 0.5 * Math.PI).transform(Vec3.create(0, 0, 1)),  0, 0, 1)
    })
  })

  describe('#format', () => {
    it ('prints the component', () => {
      expect(Quat.create(1, 2, 3, 4).format()).toBe('1.00000,2.00000,3.00000,4.00000')
    })
  })

  describe('.format', () => {
    it ('prints the component', () => {
      expect(Quat.format(Quat.create(1, 2, 3, 4))).toBe('1.00000,2.00000,3.00000,4.00000')
    })
  })

  describe('#initYawPitchRoll', () => {
    it('initializes the quaternion', () => {
      expectEquality(new Quat().initYawPitchRoll(Math.PI * 0.5, 0, 0), Quat.createAxisAngle({ x: 0, y: 1, z: 0 }, Math.PI * 0.5))
      expectEquality(new Quat().initYawPitchRoll(0, Math.PI * 0.5, 0), Quat.createAxisAngle({ x: 1, y: 0, z: 0 }, Math.PI * 0.5))
      expectEquality(new Quat().initYawPitchRoll(0, 0, Math.PI * 0.5), Quat.createAxisAngle({ x: 0, y: 0, z: 1 }, Math.PI * 0.5))
    })
  })

  describe('.createYawPitchRoll', () => {
    it('initializes the quaternion', () => {
      expectEquality(Quat.createYawPitchRoll(Math.PI * 0.5, 0, 0), Quat.createAxisAngle({ x: 0, y: 1, z: 0 }, Math.PI * 0.5))
      expectEquality(Quat.createYawPitchRoll(0, Math.PI * 0.5, 0), Quat.createAxisAngle({ x: 1, y: 0, z: 0 }, Math.PI * 0.5))
      expectEquality(Quat.createYawPitchRoll(0, 0, Math.PI * 0.5), Quat.createAxisAngle({ x: 0, y: 0, z: 1 }, Math.PI * 0.5))
    })
  })
})
