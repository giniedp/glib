import { IVec4, Mat4, Quat, Vec3, Vec4 } from '@glib/math'

describe('Mat4', () => {

  function expectComponents(v: Mat4, parts: number[]) {
    expect(v.data[0]).toBeCloseTo(parts[0], 10, 'x of right axis')
    expect(v.data[1]).toBeCloseTo(parts[1], 10, 'y of right axis')
    expect(v.data[2]).toBeCloseTo(parts[2], 10, 'z of right axis')
    expect(v.data[3]).toBeCloseTo(parts[3], 10, 'x of projection')
    expect(v.data[4]).toBeCloseTo(parts[4], 10, 'x of up axis')
    expect(v.data[5]).toBeCloseTo(parts[5], 10, 'y of up axis')
    expect(v.data[6]).toBeCloseTo(parts[6], 10, 'z of up axis')
    expect(v.data[7]).toBeCloseTo(parts[7], 10, 'y of projection')
    expect(v.data[8]).toBeCloseTo(parts[8], 10, 'x of back axis')
    expect(v.data[9]).toBeCloseTo(parts[9], 10, 'y of back axis')
    expect(v.data[10]).toBeCloseTo(parts[10], 10, 'z of back axis')
    expect(v.data[11]).toBeCloseTo(parts[11], 10, 'z of projection')
    expect(v.data[12]).toBeCloseTo(parts[12], 10, 'x of translation')
    expect(v.data[13]).toBeCloseTo(parts[13], 10, 'y of translation')
    expect(v.data[14]).toBeCloseTo(parts[14], 10, 'z of translation')
    expect(v.data[15]).toBeCloseTo(parts[15], 10, 'overall scale')
  }

  function expectEquality(v1: Mat4, v2: Mat4, precision: number = 10) {
    expectVec3Equality(v1.getRight(), v2.getRight(), precision)
    expectVec3Equality(v1.getUp(), v2.getUp(), precision)
    expectVec3Equality(v1.getBackward(), v2.getBackward(), precision)
    expectVec3Equality(v1.getTranslation(), v2.getTranslation(), precision)
    expectVec3Equality(v1.getProjection(), v2.getProjection(), precision)
    expect(v1.data[15]).toBeCloseTo(v2.data[15], precision, 'overall scale')
  }

  function expectVec3Equality(v1: Vec3, v2: Vec3, precision: number = 10) {
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
    expect(v.w).toBeCloseTo(parts[2], 10, 'w component')
  }

  function expectVec4Equality(v1: Vec4, v2: Vec4, precision: number = 10) {
    expect(v1.x).toBeCloseTo(v2.x, precision, 'x component')
    expect(v1.y).toBeCloseTo(v2.y, precision, 'y component')
    expect(v1.z).toBeCloseTo(v2.z, precision, 'z component')
    expect(v1.w).toBeCloseTo(v2.w, precision, 'w component')
  }

  describe('initialization', () => {
    describe('#new', () => {
      it ('sets all components to 0', () => {
        expectComponents(new Mat4(), [
          0, 0, 0, 0,
          0, 0, 0, 0,
          0, 0, 0, 0,
          0, 0, 0, 0,
        ])
      })
    })

    describe('.zero', () => {
      it ('sets all components to 0', () => {
        expectComponents(Mat4.zero(), [
          0, 0, 0, 0,
          0, 0, 0, 0,
          0, 0, 0, 0,
          0, 0, 0, 0,
        ])
        expect(Mat4.zero()).not.toBe(Mat4.zero())
      })
    })

    describe('#init', () => {
      it ('sets all components', () => {
        expectComponents(new Mat4().init(
          1, 2, 3, 4,
          5, 6, 7, 8,
          9, 10, 11, 12,
          13, 14, 15, 16,
        ), [
          1, 2, 3, 4,
          5, 6, 7, 8,
          9, 10, 11, 12,
          13, 14, 15, 16,
        ])
      })
    })

    describe('.create', () => {
      it ('sets all components', () => {
        expectComponents(Mat4.create(
          1, 2, 3, 4,
          5, 6, 7, 8,
          9, 10, 11, 12,
          13, 14, 15, 16,
        ), [
          1, 2, 3, 4,
          5, 6, 7, 8,
          9, 10, 11, 12,
          13, 14, 15, 16,
        ])
      })
    })

    describe('#initRowMajor', () => {
      it ('sets all components', () => {
        expectComponents(new Mat4().initRowMajor(
          1, 2, 3, 4,
          5, 6, 7, 8,
          9, 10, 11, 12,
          13, 14, 15, 16,
        ), [
          1, 5, 9, 13,
          2, 6, 10, 14,
          3, 7, 11, 15,
          4, 8, 12, 16,
        ])
      })
    })

    describe('#createRowMajor', () => {
      it ('sets all components', () => {
        expectComponents(Mat4.createRowMajor(
          1, 2, 3, 4,
          5, 6, 7, 8,
          9, 10, 11, 12,
          13, 14, 15, 16,
        ), [
          1, 5, 9, 13,
          2, 6, 10, 14,
          3, 7, 11, 15,
          4, 8, 12, 16,
        ])
      })
    })

    describe('#initWith', () => {
      it ('sets all components', () => {
        expectComponents(new Mat4().initWith(1), [
          1, 1, 1, 1,
          1, 1, 1, 1,
          1, 1, 1, 1,
          1, 1, 1, 1,
        ])
      })
    })

    describe('#initIdentity', () => {
      it ('sets all components', () => {
        expectComponents(new Mat4().initWith(1).initIdentity(), [
          1, 0, 0, 0,
          0, 1, 0, 0,
          0, 0, 1, 0,
          0, 0, 0, 1,
        ])
      })
    })

    describe('#identity', () => {
      it ('sets all components', () => {
        expectComponents(Mat4.identity(), [
          1, 0, 0, 0,
          0, 1, 0, 0,
          0, 0, 1, 0,
          0, 0, 0, 1,
        ])
        expect(Mat4.identity()).not.toBe(Mat4.identity())
      })
    })

    describe('#initFrom', () => {
      it ('sets all components', () => {
        expectComponents(new Mat4().initFrom(new Mat4().init(
          1, 2, 3, 4,
          5, 6, 7, 8,
          9, 10, 11, 12,
          13, 14, 15, 16,
        )), [
          1, 2, 3, 4,
          5, 6, 7, 8,
          9, 10, 11, 12,
          13, 14, 15, 16,
        ])
      })
    })

    describe('#initFromBuffer', () => {
      it ('sets all components', () => {
        expectComponents(new Mat4().initFromBuffer([
          1, 2, 3, 4,
          5, 6, 7, 8,
          9, 10, 11, 12,
          13, 14, 15, 16,
        ]), [
          1, 2, 3, 4,
          5, 6, 7, 8,
          9, 10, 11, 12,
          13, 14, 15, 16,
        ])
      })

      it ('reads from offset', () => {
        expectComponents(new Mat4().initFromBuffer([
          4, 3, 2, 1,
          1, 2, 3, 4,
          5, 6, 7, 8,
          9, 10, 11, 12,
          13, 14, 15, 16,
        ], 4), [
          1, 2, 3, 4,
          5, 6, 7, 8,
          9, 10, 11, 12,
          13, 14, 15, 16,
        ])
      })
    })

    describe('#initFromQuaternion', () => {
      it('creates rotation matrix', () => {
        const quat = Quat.createAxisAngle({ x: 0, y: 1, z: 0 }, Math.PI * 0.5)
        const mat = new Mat4().initFromQuaternion(quat)
        const vec = Vec3.create(1, 1, 0)
        const vec2 = mat.transform(vec)
        expectVec3Components(vec2, [0, 1, -1])
      })
    })

    describe('#initAxisAngle', () => {
      it('creates rotation matrix', () => {
        const mat = new Mat4().initAxisAngle({ x: 0, y: 1, z: 0 }, Math.PI * 0.5)
        const vec = Vec3.create(1, 1, 0)
        const vec2 = mat.transform(vec)
        expectVec3Components(vec2, [0, 1, -1])
      })
    })

    describe('.createAxisAngle', () => {
      it('creates rotation matrix', () => {
        const mat = Mat4.createAxisAngle({ x: 0, y: 1, z: 0 }, Math.PI * 0.5)
        const vec = Vec3.create(1, 1, 0)
        const vec2 = mat.transform(vec)
        expectVec3Components(vec2, [0, 1, -1])
      })
    })

    describe('#initYawPitchRoll', () => {
      it('creates rotation matrix', () => {
        const mat = new Mat4().initYawPitchRoll(Math.PI * 0.5, Math.PI * 0.5, Math.PI * 0.5)
        const vec = Vec3.create(0, 0, -1)
        const vec2 = mat.transform(vec)
        expectVec3Components(vec2, [0, 1, 0])
      })
    })

    describe('#createYawPitchRoll', () => {
      it('creates rotation matrix', () => {
        const mat = Mat4.createYawPitchRoll(Math.PI * 0.5, Math.PI * 0.5, Math.PI * 0.5)
        const vec = Vec3.create(0, 0, -1)
        const vec2 = mat.transform(vec)
        expectVec3Components(vec2, [0, 1, 0])
      })
    })

    describe('#initRotationX', () => {
      it('creates rotation matrix', () => {
        const mat = new Mat4().initRotationX(Math.PI * 0.5)
        const vec = Vec3.create(0, 1, 0)
        const vec2 = mat.transform(vec)
        expectVec3Components(vec2, [0, 0, 1])
      })
    })

    describe('.createRotationX', () => {
      it('creates rotation matrix', () => {
        const mat = Mat4.createRotationX(Math.PI * 0.5)
        const vec = Vec3.create(0, 1, 0)
        const vec2 = mat.transform(vec)
        expectVec3Components(vec2, [0, 0, 1])
      })
    })

    describe('#initRotationY', () => {
      it('creates rotation matrix', () => {
        const mat = new Mat4().initRotationY(Math.PI * 0.5)
        const vec = Vec3.create(1, 0, 0)
        const vec2 = mat.transform(vec)
        expect(vec2.x).toBeCloseTo(0)
        expect(vec2.y).toBeCloseTo(0)
        expect(vec2.z).toBeCloseTo(-1)
      })
    })

    describe('.createRotationY', () => {
      it('creates rotation matrix', () => {
        const mat = Mat4.createRotationY(Math.PI * 0.5)
        const vec = Vec3.create(1, 0, 0)
        const vec2 = mat.transform(vec)
        expectVec3Components(vec2, [0, 0, -1])
      })
    })

    describe('#initRotationZ', () => {
      it('creates rotation matrix', () => {
        const mat = new Mat4().initRotationZ(Math.PI * 0.5)
        const vec = Vec3.create(1, 0, 0)
        const vec2 = mat.transform(vec)
        expectVec3Components(vec2, [0, 1, 0])
      })
    })

    describe('.createRotationZ', () => {
      it('creates rotation matrix', () => {
        const mat = Mat4.createRotationZ(Math.PI * 0.5)
        const vec = Vec3.create(1, 0, 0)
        const vec2 = mat.transform(vec)
        expectVec3Components(vec2, [0, 1, 0])
      })
    })

    describe('#initTranslation', () => {
      it('creates translation matrix', () => {
        const mat = new Mat4().initTranslation(1, 2, 3)
        const vec = Vec3.create(1, 2, 3)
        const vec2 = mat.transform(vec)
        expectVec3Components(vec2, [2, 4, 6])
      })
    })

    describe('.createTranslation', () => {
      it('creates translation matrix', () => {
        const mat = Mat4.createTranslation(1, 2, 3)
        const vec = Vec3.create(1, 2, 3)
        const vec2 = mat.transform(vec)
        expectVec3Components(vec2, [2, 4, 6])
      })
    })

    describe('#initScale', () => {
      it('creates scale matrix', () => {
        const mat = new Mat4().initScale(1, 2, 3)
        const vec = Vec3.create(1, 2, 3)
        const vec2 = mat.transform(vec)
        expectVec3Components(vec2, [1, 4, 9])
      })
    })

    describe('.createScale', () => {
      it('creates scale matrix', () => {
        const mat = Mat4.createScale(1, 2, 3)
        const vec = Vec3.create(1, 2, 3)
        const vec2 = mat.transform(vec)
        expectVec3Components(vec2, [1, 4, 9])
      })
    })

    describe('#initLookAt', () => {
      it('creates rotation matrix', () => {
        // TOODO:
      })
    })

    describe('#initWorld', () => {
      it('creates affine matrix', () => {
        // TOODO:
      })
    })

    describe('#initPerspectiveFieldOfView', () => {
      it('creates projection matrix', () => {
        // TOODO:
      })
    })

    describe('#initPerspective', () => {
      it('creates projection matrix', () => {
        // TOODO:
      })
    })

    describe('#initPerspectiveOffCenter', () => {
      it('creates projection matrix', () => {
        // TOODO:
      })
    })

    describe('#initOrthographic', () => {
      it('creates projection matrix', () => {
        // TOODO:
      })
    })

    describe('#initOrthographicOffCenter', () => {
      it('creates projection matrix', () => {
        // TOODO:
      })
    })
  })

  describe('copyTo', () => {
    it('copies to array', () => {
      const result = new Mat4().init(
        1, 2, 3, 4,
        5, 6, 7, 8,
        9, 10, 11, 12,
        13, 14, 15, 16,
      ).copy([])
      expect(result).toEqual([
        1, 2, 3, 4,
        5, 6, 7, 8,
        9, 10, 11, 12,
        13, 14, 15, 16,
      ])
    })
    it('copies with offset', () => {
      const result = new Mat4().init(
        1, 2, 3, 4,
        5, 6, 7, 8,
        9, 10, 11, 12,
        13, 14, 15, 16,
      ).copy([], 4)
      expect(result).toEqual([
        undefined, undefined, undefined, undefined,
        1, 2, 3, 4,
        5, 6, 7, 8,
        9, 10, 11, 12,
        13, 14, 15, 16,
      ])
    })
  })

  describe('equals', () => {
    let mat: Mat4
    beforeEach(() => {
      mat = Mat4.create(
        1, 2, 3, 4,
        5, 6, 7, 8,
        9, 10, 11, 12,
        13, 14, 15, 16,
      )
    })
    it('compares components', () => {
      expect(mat.equals(mat.clone())).toBe(true)
      for (let i = 0; i < 16; i++) {
        const mat2 = mat.clone()
        mat2.data[i] = 100
        expect(mat.equals(mat2)).toBe(false, `component ${i}`)
      }
    })
  })

  describe('getter/setter', () => {
    let mat: Mat4
    beforeEach(() => {
      mat = Mat4.createRowMajor(
        1, 2, 3, 4,
        5, 6, 7, 8,
        9, 10, 11, 12,
        13, 14, 15, 16,
      )
    })

    it ('gets right', () => {
      const vec = mat.getRight()
      expect(Vec3.format(vec)).toBe(Vec3.format(Vec3.create(1, 5, 9)))
    })

    it ('sets right', () => {
      expectComponents(mat.setRight(Vec3.create(21, 22, 23)).transpose(), [
        21, 2, 3, 4,
        22, 6, 7, 8,
        23, 10, 11, 12,
        13, 14, 15, 16,
      ])
    })

    it ('gets left', () => {
      const vec = mat.getLeft()
      expect(Vec3.format(vec)).toBe(Vec3.format(Vec3.create(-1, -5, -9)))
    })

    it ('sets left', () => {
      expectComponents(mat.setLeft(Vec3.create(21, 22, 23)).transpose(), [
        -21, 2, 3, 4,
        -22, 6, 7, 8,
        -23, 10, 11, 12,
        13, 14, 15, 16,
      ])
    })

    it ('gets up', () => {
      expectVec3Components(mat.getUp(), [2, 6, 10])
    })

    it ('sets up', () => {
      expectComponents(mat.setUp(Vec3.create(21, 22, 23)).transpose(), [
        1, 21, 3, 4,
        5, 22, 7, 8,
        9, 23, 11, 12,
        13, 14, 15, 16,
      ])
    })

    it ('gets down', () => {
      expectVec3Components(mat.getDown(), [-2, -6, -10])
    })

    it ('sets down', () => {
      expectComponents(mat.setDown(Vec3.create(21, 22, 23)).transpose(), [
        1, -21, 3, 4,
        5, -22, 7, 8,
        9, -23, 11, 12,
        13, 14, 15, 16,
      ])
    })

    it ('gets backward', () => {
      expectVec3Components(mat.getBackward(), [3, 7, 11])
    })

    it ('sets backward', () => {
      expectComponents(mat.setBackward(Vec3.create(21, 22, 23)).transpose(), [
        1, 2, 21, 4,
        5, 6, 22, 8,
        9, 10, 23, 12,
        13, 14, 15, 16,
      ])
    })

    it ('gets forward', () => {
      expectVec3Components(mat.getForward(), [-3, -7, -11])
    })

    it ('sets forward', () => {
      expectComponents(mat.setForward(Vec3.create(21, 22, 23)).transpose(), [
        1, 2, -21, 4,
        5, 6, -22, 8,
        9, 10, -23, 12,
        13, 14, 15, 16,
      ])
    })

    it ('gets translation', () => {
      expectVec3Components(mat.getTranslation(), [4, 8, 12])
    })

    it ('sets translation', () => {
      expectComponents(mat.setTranslation(Vec3.create(21, 22, 23)).transpose(), [
        1, 2, 3, 21,
        5, 6, 7, 22,
        9, 10, 11, 23,
        13, 14, 15, 16,
      ])
    })

    it ('sets translation', () => {
      expectComponents(mat.setTranslationXYZ(21, 22, 23).transpose(), [
        1, 2, 3, 21,
        5, 6, 7, 22,
        9, 10, 11, 23,
        13, 14, 15, 16,
      ])
    })

    it ('sets translation', () => {
      expectComponents(mat.setTranslationX(21).transpose(), [
        1, 2, 3, 21,
        5, 6, 7, 8,
        9, 10, 11, 12,
        13, 14, 15, 16,
      ])
    })

    it ('sets translation', () => {
      expectComponents(mat.setTranslationY(22).transpose(), [
        1, 2, 3, 4,
        5, 6, 7, 22,
        9, 10, 11, 12,
        13, 14, 15, 16,
      ])
    })

    it ('sets translation', () => {
      expectComponents(mat.setTranslationZ(23).transpose(), [
        1, 2, 3, 4,
        5, 6, 7, 8,
        9, 10, 11, 23,
        13, 14, 15, 16,
      ])
    })

    it ('gets scale', () => {
      expectVec3Components(mat.getScale(), [1, 6, 11])
    })

    it ('sets scale', () => {
      expectComponents(mat.setScale(Vec3.create(21, 22, 23)).transpose(), [
        21, 2, 3, 4,
        5, 22, 7, 8,
        9, 10, 23, 12,
        13, 14, 15, 16,
      ])
    })

    it ('sets scale', () => {
      expectComponents(mat.setScaleXYZ(21, 22, 23).transpose(), [
        21, 2, 3, 4,
        5, 22, 7, 8,
        9, 10, 23, 12,
        13, 14, 15, 16,
      ])
    })

    it ('sets scale', () => {
      expectComponents(mat.setScaleX(21).transpose(), [
        21, 2, 3, 4,
        5, 6, 7, 8,
        9, 10, 11, 12,
        13, 14, 15, 16,
      ])
    })

    it ('sets scale', () => {
      expectComponents(mat.setScaleY(22).transpose(), [
        1, 2, 3, 4,
        5, 22, 7, 8,
        9, 10, 11, 12,
        13, 14, 15, 16,
      ])
    })

    it ('sets scale', () => {
      expectComponents(mat.setScaleZ(23).transpose(), [
        1, 2, 3, 4,
        5, 6, 7, 8,
        9, 10, 23, 12,
        13, 14, 15, 16,
      ])
    })

    it ('gets projection', () => {
      expectVec3Components(mat.getProjection(), [13, 14, 15])
    })

    it ('sets projection', () => {
      expectComponents(mat.setProjection(Vec3.create(21, 22, 23)).transpose(), [
        1, 2, 3, 4,
        5, 6, 7, 8,
        9, 10, 11, 12,
        21, 22, 23, 16,
      ])
    })

    it ('sets projection', () => {
      expectComponents(mat.setProjectionXYZ(21, 22, 23).transpose(), [
        1, 2, 3, 4,
        5, 6, 7, 8,
        9, 10, 11, 12,
        21, 22, 23, 16,
      ])
    })

    it ('sets projection', () => {
      expectComponents(mat.setProjectionX(21).transpose(), [
        1, 2, 3, 4,
        5, 6, 7, 8,
        9, 10, 11, 12,
        21, 14, 15, 16,
      ])
    })

    it ('sets projection', () => {
      expectComponents(mat.setProjectionY(22).transpose(), [
        1, 2, 3, 4,
        5, 6, 7, 8,
        9, 10, 11, 12,
        13, 22, 15, 16,
      ])
    })

    it ('sets projection', () => {
      expectComponents(mat.setProjectionZ(23).transpose(), [
        1, 2, 3, 4,
        5, 6, 7, 8,
        9, 10, 11, 12,
        13, 14, 23, 16,
      ])
    })
  })

  describe('operations', () => {
    let mat: Mat4
    beforeEach(() => {
      mat = Mat4.create(
        1, 2, 3, 4,
        5, 6, 7, 8,
        9, 10, 11, 12,
        13, 14, 15, 16,
      )
    })

    describe('#determinant', () => {

      it('calculates the determinant', () => {
        expect(Mat4.createRowMajor(
          1, 2, 3, 4,
          0, 9, 8, 7,
          2, 3, 1, 4,
          8, 7, 6, 5,
        ).determinant()).toBeCloseTo(450)
      })
    })

    describe('#invert', () => {
      it ('inverts the matrix', () => {
        const mat1 = Mat4.createRowMajor(
          4,  7, -2, -1,
          4, -4, -1,  3,
          2,  0,  5,  4,
          7,  3,  1, -2,
        )
        const mat2 = mat1.clone().invert().invert()
        expectEquality(mat1, mat2, 5)
      })
    })

    describe('.invert', () => {
      it ('inverts the matrix', () => {
        const mat1 = Mat4.createRowMajor(
          4,  7, -2, -1,
          4, -4, -1,  3,
          2,  0,  5,  4,
          7,  3,  1, -2,
        )
        const mat2 = Mat4.invert(Mat4.invert(mat1))
        expectEquality(mat1, mat2, 5)
      })
    })

    describe('#negate', () => {
      it ('negates components', () => {
        mat.negate().data.forEach((it, index) => {
          expect(it).toBe(-(index + 1), `component ${index}`)
        })
      })
    })

    describe('.negate', () => {
      it ('negates components', () => {
        Mat4.negate(mat).data.forEach((it, index) => {
          expect(it).toBe(-(index + 1), `component ${index}`)
        })
      })
    })

    describe('#add', () => {
      it ('adds components', () => {
        const mat1 = mat.clone()
        const mat2 = mat1.clone()
        mat1.add(mat2).data.forEach((it, index) => {
          expect(it).toBe((index + 1) + (index + 1), `component ${index}`)
        })
      })
    })

    describe('.add', () => {
      it ('adds components', () => {
        const mat1 = mat.clone()
        const mat2 = mat1.clone()
        Mat4.add(mat1, mat2).data.forEach((it, index) => {
          expect(it).toBe((index + 1) + (index + 1), `component ${index}`)
        })
      })
    })

    describe('#addScalar', () => {
      it ('adds components', () => {
        mat.addScalar(10).data.forEach((it, index) => {
          expect(it).toBe((index + 1) + 10, `component ${index}`)
        })
      })
    })

    describe('.addScalar', () => {
      it ('adds components', () => {
        Mat4.addScalar(mat, 10).data.forEach((it, index) => {
          expect(it).toBe((index + 1) + 10, `component ${index}`)
        })
      })
    })

    describe('#subtract', () => {
      it ('subtracts components', () => {
        const mat1 = mat.clone()
        const mat2 = mat1.clone()
        mat1.subtract(mat2).data.forEach((it, index) => {
          expect(it).toBe((index + 1) - (index + 1), `component ${index}`)
        })
      })
    })

    describe('.subtract', () => {
      it ('subtracts components', () => {
        const mat1 = mat.clone()
        const mat2 = mat1.clone()
        Mat4.subtract(mat1, mat2).data.forEach((it, index) => {
          expect(it).toBe((index + 1) - (index + 1), `component ${index}`)
        })
      })
    })

    describe('#subtractScalar', () => {
      it ('subtracts components', () => {
        mat.subtractScalar(10).data.forEach((it, index) => {
          expect(it).toBe((index + 1) - 10, `component ${index}`)
        })
      })
    })

    describe('.subtractScalar', () => {
      it ('subtracts components', () => {
        Mat4.subtractScalar(mat, 10).data.forEach((it, index) => {
          expect(it).toBe((index + 1) - 10, `component ${index}`)
        })
      })
    })

    describe('#multiplyScalar', () => {
      it ('multiplies components', () => {
        mat.multiplyScalar(10).data.forEach((it, index) => {
          expect(it).toBeCloseTo((index + 1) * 10, 5, `component ${index}`)
        })
      })
    })

    describe('.multiplyScalar', () => {
      it ('multiplies components', () => {
        Mat4.multiplyScalar(mat, 10).data.forEach((it, index) => {
          expect(it).toBeCloseTo((index + 1) * 10, 5, `component ${index}`)
        })
      })
    })

    describe('#divide', () => {
      it ('divides components', () => {
        mat.divide(mat).data.forEach((it, index) => {
          expect(it).toBeCloseTo(1, 5, `component ${index}`)
        })
      })
    })

    describe('.divide', () => {
      it ('divides components', () => {
        Mat4.divide(mat, mat).data.forEach((it, index) => {
          expect(it).toBeCloseTo(1, 5, `component ${index}`)
        })
      })
    })

    describe('#divideScalar', () => {
      it ('divides components', () => {
        mat.divideScalar(10).data.forEach((it, index) => {
          expect(it).toBeCloseTo((index + 1) / 10, 5, `component ${index}`)
        })
      })
    })

    describe('.divideScalar', () => {
      it ('divides components', () => {
        Mat4.divideScalar(mat, 10).data.forEach((it, index) => {
          expect(it).toBeCloseTo((index + 1) / 10, 5, `component ${index}`)
        })
      })
    })

    describe('#multiply', () => {
      it ('A * inv(A) == identity', () => {
        const A = Mat4.createRowMajor(
           4,    1,    2,   -4,
           4,    1,    2,   -3,
          -8,   -4,   -5,    3,
          -4,   -2,   -5,   -4,
        )
        expectEquality(A.clone().invert().multiply(A), Mat4.identity(), 5)
      })
      it ('a.multiply(b) is mathematecally: B*A', () => {
        const A = Mat4.createRotationX(Math.PI)
        const B = Mat4.createRotationY(Math.PI)
        const C = Mat4.createRotationZ(Math.PI)
        const D = Mat4.createTranslation(1, 2, 3)
        const E = A.clone().multiply(B).multiply(C).multiply(D)
        const vec = E.transform(Vec4.create(1, 1, 1, 1))
        const expect =
          D.transform(
            C.transform(
              B.transform(
                A.transform(Vec4.create(1, 1, 1, 1)),
              ),
            ),
          )
        expectVec4Equality(vec, expect)
      })
    })

    describe('.multiply', () => {
      it ('A * inv(A) == identity', () => {
        const A = Mat4.createRowMajor(
           4,    1,    2,   -4,
           4,    1,    2,   -3,
          -8,   -4,   -5,    3,
          -4,   -2,   -5,   -4,
        )
        expectEquality(Mat4.multiply(Mat4.invert(A), A), Mat4.identity(), 5)
      })
      it ('multiply(a, b) is mathematecally: B*A', () => {
        const A = Mat4.createRotationX(Math.PI)
        const B = Mat4.createRotationY(Math.PI)
        const C = Mat4.createRotationZ(Math.PI)
        const D = Mat4.createTranslation(1, 2, 3)
        const E = Mat4.multiply(Mat4.multiply(Mat4.multiply(A, B), C), D)
        const vec = E.transform(Vec4.create(1, 1, 1, 1))
        const expect =
          D.transform(
            C.transform(
              B.transform(
                A.transform(Vec4.create(1, 1, 1, 1)),
              ),
            ),
          )
        expectVec4Equality(vec, expect)
      })
    })

    describe('.multiplyChain', () => {
      it ('multiply(a, b, c) is mathematecally: C*B*A', () => {
        const A = Mat4.createRotationX(Math.PI)
        const B = Mat4.createRotationY(Math.PI)
        const C = Mat4.createRotationZ(Math.PI)
        const D = Mat4.createTranslation(1, 2, 3)
        const E = Mat4.multiplyChain(A, B, C, D)
        const vec = E.transform(Vec4.create(1, 1, 1, 1))
        const expect =
          D.transform(
            C.transform(
              B.transform(
                A.transform(Vec4.create(1, 1, 1, 1)),
              ),
            ),
          )
        expectVec4Equality(vec, expect)
      })
    })

    describe('#concat', () => {
      it ('A * inv(A) == identity', () => {
        const A = Mat4.createRowMajor(
           4,    1,    2,   -4,
           4,    1,    2,   -3,
          -8,   -4,   -5,    3,
          -4,   -2,   -5,   -4,
        )
        expectEquality(A.clone().invert().concat(A), Mat4.identity(), 5)
      })
      it ('a.concat(b) is mathematecally: A*B', () => {
        const A = Mat4.createRotationX(Math.PI)
        const B = Mat4.createRotationY(Math.PI)
        const C = Mat4.createRotationZ(Math.PI)
        const D = Mat4.createTranslation(1, 2, 3)
        const E = A.clone().concat(B).concat(C).concat(D)
        const vec = E.transform(Vec4.create(1, 1, 1, 1))
        const expect =
          A.transform(
            B.transform(
              C.transform(
                D.transform(Vec4.create(1, 1, 1, 1)),
              ),
            ),
          )
        expectVec4Equality(vec, expect)
      })
    })

    describe('.concat', () => {
      it ('A * inv(A) == identity', () => {
        const A = Mat4.createRowMajor(
           4,    1,    2,   -4,
           4,    1,    2,   -3,
          -8,   -4,   -5,    3,
          -4,   -2,   -5,   -4,
        )
        expectEquality(Mat4.concat(Mat4.invert(A), A), Mat4.identity(), 5)
      })
      it ('concat(a, b) is mathematecally: A*B', () => {
        const A = Mat4.createRotationX(Math.PI)
        const B = Mat4.createRotationY(Math.PI)
        const C = Mat4.createRotationZ(Math.PI)
        const D = Mat4.createTranslation(1, 2, 3)
        const E = Mat4.concat(Mat4.concat(Mat4.concat(A, B), C), D)
        const vec = E.transform(Vec4.create(1, 1, 1, 1))
        const expect =
          A.transform(
            B.transform(
              C.transform(
                D.transform(Vec4.create(1, 1, 1, 1)),
              ),
            ),
          )
        expectVec4Equality(vec, expect)
      })
    })

    describe('.concatChain', () => {
      it ('concat(a, b, c) is mathematecally: A*B*C', () => {
        const A = Mat4.createRotationX(Math.PI)
        const B = Mat4.createRotationY(Math.PI)
        const C = Mat4.createRotationZ(Math.PI)
        const D = Mat4.createTranslation(1, 2, 3)
        const E = Mat4.concatChain(A, B, C, D)
        const vec = E.transform(Vec4.create(1, 1, 1, 1))
        const expect =
          A.transform(
            B.transform(
              C.transform(
                D.transform(Vec4.create(1, 1, 1, 1)),
              ),
            ),
          )
        expectVec4Equality(vec, expect)
      })
    })
  })
})
