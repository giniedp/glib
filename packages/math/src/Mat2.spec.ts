import { IVec4, Mat2, Quat, Vec2, Vec3, Vec4 } from '@gglib/math'

describe('Mat2', () => {

  function expectComponents(v: Mat2, parts: number[], precision: number = 10) {
    expect(v.m[0]).toBeCloseTo(parts[0], precision, `component ${0}`)
    expect(v.m[1]).toBeCloseTo(parts[1], precision, `component ${1}`)
    expect(v.m[2]).toBeCloseTo(parts[2], precision, `component ${2}`)
    expect(v.m[3]).toBeCloseTo(parts[3], precision, `component ${3}`)
  }

  function expectEquality(v1: Mat2, v2: Mat2, precision: number = 10) {
    expectComponents(v1, Array.from(v2.m), precision)
  }

  function expectVec2Equality(v1: Vec2, v2: Vec2, precision: number = 10) {
    expect(v1.x).toBeCloseTo(v2.x, precision, 'x component')
    expect(v1.y).toBeCloseTo(v2.y, precision, 'y component')
  }

  function expectVec2Components(v: Vec2, parts: number[]) {
    expect(v.x).toBeCloseTo(parts[0], 10, 'x component')
    expect(v.y).toBeCloseTo(parts[1], 10, 'y component')
  }

  function expectVec3Equality(v1: Vec3, v2: Vec3, precision: number = 10) {
    expect(v1.x).toBeCloseTo(v2.x, precision, 'x component')
    expect(v1.y).toBeCloseTo(v2.y, precision, 'y component')
    expect(v1.z).toBeCloseTo(v2.z, precision, 'z component')
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
        expectComponents(new Mat2(), [
          0, 0,
          0, 0,
        ])
      })
    })

    describe('#initZero', () => {
      it ('sets all components to 0', () => {
        expectComponents(new Mat2().init(
          1, 2,
          3, 4,
        ).initZero(), [
          0, 0,
          0, 0,
        ])
        expect(Mat2.createZero()).not.toBe(Mat2.createZero())
      })
    })

    describe('.zero', () => {
      it ('sets all components to 0', () => {
        expectComponents(Mat2.createZero(), [
          0, 0,
          0, 0,
        ])
        expect(Mat2.createZero()).not.toBe(Mat2.createZero())
      })
    })

    describe('#init', () => {
      it ('sets all components', () => {
        expectComponents(new Mat2().init(
          1, 2,
          3, 4,
        ), [
          1, 2,
          3, 4,
        ])
      })
    })

    describe('.create', () => {
      it ('sets all components', () => {
        expectComponents(Mat2.create(
          1, 2,
          3, 4,
        ), [
          1, 2,
          3, 4,
        ])
      })
    })

    describe('#initRowMajor', () => {
      it ('sets all components', () => {
        expectComponents(new Mat2().initRowMajor(
          1, 2,
          3, 4,
        ), [
          1, 3,
          2, 4,
        ])
      })
    })

    describe('.createRowMajor', () => {
      it ('sets all components', () => {
        expectComponents(Mat2.createRowMajor(
          1, 2,
          3, 4,
        ), [
          1, 3,
          2, 4,
        ])
      })
    })

    describe('#initWith', () => {
      it ('sets all components', () => {
        expectComponents(new Mat2().initWith(1), [
          1, 1,
          1, 1,
        ])
      })
    })

    describe('#initIdentity', () => {
      it ('sets all components', () => {
        expectComponents(new Mat2().initWith(1).initIdentity(), [
          1, 0,
          0, 1,
        ])
      })
    })

    describe('.identity', () => {
      it ('sets all components', () => {
        expectComponents(Mat2.createIdentity(), [
          1, 0,
          0, 1,
        ])
        expect(Mat2.createIdentity()).not.toBe(Mat2.createIdentity())
      })
    })

    describe('#initFrom', () => {
      it ('sets all components', () => {
        expectComponents(new Mat2().initFrom(new Mat2().init(
          1, 2,
          3, 4,
        )), [
          1, 2,
          3, 4,
        ])
      })
    })

    describe('#initFromBuffer', () => {
      it ('sets all components', () => {
        expectComponents(new Mat2().initFromArray([
          1, 2,
          3, 4,
        ]), [
          1, 2,
          3, 4,
        ])
      })

      it ('reads from offset', () => {
        expectComponents(new Mat2().initFromArray([
          2, 1,
          1, 2,
          3, 4,
        ], 2), [
          1, 2,
          3, 4,
        ])
      })
    })

    describe('#initFromQuat', () => {
      it('creates rotation matrix', () => {
        const quat = Quat.createAxisAngle({ x: 0, y: 1, z: 0 }, Math.PI * 0.5)
        const mat = new Mat2().initFromQuat(quat)
        const vec = Vec2.create(1, 1)
        const vec2 = mat.transform(vec)
        expectVec2Components(vec2, [0, 1])
      })
    })

    describe('#initAxisAngle', () => {
      it('creates rotation matrix', () => {
        const mat = new Mat2().initAxisAngle(0, 1, 0, Math.PI * 0.5)
        const vec = Vec2.create(1, 1)
        const vec2 = mat.transform(vec)
        expectVec2Components(vec2, [0, 1])
      })
    })

    describe('#initAxisAngleV', () => {
      it('creates rotation matrix', () => {
        const mat = new Mat2().initAxisAngleV({ x: 0, y: 1, z: 0 }, Math.PI * 0.5)
        const vec = Vec2.create(1, 1)
        const vec2 = mat.transform(vec)
        expectVec2Components(vec2, [0, 1])
      })
    })

    describe('.createAxisAngle', () => {
      it('creates rotation matrix', () => {
        const mat = Mat2.createAxisAngle(0, 1, 0, Math.PI * 0.5)
        const vec = Vec2.create(1, 1)
        const vec2 = mat.transform(vec)
        expectVec2Components(vec2, [0, 1, -1])
      })
    })

    describe('.createAxisAngleV', () => {
      it('creates rotation matrix', () => {
        const mat = Mat2.createAxisAngleV({ x: 0, y: 1, z: 0 }, Math.PI * 0.5)
        const vec = Vec2.create(1, 1)
        const vec2 = mat.transform(vec)
        expectVec2Components(vec2, [0, 1, -1])
      })
    })

    describe('#initRotationX', () => {
      it('creates rotation matrix', () => {
        const mat = new Mat2().initRotationX(Math.PI * 0.5)
        const vec = Vec2.create(0, 1)
        const vec2 = mat.transform(vec)
        expectVec2Components(vec2, [0, 0])
      })
    })

    describe('.createRotationX', () => {
      it('creates rotation matrix', () => {
        const mat = Mat2.createRotationX(Math.PI * 0.5)
        const vec = Vec2.create(0, 1)
        const vec2 = mat.transform(vec)
        expectVec2Components(vec2, [0, 0])
      })
    })

    describe('#initRotationY', () => {
      it('creates rotation matrix', () => {
        const mat = new Mat2().initRotationY(Math.PI * 0.5)
        const vec = Vec2.create(1, 0)
        const vec2 = mat.transform(vec)
        expect(vec2.x).toBeCloseTo(0)
        expect(vec2.y).toBeCloseTo(0)
      })
    })

    describe('.createRotationY', () => {
      it('creates rotation matrix', () => {
        const mat = Mat2.createRotationY(Math.PI * 0.5)
        const vec = Vec2.create(1, 0)
        const vec2 = mat.transform(vec)
        expectVec2Components(vec2, [0, 0])
      })
    })

    describe('#initRotationZ', () => {
      it('creates rotation matrix', () => {
        const mat = new Mat2().initRotationZ(Math.PI * 0.5)
        const vec = Vec2.create(1, 0)
        const vec2 = mat.transform(vec)
        expectVec2Components(vec2, [0, 1])
      })
    })

    describe('.createRotationZ', () => {
      it('creates rotation matrix', () => {
        const mat = Mat2.createRotationZ(Math.PI * 0.5)
        const vec = Vec2.create(1, 0)
        const vec2 = mat.transform(vec)
        expectVec2Components(vec2, [0, 1])
      })
    })

    describe('#initScale', () => {
      it('creates scale matrix', () => {
        const mat = new Mat2().initScale(1, 2)
        const vec = Vec2.create(1, 2)
        const vec2 = mat.transform(vec)
        expectVec2Components(vec2, [1, 4])
      })
    })

    describe('.createScale', () => {
      it('creates scale matrix', () => {
        const mat = Mat2.createScale(1, 2)
        const vec = Vec2.create(1, 2)
        const vec2 = mat.transform(vec)
        expectVec2Components(vec2, [1, 4])
      })
    })
  })

  describe('toArray', () => {
    it('creates an array', () => {
      const result = new Mat2().init(
        1, 2,
        3, 4,
      ).toArray()
      expect(result).toEqual([
        1, 2,
        3, 4,
      ])
    })
    it('copies with offset', () => {
      const result = new Mat2().init(
        1, 2,
        3, 4,
      ).toArray([], 2)
      expect(result).toEqual([
        undefined, undefined,
        1, 2,
        3, 4,
      ])
    })
  })

  describe('equals', () => {
    let mat: Mat2
    beforeEach(() => {
      mat = Mat2.create(
        1, 2,
        3, 4,
      )
    })
    it('compares components', () => {
      expect(mat.equals(mat.clone())).toBe(true)
      for (let i = 0; i < 4; i++) {
        const mat2 = mat.clone()
        mat2.m[i] = 100
        expect(mat.equals(mat2)).toBe(false, `component ${i}`)
      }
    })
  })

  describe('getter/setter', () => {
    let mat: Mat2
    beforeEach(() => {
      mat = Mat2.createRowMajor(
        1, 2,
        3, 4,
      )
    })

    it ('getScale', () => {
      expectVec2Components(mat.getScale(), [1, 4])
    })

    it ('setScaleV', () => {
      expectComponents(mat.setScaleV(Vec2.create(21, 22)).transpose(), [
        21, 2,
        3, 22,
      ])
    })

    it ('setScale', () => {
      expectComponents(mat.setScale(21, 22).transpose(), [
        21, 2,
        3, 22,
      ])
    })

    it ('setScaleX', () => {
      expectComponents(mat.setScaleX(21).transpose(), [
        21, 2,
        3,  4,
      ])
    })

    it ('setScaleY', () => {
      expectComponents(mat.setScaleY(22).transpose(), [
        1, 2,
        3, 22,
      ])
    })
  })

  describe('operations', () => {
    let mat: Mat2
    beforeEach(() => {
      mat = Mat2.create(
        1, 2,
        3, 4,
      )
    })

    describe('#determinant', () => {
      it('calculates the determinant', () => {
        expect(Mat2.createRowMajor(
           8, -10,
          -2,   0,
        ).determinant()).toBeCloseTo(-20)
      })
    })

    describe('.determinant', () => {
      it('calculates the determinant', () => {
        expect(Mat2.determinant(Mat2.createRowMajor(
           8, -10,
          -2,   0,
        ))).toBeCloseTo(-20)
      })
    })

    describe('#invert', () => {
      it ('inverts the matrix', () => {
        const mat1 = Mat2.createRowMajor(
           8, -10,
          -2,   0,
        )
        expectEquality(mat1, mat1.clone().invert().invert(), 5)
        expectComponents(mat1.clone().invert().transpose(), [
           0  ,  -0.5,
          -0.1,  -0.4,
        ], 5)
      })
    })

    describe('.invert', () => {
      it ('inverts the matrix', () => {
        const mat1 = Mat2.createRowMajor(
           8, -10,
          -2,   0,
        )
        expectEquality(mat1, Mat2.invert(Mat2.invert(mat1)), 5)
        expectComponents(Mat2.invert(mat1).transpose(), [
           0  ,  -0.5,
          -0.1,  -0.4,
        ], 5)
      })
    })

    describe('#transpose', () => {
      it ('transposes components', () => {
        expectComponents(mat.transpose(), [
          1, 3,
          2, 4,
        ])
      })
    })

    describe('.transpose', () => {
      it ('transposes components', () => {
        expectComponents(Mat2.transpose(mat), [
          1, 3,
          2, 4,
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
        Mat2.negate(mat).m.forEach((it: number, index: number) => {
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
        Mat2.add(mat1, mat2).m.forEach((it: number, index: number) => {
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
        Mat2.addScalar(mat, 10).m.forEach((it: number, index: number) => {
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
        Mat2.subtract(mat1, mat2).m.forEach((it: number, index: number) => {
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
        Mat2.subtractScalar(mat, 10).m.forEach((it: number, index: number) => {
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
        Mat2.multiplyScalar(mat, 10).m.forEach((it: number, index: number) => {
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
        Mat2.divide(mat, mat).m.forEach((it: number, index: number) => {
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
        Mat2.divideScalar(mat, 10).m.forEach((it: number, index: number) => {
          expect(it).toBeCloseTo((index + 1) / 10, 5, `component ${index}`)
        })
      })
    })

    describe('#multiply', () => {
      it ('A * inv(A) == identity', () => {
        const A = Mat2.createRowMajor(
           8, -10,
          -2,   0,
        )
        expectEquality(A.clone().invert().multiply(A), Mat2.createIdentity(), 5)
      })
      it ('a.multiply(b) is mathematically: A*B', () => {
        const A = Mat2.createRotationX(Math.PI)
        const B = Mat2.createRotationY(Math.PI)
        const C = Mat2.createRotationZ(Math.PI)
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
        const A = Mat2.createRowMajor(
           8, -10,
          -2,   0,
        )
        expectEquality(Mat2.multiply(Mat2.invert(A), A), Mat2.createIdentity(), 5)
      })
      it ('multiply(a, b) is mathematically: A*B', () => {
        const A = Mat2.createRotationX(Math.PI)
        const B = Mat2.createRotationY(Math.PI)
        const C = Mat2.createRotationZ(Math.PI)
        const E = Mat2.multiply(Mat2.multiply(A, B), C)
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
    //     const A = Mat2.createRotationX(Math.PI)
    //     const B = Mat2.createRotationY(Math.PI)
    //     const C = Mat2.createRotationZ(Math.PI)
    //     const E = Mat2.multiplyChain(A, B, C)
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
        const A = Mat2.createRowMajor(
           8, -10,
          -2,   0,
        )
        expectEquality(A.clone().invert().premultiply(A), Mat2.createIdentity(), 5)
      })
      it ('a.premultiply(b) is mathematically: B*A', () => {
        const A = Mat2.createRotationX(Math.PI)
        const B = Mat2.createRotationY(Math.PI)
        const C = Mat2.createRotationZ(Math.PI)
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
        const A = Mat2.createRowMajor(
           8, -10,
          -2,   0,
        )
        expectEquality(Mat2.premultiply(Mat2.invert(A), A), Mat2.createIdentity(), 5)
      })
      it ('premultiply(a, b) is mathematically: B*A', () => {
        const A = Mat2.createRotationX(Math.PI)
        const B = Mat2.createRotationY(Math.PI)
        const C = Mat2.createRotationZ(Math.PI)
        const E = Mat2.premultiply(Mat2.premultiply(A, B), C)
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
    //     const A = Mat2.createRotationX(Math.PI)
    //     const B = Mat2.createRotationY(Math.PI)
    //     const C = Mat2.createRotationZ(Math.PI)
    //     const E = Mat2.concatChain(A, B, C)
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
        const result = Mat2.lerp(
          Mat2.create(1, 2, 3, 4),
          Mat2.create(3, 4, 5, 6),
          0.5,
        )
        expectComponents(result, [2, 3, 4, 5])
      })
    })

    describe('#format', () => {
      it ('prints the component', () => {
        expect(Mat2.create(1, 2, 3, 4).format()).toBe('1.00000,3.00000\n2.00000,4.00000')
      })
    })
  })

  describe('transforms', () => {
    describe('#transformV2Buffer', () => {
      it('transforms all vectors in buffer', () => {
        const mat = Mat2.createRotationZ(Math.PI * 0.5)
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

    describe('#transformV3Buffer', () => {
      it('transforms all vectors in buffer', () => {
        const mat = Mat2.createRotationZ(Math.PI * 0.5)
        const buf = [
          1, 0, 3,
          1, 0, 3,
          1, 0, 3,
        ]
        mat.transformV3Array(buf)
        expectBuffer(buf, [
          0, 1, 3,
          0, 1, 3,
          0, 1, 3,
        ], 5)
      })
    })

    describe('#transformV4Buffer', () => {
      it('transforms all vectors in buffer', () => {
        const mat = Mat2.createRotationZ(Math.PI * 0.5)
        const buf = [
          1, 0, 3, 4,
          1, 0, 3, 4,
          1, 0, 3, 4,
        ]
        mat.transformV4Array(buf)
        expectBuffer(buf, [
          0, 1, 3, 4,
          0, 1, 3, 4,
          0, 1, 3, 4,
        ], 5)
      })
    })
  })
})
