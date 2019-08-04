import { IVec3, IVec4, Mat3, Quat, Vec3, Vec4 } from '@gglib/math'

describe('Mat3', () => {

  function expectComponents(v: Mat3, parts: number[]) {
    expect(v.m[0]).toBeCloseTo(parts[0], 10, 'x of right axis')
    expect(v.m[1]).toBeCloseTo(parts[1], 10, 'y of right axis')
    expect(v.m[2]).toBeCloseTo(parts[2], 10, 'z of right axis')
    expect(v.m[3]).toBeCloseTo(parts[3], 10, 'x of up axis')
    expect(v.m[4]).toBeCloseTo(parts[4], 10, 'y of up axis')
    expect(v.m[5]).toBeCloseTo(parts[5], 10, 'z of up axis')
    expect(v.m[6]).toBeCloseTo(parts[6], 10, 'x of back axis')
    expect(v.m[7]).toBeCloseTo(parts[7], 10, 'y of back axis')
    expect(v.m[8]).toBeCloseTo(parts[8], 10, 'z of back axis')
  }

  function expectEquality(v1: Mat3, v2: Mat3, precision: number = 10) {
    expectVec3Equality(v1.getRight(), v2.getRight(), precision)
    expectVec3Equality(v1.getUp(), v2.getUp(), precision)
    expectVec3Equality(v1.getBackward(), v2.getBackward(), precision)
  }

  function expectVec3Equality(v1: IVec3, v2: IVec3, precision: number = 10) {
    expect(v1.x).toBeCloseTo(v2.x, precision, 'x component')
    expect(v1.y).toBeCloseTo(v2.y, precision, 'y component')
    expect(v1.z).toBeCloseTo(v2.z, precision, 'z component')
  }

  function expectVec3Components(v: Vec3, parts: number[]) {
    expect(v.x).toBeCloseTo(parts[0], 10, 'x component')
    expect(v.y).toBeCloseTo(parts[1], 10, 'y component')
    expect(v.z).toBeCloseTo(parts[2], 10, 'z component')
  }

  function expectVec4Components(v: Vec4, parts: number[]) {
    expect(v.x).toBeCloseTo(parts[0], 10, 'x component')
    expect(v.y).toBeCloseTo(parts[1], 10, 'y component')
    expect(v.z).toBeCloseTo(parts[2], 10, 'z component')
    expect(v.w).toBeCloseTo(parts[3], 10, 'w component')
  }

  function expectVec4Equality(v1: Vec4, v2: Vec4, precision: number = 10) {
    expect(v1.x).toBeCloseTo(v2.x, precision, 'x component')
    expect(v1.y).toBeCloseTo(v2.y, precision, 'y component')
    expect(v1.z).toBeCloseTo(v2.z, precision, 'z component')
    expect(v1.w).toBeCloseTo(v2.w, precision, 'w component')
  }

  function expectBuffer(buf1: number[], expected: number[], precision: number = 10) {
    expect(buf1.length).toBe(expected.length)
    buf1.forEach((v, index) => {
      expect(v).toBeCloseTo(expected[index], precision, `buffer index ${index}`)
    })
  }

  describe('initialization', () => {
    describe('#new', () => {
      it ('sets all components to 0', () => {
        expectComponents(new Mat3(), [
          0, 0, 0,
          0, 0, 0,
          0, 0, 0,
        ])
      })
    })

    describe('.zero', () => {
      it ('sets all components to 0', () => {
        expectComponents(Mat3.zero(), [
          0, 0, 0,
          0, 0, 0,
          0, 0, 0,
        ])
        expect(Mat3.zero()).not.toBe(Mat3.zero())
      })
    })

    describe('#init', () => {
      it ('sets all components', () => {
        expectComponents(new Mat3().init(
          1, 2, 3,
          4, 5, 6,
          7, 8, 9,
        ), [
          1, 2, 3,
          4, 5, 6,
          7, 8, 9,
        ])
      })
    })

    describe('.create', () => {
      it ('sets all components', () => {
        expectComponents(Mat3.create(
          1, 2, 3,
          4, 5, 6,
          7, 8, 9,
        ), [
          1, 2, 3,
          4, 5, 6,
          7, 8, 9,
        ])
      })
    })

    describe('#initRowMajor', () => {
      it ('sets all components', () => {
        expectComponents(new Mat3().initRowMajor(
          1, 2, 3,
          4, 5, 6,
          7, 8, 9,
        ), [
          1, 4, 7,
          2, 5, 8,
          3, 6, 9,
        ])
      })
    })

    describe('.createRowMajor', () => {
      it ('sets all components', () => {
        expectComponents(Mat3.createRowMajor(
          1, 2, 3,
          4, 5, 6,
          7, 8, 9,
        ), [
          1, 4, 7,
          2, 5, 8,
          3, 6, 9,
        ])
      })
    })

    describe('#initWith', () => {
      it ('sets all components', () => {
        expectComponents(new Mat3().initWith(1), [
          1, 1, 1,
          1, 1, 1,
          1, 1, 1,
        ])
      })
    })

    describe('#initIdentity', () => {
      it ('sets all components', () => {
        expectComponents(new Mat3().initWith(1).initIdentity(), [
          1, 0, 0,
          0, 1, 0,
          0, 0, 1,
        ])
      })
    })

    describe('.identity', () => {
      it ('sets all components', () => {
        expectComponents(Mat3.identity(), [
          1, 0, 0,
          0, 1, 0,
          0, 0, 1,
        ])
        expect(Mat3.identity()).not.toBe(Mat3.identity())
      })
    })

    describe('#initFrom', () => {
      it ('sets all components', () => {
        expectComponents(new Mat3().initFrom(new Mat3().init(
          1, 2, 3,
          4, 5, 6,
          7, 8, 9,
        )), [
          1, 2, 3,
          4, 5, 6,
          7, 8, 9,
        ])
      })
    })

    describe('#initFromBuffer', () => {
      it ('sets all components', () => {
        expectComponents(new Mat3().initFromArray([
          1, 2, 3,
          4, 5, 6,
          7, 8, 9,
        ]), [
          1, 2, 3,
          4, 5, 6,
          7, 8, 9,
        ])
      })

      it ('reads from offset', () => {
        expectComponents(new Mat3().initFromArray([
          3, 2, 1,
          1, 2, 3,
          4, 5, 6,
          7, 8, 9,
        ], 3), [
          1, 2, 3,
          4, 5, 6,
          7, 8, 9,
        ])
      })
    })

    describe('#initFromQuat', () => {
      it('creates rotation matrix', () => {
        const quat = Quat.createAxisAngle({ x: 0, y: 1, z: 0 }, Math.PI * 0.5)
        const mat = new Mat3().initFromQuat(quat)
        const vec = Vec3.create(1, 1, 0)
        const vec2 = mat.transform(vec)
        expectVec3Components(vec2, [0, 1, -1])
      })
    })

    describe('#initFromQuaternion', () => {
      it('creates rotation matrix', () => {
        const quat = Quat.createAxisAngle({ x: 0, y: 1, z: 0 }, Math.PI * 0.5)
        const mat = new Mat3().initFromQuaternion(quat.x, quat.y, quat.z, quat.w)
        const vec = Vec3.create(1, 1, 0)
        const vec2 = mat.transform(vec)
        expectVec3Components(vec2, [0, 1, -1])
      })
    })

    describe('#initAxisAngleV', () => {
      it('creates rotation matrix', () => {
        const mat = new Mat3().initAxisAngleV({ x: 0, y: 1, z: 0 }, Math.PI * 0.5)
        const vec = Vec3.create(1, 1, 0)
        const vec2 = mat.transform(vec)
        expectVec3Components(vec2, [0, 1, -1])
      })
    })

    describe('#initAxisAngle', () => {
      it('creates rotation matrix', () => {
        const mat = new Mat3().initAxisAngle(0, 1, 0, Math.PI * 0.5)
        const vec = Vec3.create(1, 1, 0)
        const vec2 = mat.transform(vec)
        expectVec3Components(vec2, [0, 1, -1])
      })
    })

    describe('.createAxisAngleV', () => {
      it('creates rotation matrix', () => {
        const mat = Mat3.createAxisAngleV({ x: 0, y: 1, z: 0 }, Math.PI * 0.5)
        const vec = Vec3.create(1, 1, 0)
        const vec2 = mat.transform(vec)
        expectVec3Components(vec2, [0, 1, -1])
      })
    })

    describe('.createAxisAngle', () => {
      it('creates rotation matrix', () => {
        const mat = Mat3.createAxisAngle(0, 1, 0, Math.PI * 0.5)
        const vec = Vec3.create(1, 1, 0)
        const vec2 = mat.transform(vec)
        expectVec3Components(vec2, [0, 1, -1])
      })
    })

    describe('#initOrientation', () => {
      it('creates rotation matrix', () => {
        const mat = new Mat3().initOrientation(Vec3.Forward, Vec3.Up)
        expectVec3Equality(mat.getForward(), Vec3.Forward)
        expectVec3Equality(mat.getUp(), Vec3.Up)
        expectVec3Equality(mat.getBackward(), Vec3.Backward)
      })
    })

    describe('.createOrientation', () => {
      it('creates rotation matrix', () => {
        const mat = Mat3.createOrientation(Vec3.Forward, Vec3.Up)
        expectVec3Equality(mat.getForward(), Vec3.Forward)
        expectVec3Equality(mat.getUp(), Vec3.Up)
        expectVec3Equality(mat.getBackward(), Vec3.Backward)
      })
    })

    describe('#initYawPitchRoll', () => {
      it('creates rotation matrix', () => {
        const mat = new Mat3().initYawPitchRoll(Math.PI * 0.5, Math.PI * 0.5, Math.PI * 0.5)
        const vec = Vec3.create(0, 0, -1)
        const vec2 = mat.transform(vec)
        expectVec3Components(vec2, [0, 1, 0])
      })
    })

    describe('#createYawPitchRoll', () => {
      it('creates rotation matrix', () => {
        const mat = Mat3.createYawPitchRoll(Math.PI * 0.5, Math.PI * 0.5, Math.PI * 0.5)
        const vec = Vec3.create(0, 0, -1)
        const vec2 = mat.transform(vec)
        expectVec3Components(vec2, [0, 1, 0])
      })
    })

    describe('#initRotationX', () => {
      it('creates rotation matrix', () => {
        const mat = new Mat3().initRotationX(Math.PI * 0.5)
        const vec = Vec3.create(0, 1, 0)
        const vec2 = mat.transform(vec)
        expectVec3Components(vec2, [0, 0, 1])
      })
    })

    describe('.createRotationX', () => {
      it('creates rotation matrix', () => {
        const mat = Mat3.createRotationX(Math.PI * 0.5)
        const vec = Vec3.create(0, 1, 0)
        const vec2 = mat.transform(vec)
        expectVec3Components(vec2, [0, 0, 1])
      })
    })

    describe('#initRotationY', () => {
      it('creates rotation matrix', () => {
        const mat = new Mat3().initRotationY(Math.PI * 0.5)
        const vec = Vec3.create(1, 0, 0)
        const vec2 = mat.transform(vec)
        expect(vec2.x).toBeCloseTo(0)
        expect(vec2.y).toBeCloseTo(0)
        expect(vec2.z).toBeCloseTo(-1)
      })
    })

    describe('.createRotationY', () => {
      it('creates rotation matrix', () => {
        const mat = Mat3.createRotationY(Math.PI * 0.5)
        const vec = Vec3.create(1, 0, 0)
        const vec2 = mat.transform(vec)
        expectVec3Components(vec2, [0, 0, -1])
      })
    })

    describe('#initRotationZ', () => {
      it('creates rotation matrix', () => {
        const mat = new Mat3().initRotationZ(Math.PI * 0.5)
        const vec = Vec3.create(1, 0, 0)
        const vec2 = mat.transform(vec)
        expectVec3Components(vec2, [0, 1, 0])
      })
    })

    describe('.createRotationZ', () => {
      it('creates rotation matrix', () => {
        const mat = Mat3.createRotationZ(Math.PI * 0.5)
        const vec = Vec3.create(1, 0, 0)
        const vec2 = mat.transform(vec)
        expectVec3Components(vec2, [0, 1, 0])
      })
    })

    describe('#initScale', () => {
      it('creates scale matrix', () => {
        const mat = new Mat3().initScale(1, 2, 3)
        const vec = Vec3.create(1, 2, 3)
        const vec2 = mat.transform(vec)
        expectVec3Components(vec2, [1, 4, 9])
      })
    })

    describe('.createScale', () => {
      it('creates scale matrix', () => {
        const mat = Mat3.createScale(1, 2, 3)
        const vec = Vec3.create(1, 2, 3)
        const vec2 = mat.transform(vec)
        expectVec3Components(vec2, [1, 4, 9])
      })
    })
  })

  describe('toArray', () => {
    it('creates an array', () => {
      const result = new Mat3().init(
        1, 2, 3,
        4, 5, 6,
        7, 8, 9,
      ).toArray()
      expect(result).toEqual([
        1, 2, 3,
        4, 5, 6,
        7, 8, 9,
      ])
    })
    it('copies with offset', () => {
      const result = new Mat3().init(
        1, 2, 3,
        4, 5, 6,
        7, 8, 9,
      ).toArray([], 4)
      expect(result).toEqual([
        undefined, undefined, undefined, undefined,
        1, 2, 3,
        4, 5, 6,
        7, 8, 9,
      ])
    })
  })

  describe('equals', () => {
    let mat: Mat3
    beforeEach(() => {
      mat = Mat3.create(
        1, 2, 3,
        4, 5, 6,
        7, 8, 9,
      )
    })
    it('compares components', () => {
      expect(mat.equals(mat.clone())).toBe(true)
      for (let i = 0; i < 9; i++) {
        const mat2 = mat.clone()
        mat2.m[i] = 100
        expect(mat.equals(mat2)).toBe(false, `component ${i}`)
      }
    })
  })

  describe('getter/setter', () => {
    let mat: Mat3
    beforeEach(() => {
      mat = Mat3.createRowMajor(
        1, 2, 3,
        4, 5, 6,
        7, 8, 9,
      )
    })

    it ('getRight', () => {
      const vec = mat.getRight()
      expect(Vec3.format(vec)).toBe(Vec3.format(Vec3.create(1, 4, 7)))
    })

    it ('setRight', () => {
      expectComponents(mat.setRight(Vec3.create(21, 22, 23)).transpose(), [
        21, 2, 3,
        22, 5, 6,
        23, 8, 9,
      ])
    })

    it ('getLeft', () => {
      const vec = mat.getLeft()
      expect(Vec3.format(vec)).toBe(Vec3.format(Vec3.create(-1, -4, -7)))
    })

    it ('setLeft', () => {
      expectComponents(mat.setLeft(Vec3.create(21, 22, 23)).transpose(), [
        -21, 2, 3,
        -22, 5, 6,
        -23, 8, 9,
      ])
    })

    it ('getUp', () => {
      expectVec3Components(mat.getUp(), [2, 5, 8])
    })

    it ('setUp', () => {
      expectComponents(mat.setUp(Vec3.create(21, 22, 23)).transpose(), [
        1, 21, 3,
        4, 22, 6,
        7, 23, 9,
      ])
    })

    it ('getDown', () => {
      expectVec3Components(mat.getDown(), [-2, -5, -8])
    })

    it ('setDown', () => {
      expectComponents(mat.setDown(Vec3.create(21, 22, 23)).transpose(), [
        1, -21, 3,
        4, -22, 6,
        7, -23, 9,
      ])
    })

    it ('getBackward', () => {
      expectVec3Components(mat.getBackward(), [3, 6, 9])
    })

    it ('setBackward', () => {
      expectComponents(mat.setBackward(Vec3.create(21, 22, 23)).transpose(), [
        1, 2, 21,
        4, 5, 22,
        7, 8, 23,
      ])
    })

    it ('getForward', () => {
      expectVec3Components(mat.getForward(), [-3, -6, -9])
    })

    it ('setForward', () => {
      expectComponents(mat.setForward(Vec3.create(21, 22, 23)).transpose(), [
        1, 2, -21,
        4, 5, -22,
        7, 8, -23,
      ])
    })

    it ('getScale', () => {
      expectVec3Components(mat.getScale(), [1, 5, 9])
    })

    it ('setScale', () => {
      expectComponents(mat.setScale(21, 22, 23).transpose(), [
        21, 2, 3,
        4, 22, 6,
        7, 8, 23,
      ])
    })

    it ('setScaleV', () => {
      expectComponents(mat.setScaleV(Vec3.create(21, 22, 23)).transpose(), [
        21, 2, 3,
        4, 22, 6,
        7, 8, 23,
      ])
    })

    it ('setScaleX', () => {
      expectComponents(mat.setScaleX(21).transpose(), [
        21, 2, 3,
        4, 5, 6,
        7, 8, 9,
      ])
    })

    it ('setScaleY', () => {
      expectComponents(mat.setScaleY(22).transpose(), [
        1, 2, 3,
        4, 22, 6,
        7, 8, 9,
      ])
    })

    it ('setScaleZ', () => {
      expectComponents(mat.setScaleZ(23).transpose(), [
        1, 2, 3,
        4, 5, 6,
        7, 8, 23,
      ])
    })
  })

  describe('operations', () => {
    let mat: Mat3
    beforeEach(() => {
      mat = Mat3.create(
        1, 2, 3,
        4, 5, 6,
        7, 8, 9,
      )
    })

    describe('#determinant', () => {

      it('calculates the determinant', () => {
        expect(Mat3.createRowMajor(
          -1, 5, -2,
          -5, 0,  1,
          -2, 2,  0,
        ).determinant()).toBeCloseTo(12)
      })
    })

    describe('#invert', () => {
      it ('inverts the matrix', () => {
        const mat1 = Mat3.createRowMajor(
          -1, 5, -2,
          -5, 0,  1,
          -2, 2,  0,
        )
        const mat2 = mat1.clone().invert().invert()
        expectEquality(mat1, mat2, 5)
      })
    })

    describe('.invert', () => {
      it ('inverts the matrix', () => {
        const mat1 = Mat3.createRowMajor(
          -1, 5, -2,
          -5, 0,  1,
          -2, 2,  0,
        )
        const mat2 = Mat3.invert(Mat3.invert(mat1))
        expectEquality(mat1, mat2, 5)
      })
    })

    describe('#transpose', () => {
      it ('transposes components', () => {
        expectComponents(mat.transpose(), [
          1, 4, 7,
          2, 5, 8,
          3, 6, 9,
        ])
      })
    })

    describe('.transpose', () => {
      it ('transposes components', () => {
        expectComponents(Mat3.transpose(mat), [
          1, 4, 7,
          2, 5, 8,
          3, 6, 9,
        ])
      })
    })

    describe('#negate', () => {
      it ('negates components', () => {
        mat.negate().m.forEach((it: number, index: number) => {
          expect(it).toBe(-(index + 1), `component ${index}`)
        })
      })
    })

    describe('.negate', () => {
      it ('negates components', () => {
        Mat3.negate(mat).m.forEach((it: number, index: number) => {
          expect(it).toBe(-(index + 1), `component ${index}`)
        })
      })
    })

    describe('#add', () => {
      it ('adds components', () => {
        const mat1 = mat.clone()
        const mat2 = mat1.clone()
        mat1.add(mat2).m.forEach((it: number, index: number) => {
          expect(it).toBe((index + 1) + (index + 1), `component ${index}`)
        })
      })
    })

    describe('.add', () => {
      it ('adds components', () => {
        const mat1 = mat.clone()
        const mat2 = mat1.clone()
        Mat3.add(mat1, mat2).m.forEach((it: number, index: number) => {
          expect(it).toBe((index + 1) + (index + 1), `component ${index}`)
        })
      })
    })

    describe('#addScalar', () => {
      it ('adds components', () => {
        mat.addScalar(10).m.forEach((it: number, index: number) => {
          expect(it).toBe((index + 1) + 10, `component ${index}`)
        })
      })
    })

    describe('.addScalar', () => {
      it ('adds components', () => {
        Mat3.addScalar(mat, 10).m.forEach((it: number, index: number) => {
          expect(it).toBe((index + 1) + 10, `component ${index}`)
        })
      })
    })

    describe('#subtract', () => {
      it ('subtracts components', () => {
        const mat1 = mat.clone()
        const mat2 = mat1.clone()
        mat1.subtract(mat2).m.forEach((it: number, index: number) => {
          expect(it).toBe((index + 1) - (index + 1), `component ${index}`)
        })
      })
    })

    describe('.subtract', () => {
      it ('subtracts components', () => {
        const mat1 = mat.clone()
        const mat2 = mat1.clone()
        Mat3.subtract(mat1, mat2).m.forEach((it: number, index: number) => {
          expect(it).toBe((index + 1) - (index + 1), `component ${index}`)
        })
      })
    })

    describe('#subtractScalar', () => {
      it ('subtracts components', () => {
        mat.subtractScalar(10).m.forEach((it: number, index: number) => {
          expect(it).toBe((index + 1) - 10, `component ${index}`)
        })
      })
    })

    describe('.subtractScalar', () => {
      it ('subtracts components', () => {
        Mat3.subtractScalar(mat, 10).m.forEach((it: number, index: number) => {
          expect(it).toBe((index + 1) - 10, `component ${index}`)
        })
      })
    })

    describe('#multiplyScalar', () => {
      it ('multiplies components', () => {
        mat.multiplyScalar(10).m.forEach((it: number, index: number) => {
          expect(it).toBeCloseTo((index + 1) * 10, 5, `component ${index}`)
        })
      })
    })

    describe('.multiplyScalar', () => {
      it ('multiplies components', () => {
        Mat3.multiplyScalar(mat, 10).m.forEach((it: number, index: number) => {
          expect(it).toBeCloseTo((index + 1) * 10, 5, `component ${index}`)
        })
      })
    })

    describe('#divide', () => {
      it ('divides components', () => {
        mat.divide(mat).m.forEach((it: number, index: number) => {
          expect(it).toBeCloseTo(1, 5, `component ${index}`)
        })
      })
    })

    describe('.divide', () => {
      it ('divides components', () => {
        Mat3.divide(mat, mat).m.forEach((it: number, index: number) => {
          expect(it).toBeCloseTo(1, 5, `component ${index}`)
        })
      })
    })

    describe('#divideScalar', () => {
      it ('divides components', () => {
        mat.divideScalar(10).m.forEach((it: number, index: number) => {
          expect(it).toBeCloseTo((index + 1) / 10, 5, `component ${index}`)
        })
      })
    })

    describe('.divideScalar', () => {
      it ('divides components', () => {
        Mat3.divideScalar(mat, 10).m.forEach((it: number, index: number) => {
          expect(it).toBeCloseTo((index + 1) / 10, 5, `component ${index}`)
        })
      })
    })

    describe('#multiply', () => {
      it ('A * inv(A) == identity', () => {
        const A = Mat3.createRowMajor(
          -1, 5, -2,
          -5, 0,  1,
          -2, 2,  0,
        )
        expectEquality(A.clone().invert().multiply(A), Mat3.identity(), 5)
      })
      it ('a.multiply(b) is mathematically: A*B', () => {
        const A = Mat3.createRotationX(Math.PI)
        const B = Mat3.createRotationY(Math.PI)
        const C = Mat3.createRotationZ(Math.PI)
        const E = A.clone().multiply(B).multiply(C)
        const vec = E.transform(Vec4.create(1, 1, 1, 1))
        const expect =
          A.transform(
            B.transform(
              C.transform(Vec4.create(1, 1, 1, 1)),
            ),
          )
        expectVec4Equality(vec, expect)
      })
    })

    describe('.multiply', () => {
      it ('A * inv(A) == identity', () => {
        const A = Mat3.createRowMajor(
          -1, 5, -2,
          -5, 0,  1,
          -2, 2,  0,
        )
        expectEquality(Mat3.multiply(Mat3.invert(A), A), Mat3.identity(), 5)
      })
      it ('multiply(a, b) is mathematically: A*B', () => {
        const A = Mat3.createRotationX(Math.PI)
        const B = Mat3.createRotationY(Math.PI)
        const C = Mat3.createRotationZ(Math.PI)
        const E = Mat3.multiply(Mat3.multiply(A, B), C)
        const vec = E.transform(Vec4.create(1, 1, 1, 1))
        const expect =
          A.transform(
            B.transform(
              C.transform(Vec4.create(1, 1, 1, 1)),
            ),
          )
        expectVec4Equality(vec, expect)
      })
    })

    // describe('.multiplyChain', () => {
    //   it ('multiply(a, b, c) is mathematically: C*B*A', () => {
    //     const A = Mat3.createRotationX(Math.PI)
    //     const B = Mat3.createRotationY(Math.PI)
    //     const C = Mat3.createRotationZ(Math.PI)
    //     const E = Mat3.multiplyChain(A, B, C)
    //     const vec = E.transform(Vec4.create(1, 1, 1, 1))
    //     const expect =
    //       C.transform(
    //         B.transform(
    //           A.transform(Vec4.create(1, 1, 1, 1)),
    //         ),
    //       )
    //     expectVec4Equality(vec, expect)
    //   })
    // })

    describe('#premultiply', () => {
      it ('A * inv(A) == identity', () => {
        const A = Mat3.createRowMajor(
          -1, 5, -2,
          -5, 0,  1,
          -2, 2,  0,
        )
        expectEquality(A.clone().invert().premultiply(A), Mat3.identity(), 5)
      })
      it ('a.premultiply(b) is mathematically: B*A', () => {
        const A = Mat3.createRotationX(Math.PI)
        const B = Mat3.createRotationY(Math.PI)
        const C = Mat3.createRotationZ(Math.PI)
        const E = A.clone().premultiply(B).premultiply(C)
        const vec = E.transform(Vec4.create(1, 1, 1, 1))
        const expect =
          C.transform(
            B.transform(
              A.transform(Vec4.create(1, 1, 1, 1)),
            ),
          )
        expectVec4Equality(vec, expect)
      })
    })

    describe('.premultiply', () => {
      it ('A * inv(A) == identity', () => {
        const A = Mat3.createRowMajor(
          -1, 5, -2,
          -5, 0,  1,
          -2, 2,  0,
        )
        expectEquality(Mat3.premultiply(Mat3.invert(A), A), Mat3.identity(), 5)
      })
      it ('premultiply(a, b) is mathematically: BA*', () => {
        const A = Mat3.createRotationX(Math.PI)
        const B = Mat3.createRotationY(Math.PI)
        const C = Mat3.createRotationZ(Math.PI)
        const E = Mat3.premultiply(Mat3.premultiply(A, B), C)
        const vec = E.transform(Vec4.create(1, 1, 1, 1))
        const expect =
          C.transform(
            B.transform(
              A.transform(Vec4.create(1, 1, 1, 1)),
            ),
          )
        expectVec4Equality(vec, expect)
      })
    })

    // describe('.concatChain', () => {
    //   it ('concat(a, b, c) is mathematically: A*B*C', () => {
    //     const A = Mat3.createRotationX(Math.PI)
    //     const B = Mat3.createRotationY(Math.PI)
    //     const C = Mat3.createRotationZ(Math.PI)
    //     const E = Mat3.concatChain(A, B, C)
    //     const vec = E.transform(Vec4.create(1, 1, 1, 1))
    //     const expect =
    //       A.transform(
    //         B.transform(
    //           C.transform(Vec4.create(1, 1, 1, 1)),
    //         ),
    //       )
    //     expectVec4Equality(vec, expect)
    //   })
    // })

    describe('.lerp', () => {
      it ('interpolates components', () => {
        const result = Mat3.lerp(
          Mat3.create(1, 2, 3, 4, 5, 6, 7, 8, 9),
          Mat3.create(3, 4, 5, 6, 7, 8, 9, 10, 11),
          0.5,
        )
        expectComponents(result, [2, 3, 4, 5, 6, 7, 8, 9, 10])
      })
    })

    describe('#format', () => {
      it ('prints the component', () => {
        expect(Mat3.create(1, 2, 3, 4, 5, 6, 7, 8, 9).format()).toBe(
          '1.00000,4.00000,7.00000\n2.00000,5.00000,8.00000\n3.00000,6.00000,9.00000',
        )
      })
    })
  })

  describe('transforms', () => {
    describe('#trasnformV2Buffer', () => {
      it('transforms all vectors in buffer', () => {
        const mat = Mat3.createRotationZ(Math.PI * 0.5)
        const buf = [
          1, 0,
          1, 0,
          1, 0,
        ]
        mat.transformV2Array(buf)
        expectBuffer(buf, [
          0, 1,
          0, 1,
          0, 1,
        ], 5)
      })
    })

    describe('#trasnformV3Buffer', () => {
      it('transforms all vectors in buffer', () => {
        const mat = Mat3.createRotationZ(Math.PI * 0.5)
        const buf = [
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,
        ]
        mat.transformV3Array(buf)
        expectBuffer(buf, [
          0, 1, 0,
          0, 1, 0,
          0, 1, 0,
        ], 5)
      })
    })

    describe('#trasnformV4Buffer', () => {
      it('transforms all vectors in buffer', () => {
        const mat = Mat3.createRotationZ(Math.PI * 0.5)
        const buf = [
          1, 0, 0, 4,
          1, 0, 0, 4,
          1, 0, 0, 4,
        ]
        mat.transformV4Array(buf)
        expectBuffer(buf, [
          0, 1, 0, 4,
          0, 1, 0, 4,
          0, 1, 0, 4,
        ], 5)
      })
    })
  })
})
