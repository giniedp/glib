import { IVec2, IVec3, IVec4, Mat4, Quat, Vec2, Vec3, Vec4 } from './index'
import { describe, it, expect, beforeEach } from 'vitest'

describe('Mat4', () => {

  function expectComponents(v: Mat4, parts: number[]) {
    expect(v.m[0], 'x of right axis').toBeCloseTo(parts[0], 10)
    expect(v.m[1], 'y of right axis').toBeCloseTo(parts[1], 10)
    expect(v.m[2], 'z of right axis').toBeCloseTo(parts[2], 10)
    expect(v.m[3], 'x of projection').toBeCloseTo(parts[3], 10)
    expect(v.m[4], 'x of up axis').toBeCloseTo(parts[4], 10)
    expect(v.m[5], 'y of up axis').toBeCloseTo(parts[5], 10)
    expect(v.m[6], 'z of up axis').toBeCloseTo(parts[6], 10)
    expect(v.m[7], 'y of projection').toBeCloseTo(parts[7], 10)
    expect(v.m[8], 'x of back axis').toBeCloseTo(parts[8], 10)
    expect(v.m[9], 'y of back axis').toBeCloseTo(parts[9], 10)
    expect(v.m[10], 'z of back axis').toBeCloseTo(parts[10], 10)
    expect(v.m[11], 'z of projection').toBeCloseTo(parts[11], 10)
    expect(v.m[12], 'x of translation').toBeCloseTo(parts[12], 10)
    expect(v.m[13], 'y of translation').toBeCloseTo(parts[13], 10)
    expect(v.m[14], 'z of translation').toBeCloseTo(parts[14], 10)
    expect(v.m[15], 'overall scale').toBeCloseTo(parts[15], 10)
  }

  function expectEquality(v1: Mat4, v2: Mat4, precision: number = 10) {
    expectVec3Equality(v1.getRight(), v2.getRight(), precision)
    expectVec3Equality(v1.getUp(), v2.getUp(), precision)
    expectVec3Equality(v1.getBackward(), v2.getBackward(), precision)
    expectVec3Equality(v1.getTranslation(), v2.getTranslation(), precision)
    expect(v1.m[15], 'overall scale').toBeCloseTo(v2.m[15], precision)
  }

  function expectVec3Equality(v1: IVec3, v2: IVec3, precision: number = 10) {
    expect(v1.x, 'x component').toBeCloseTo(v2.x, precision)
    expect(v1.y, 'y component').toBeCloseTo(v2.y, precision)
    expect(v1.z, 'z component').toBeCloseTo(v2.z, precision)
  }

  function expectVec2Components(v: IVec2, parts: number[]) {
    expect(v.x, 'x component').toBeCloseTo(parts[0], 10)
    expect(v.y, 'y component').toBeCloseTo(parts[1], 10)
  }

  function expectVec3Components(v: Vec3, parts: number[]) {
    expect(v.x, 'x component').toBeCloseTo(parts[0], 10)
    expect(v.y, 'y component').toBeCloseTo(parts[1], 10)
    expect(v.z, 'z component').toBeCloseTo(parts[2], 10)
  }

  function expectVec4Components(v: Vec4, parts: number[]) {
    expect(v.x, 'x component').toBeCloseTo(parts[0], 10)
    expect(v.y, 'y component').toBeCloseTo(parts[1], 10)
    expect(v.z, 'z component').toBeCloseTo(parts[2], 10)
    expect(v.w, 'w component').toBeCloseTo(parts[3], 10)
  }

  function expectVec4Equality(v1: Vec4, v2: Vec4, precision: number = 10) {
    expect(v1.x, 'x component').toBeCloseTo(v2.x, precision)
    expect(v1.y, 'y component').toBeCloseTo(v2.y, precision)
    expect(v1.z, 'z component').toBeCloseTo(v2.z, precision)
    expect(v1.w, 'w component').toBeCloseTo(v2.w, precision)
  }

  describe('properties', () => {
    let mat: Mat4
    beforeEach(() => {
      mat = new Mat4([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16])
    })

    it('gets m00', () => expect(mat.m00).toBe(1))
    it('gets m01', () => expect(mat.m01).toBe(2))
    it('gets m02', () => expect(mat.m02).toBe(3))
    it('gets m03', () => expect(mat.m03).toBe(4))
    it('gets m10', () => expect(mat.m10).toBe(5))
    it('gets m11', () => expect(mat.m11).toBe(6))
    it('gets m12', () => expect(mat.m12).toBe(7))
    it('gets m13', () => expect(mat.m13).toBe(8))
    it('gets m20', () => expect(mat.m20).toBe(9))
    it('gets m21', () => expect(mat.m21).toBe(10))
    it('gets m22', () => expect(mat.m22).toBe(11))
    it('gets m23', () => expect(mat.m23).toBe(12))
    it('gets m30', () => expect(mat.m30).toBe(13))
    it('gets m31', () => expect(mat.m31).toBe(14))
    it('gets m32', () => expect(mat.m32).toBe(15))
    it('gets m33', () => expect(mat.m33).toBe(16))

    it('sets m00', () => { mat.m00 = 11; expect(mat.m00).toBe(11) })
    it('sets m01', () => { mat.m01 = 12; expect(mat.m01).toBe(12) })
    it('sets m02', () => { mat.m02 = 13; expect(mat.m02).toBe(13) })
    it('sets m03', () => { mat.m03 = 14; expect(mat.m03).toBe(14) })
    it('sets m10', () => { mat.m10 = 15; expect(mat.m10).toBe(15) })
    it('sets m11', () => { mat.m11 = 16; expect(mat.m11).toBe(16) })
    it('sets m12', () => { mat.m12 = 17; expect(mat.m12).toBe(17) })
    it('sets m13', () => { mat.m13 = 18; expect(mat.m13).toBe(18) })
    it('sets m20', () => { mat.m20 = 19; expect(mat.m20).toBe(19) })
    it('sets m21', () => { mat.m21 = 110; expect(mat.m21).toBe(110) })
    it('sets m22', () => { mat.m22 = 111; expect(mat.m22).toBe(111) })
    it('sets m23', () => { mat.m23 = 112; expect(mat.m23).toBe(112) })
    it('sets m30', () => { mat.m30 = 113; expect(mat.m30).toBe(113) })
    it('sets m31', () => { mat.m31 = 114; expect(mat.m31).toBe(114) })
    it('sets m32', () => { mat.m32 = 115; expect(mat.m32).toBe(115) })
    it('sets m33', () => { mat.m33 = 116; expect(mat.m33).toBe(116) })
  })

  describe('initialization', () => {
    it ('#constructor', () => {
      expectComponents(new Mat4(), [
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
      ])
    })

    it ('#init', () => {
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

    it ('.create', () => {
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

    it ('#initZero', () => {
      expectComponents(Mat4.createWith(1).initZero(), [
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
      ])
    })

    it ('.createZero', () => {
      expectComponents(Mat4.createZero(), [
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
      ])
      expect(Mat4.createZero()).not.toBe(Mat4.createZero())
    })

    it ('#initRowMajor', () => {
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

    it ('.createRowMajor', () => {
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

    it ('#initWith', () => {
      expectComponents(new Mat4().initWith(1), [
        1, 1, 1, 1,
        1, 1, 1, 1,
        1, 1, 1, 1,
        1, 1, 1, 1,
      ])
    })

    it ('.createWith', () => {
      expectComponents(Mat4.createWith(1), [
        1, 1, 1, 1,
        1, 1, 1, 1,
        1, 1, 1, 1,
        1, 1, 1, 1,
      ])
    })

    it ('#initIdentity', () => {
      expectComponents(new Mat4().initWith(1).initIdentity(), [
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1,
      ])
    })

    it ('.createIdentity', () => {
      expectComponents(Mat4.createIdentity(), [
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1,
      ])
      expect(Mat4.createIdentity()).not.toBe(Mat4.createIdentity())
    })

    it ('#initFrom', () => {
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

    it ('.createFrom', () => {
      expectComponents(Mat4.createFrom(new Mat4().init(
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

    describe('#initFromArray', () => {
      it ('sets all components', () => {
        expectComponents(new Mat4().initFromArray([
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
        expectComponents(new Mat4().initFromArray([
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

    describe('.createFromArray', () => {
      it ('sets all components', () => {
        expectComponents(Mat4.createFromArray([
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
        expectComponents(Mat4.createFromArray([
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

    it('#initFromQuaternion', () => {
      const angle = Math.PI * 0.5
      expectEquality(
        new Mat4().initFromQuat(Quat.createAxisAngle(Vec3.Right, angle)),
        Mat4.createRotationX(angle),
      )
      expectEquality(
        new Mat4().initFromQuat(Quat.createAxisAngle(Vec3.Up, angle)),
        Mat4.createRotationY(angle),
      )
      expectEquality(
        new Mat4().initFromQuat(Quat.createAxisAngle(Vec3.Backward, angle)),
        Mat4.createRotationZ(angle),
      )
    })

    it('.createFromQuaternion', () => {
      const angle = Math.PI * 0.5
      expectEquality(
        Mat4.createFromQuat(Quat.createAxisAngle(Vec3.Right, angle)),
        Mat4.createRotationX(angle),
      )
      expectEquality(
        Mat4.createFromQuat(Quat.createAxisAngle(Vec3.Up, angle)),
        Mat4.createRotationY(angle),
      )
      expectEquality(
        Mat4.createFromQuat(Quat.createAxisAngle(Vec3.Backward, angle)),
        Mat4.createRotationZ(angle),
      )
    })

    it('#initAxisAngle', () => {
      const angle = Math.PI * 0.5
      expectEquality(
        new Mat4().initAxisAngleV(Vec3.Right, angle),
        Mat4.createRotationX(angle),
      )
      expectEquality(
        new Mat4().initAxisAngleV(Vec3.Up, angle),
        Mat4.createRotationY(angle),
      )
      expectEquality(
        new Mat4().initAxisAngleV(Vec3.Backward, angle),
        Mat4.createRotationZ(angle),
      )
    })

    it('.createAxisAngle', () => {
      const angle = Math.PI * 0.5
      expectEquality(
        Mat4.createAxisAngleV(Vec3.Right, angle),
        Mat4.createRotationX(angle),
      )
      expectEquality(
        Mat4.createAxisAngleV(Vec3.Up, angle),
        Mat4.createRotationY(angle),
      )
      expectEquality(
        Mat4.createAxisAngleV(Vec3.Backward, angle),
        Mat4.createRotationZ(angle),
      )
    })

    it('#initYawPitchRoll', () => {
      const mat = new Mat4().initYawPitchRoll(Math.PI * 0.5, Math.PI * 0.5, Math.PI * 0.5)
      const vec = Vec3.create(0, 0, -1)
      const vec2 = mat.transformV3(vec)
      expectVec3Components(vec2, [0, 1, 0])
    })

    it('.createYawPitchRoll', () => {
      const mat = Mat4.createYawPitchRoll(Math.PI * 0.5, Math.PI * 0.5, Math.PI * 0.5)
      const vec = Vec3.create(0, 0, -1)
      const vec2 = mat.transformV3(vec)
      expectVec3Components(vec2, [0, 1, 0])
    })

    it('#initRotationX', () => {
      expectVec3Components(new Mat4().initRotationX(Math.PI * 0.5).transformV3(Vec3.create(1, 0, 0)), [1,  0, 0])
      expectVec3Components(new Mat4().initRotationX(Math.PI * 0.5).transformV3(Vec3.create(0, 1, 0)), [0,  0, 1])
      expectVec3Components(new Mat4().initRotationX(Math.PI * 0.5).transformV3(Vec3.create(0, 0, 1)), [0, -1, 0])
    })

    it('.createRotationX', () => {
      expectVec3Components(Mat4.createRotationX(Math.PI * 0.5).transformV3(Vec3.create(1, 0, 0)), [1,  0, 0])
      expectVec3Components(Mat4.createRotationX(Math.PI * 0.5).transformV3(Vec3.create(0, 1, 0)), [0,  0, 1])
      expectVec3Components(Mat4.createRotationX(Math.PI * 0.5).transformV3(Vec3.create(0, 0, 1)), [0, -1, 0])
    })

    it('#initRotationY', () => {
      expectVec3Components(new Mat4().initRotationY(Math.PI * 0.5).transformV3(Vec3.create(1, 0, 0)), [0, 0, -1])
      expectVec3Components(new Mat4().initRotationY(Math.PI * 0.5).transformV3(Vec3.create(0, 1, 0)), [0, 1,  0])
      expectVec3Components(new Mat4().initRotationY(Math.PI * 0.5).transformV3(Vec3.create(0, 0, 1)), [1, 0,  0])
    })

    it('.createRotationY', () => {
      expectVec3Components(Mat4.createRotationY(Math.PI * 0.5).transformV3(Vec3.create(1, 0, 0)), [0, 0, -1])
      expectVec3Components(Mat4.createRotationY(Math.PI * 0.5).transformV3(Vec3.create(0, 1, 0)), [0, 1,  0])
      expectVec3Components(Mat4.createRotationY(Math.PI * 0.5).transformV3(Vec3.create(0, 0, 1)), [1, 0,  0])
    })

    it('#initRotationZ', () => {
      expectVec3Components(new Mat4().initRotationZ(Math.PI * 0.5).transformV3(Vec3.create(1, 0, 0)), [ 0, 1, 0])
      expectVec3Components(new Mat4().initRotationZ(Math.PI * 0.5).transformV3(Vec3.create(0, 1, 0)), [-1, 0, 0])
      expectVec3Components(new Mat4().initRotationZ(Math.PI * 0.5).transformV3(Vec3.create(0, 0, 1)), [ 0, 0, 1])
    })

    it('.createRotationZ', () => {
      expectVec3Components(Mat4.createRotationZ(Math.PI * 0.5).transformV3(Vec3.create(1, 0, 0)), [ 0, 1, 0])
      expectVec3Components(Mat4.createRotationZ(Math.PI * 0.5).transformV3(Vec3.create(0, 1, 0)), [-1, 0, 0])
      expectVec3Components(Mat4.createRotationZ(Math.PI * 0.5).transformV3(Vec3.create(0, 0, 1)), [ 0, 0, 1])
    })

    it('#initTranslation', () => {
      expectVec3Components(new Mat4().initTranslation(1, 2, 3).transformV3(Vec3.create(1, 0, 0)), [ 2, 2, 3])
      expectVec3Components(new Mat4().initTranslation(1, 2, 3).transformV3(Vec3.create(0, 1, 0)), [ 1, 3, 3])
      expectVec3Components(new Mat4().initTranslation(1, 2, 3).transformV3(Vec3.create(0, 0, 1)), [ 1, 2, 4])
    })

    it('.createTranslation', () => {
      expectVec3Components(Mat4.createTranslation(1, 2, 3).transformV3(Vec3.create(1, 0, 0)), [ 2, 2, 3])
      expectVec3Components(Mat4.createTranslation(1, 2, 3).transformV3(Vec3.create(0, 1, 0)), [ 1, 3, 3])
      expectVec3Components(Mat4.createTranslation(1, 2, 3).transformV3(Vec3.create(0, 0, 1)), [ 1, 2, 4])
    })

    it('#initScale', () => {
      expectVec3Components(new Mat4().initScale(1, 2, 3).transformV3(Vec3.create(1, 0, 0)), [ 1, 0, 0])
      expectVec3Components(new Mat4().initScale(1, 2, 3).transformV3(Vec3.create(0, 1, 0)), [ 0, 2, 0])
      expectVec3Components(new Mat4().initScale(1, 2, 3).transformV3(Vec3.create(0, 0, 1)), [ 0, 0, 3])
    })

    it('.createScale', () => {
      expectVec3Components(Mat4.createScale(1, 2, 3).transformV3(Vec3.create(1, 0, 0)), [ 1, 0, 0])
      expectVec3Components(Mat4.createScale(1, 2, 3).transformV3(Vec3.create(0, 1, 0)), [ 0, 2, 0])
      expectVec3Components(Mat4.createScale(1, 2, 3).transformV3(Vec3.create(0, 0, 1)), [ 0, 0, 3])
    })

    it('#initLookAt', () => {
      expectEquality(new Mat4().initLookAt(Vec3.Zero, Vec3.Right, Vec3.Up), Mat4.createRotationY(-Math.PI * 0.5))
      expectEquality(new Mat4().initLookAt(Vec3.Zero, Vec3.Left, Vec3.Up), Mat4.createRotationY(Math.PI * 0.5))
      expectEquality(new Mat4().initLookAt(Vec3.Zero, Vec3.Forward, Vec3.Up), Mat4.createRotationY(0))
      expectEquality(new Mat4().initLookAt(Vec3.Zero, Vec3.Backward, Vec3.Up), Mat4.createRotationY(Math.PI))
    })

    it('.createLookAt', () => {
      expectEquality(Mat4.createLookAt(Vec3.Zero, Vec3.Right, Vec3.Up), Mat4.createRotationY(-Math.PI * 0.5))
      expectEquality(Mat4.createLookAt(Vec3.Zero, Vec3.Left, Vec3.Up), Mat4.createRotationY(Math.PI * 0.5))
      expectEquality(Mat4.createLookAt(Vec3.Zero, Vec3.Forward, Vec3.Up), Mat4.createRotationY(0))
      expectEquality(Mat4.createLookAt(Vec3.Zero, Vec3.Backward, Vec3.Up), Mat4.createRotationY(Math.PI))
    })

    it('#initWorld', () => {
      expectEquality(
        new Mat4().initWorld(Vec3.create(1, 1, 1), Vec3.create(-1, -1, -1), Vec3.Up),
        Mat4.createLookAt(Vec3.create(1, 1, 1), Vec3.Zero, Vec3.Up),
      )
    })
    it('.createWorld', () => {
      expectEquality(
        Mat4.createWorld(Vec3.create(1, 1, 1), Vec3.create(-1, -1, -1), Vec3.Up),
        Mat4.createLookAt(Vec3.create(1, 1, 1), Vec3.Zero, Vec3.Up),
      )
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

  describe('#toArray', () => {
    it('creates an array array', () => {
      const result = new Mat4().init(
        1, 2, 3, 4,
        5, 6, 7, 8,
        9, 10, 11, 12,
        13, 14, 15, 16,
      ).toArray()
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
      ).toArray([], 4)
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
        mat2.m[i] = 100
        expect(mat.equals(mat2), `component ${i}`).toBe(false)
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
      expectComponents(mat.setTranslationV(Vec3.create(21, 22, 23)).transpose(), [
        1, 2, 3, 21,
        5, 6, 7, 22,
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
        mat.negate().m.forEach((it: number, index: number) => {
          expect(it, `component ${index}`).toBe(-(index + 1))
        })
      })
    })

    describe('.negate', () => {
      it ('negates components', () => {
        Mat4.negate(mat).m.forEach((it: number, index: number) => {
          expect(it, `component ${index}`).toBe(-(index + 1))
        })
      })
    })

    describe('#add', () => {
      it ('adds components', () => {
        const mat1 = mat.clone()
        const mat2 = mat1.clone()
        mat1.add(mat2).m.forEach((it: number, index: number) => {
          expect(it, `component ${index}`).toBe((index + 1) + (index + 1))
        })
      })
    })

    describe('.add', () => {
      it ('adds components', () => {
        const mat1 = mat.clone()
        const mat2 = mat1.clone()
        Mat4.add(mat1, mat2).m.forEach((it: number, index: number) => {
          expect(it, `component ${index}`).toBe((index + 1) + (index + 1))
        })
      })
    })

    describe('#addScalar', () => {
      it ('adds components', () => {
        mat.addScalar(10).m.forEach((it: number, index: number) => {
          expect(it, `component ${index}`).toBe((index + 1) + 10)
        })
      })
    })

    describe('.addScalar', () => {
      it ('adds components', () => {
        Mat4.addScalar(mat, 10).m.forEach((it: number, index: number) => {
          expect(it, `component ${index}`).toBe((index + 1) + 10)
        })
      })
    })

    describe('#subtract', () => {
      it ('subtracts components', () => {
        const mat1 = mat.clone()
        const mat2 = mat1.clone()
        mat1.subtract(mat2).m.forEach((it: number, index: number) => {
          expect(it, `component ${index}`).toBe((index + 1) - (index + 1))
        })
      })
    })

    describe('.subtract', () => {
      it ('subtracts components', () => {
        const mat1 = mat.clone()
        const mat2 = mat1.clone()
        Mat4.subtract(mat1, mat2).m.forEach((it: number, index: number) => {
          expect(it, `component ${index}`).toBe((index + 1) - (index + 1))
        })
      })
    })

    describe('#subtractScalar', () => {
      it ('subtracts components', () => {
        mat.subtractScalar(10).m.forEach((it: number, index: number) => {
          expect(it, `component ${index}`).toBe((index + 1) - 10)
        })
      })
    })

    describe('.subtractScalar', () => {
      it ('subtracts components', () => {
        Mat4.subtractScalar(mat, 10).m.forEach((it: number, index: number) => {
          expect(it, `component ${index}`).toBe((index + 1) - 10)
        })
      })
    })

    describe('#multiplyScalar', () => {
      it ('multiplies components', () => {
        mat.multiplyScalar(10).m.forEach((it: number, index: number) => {
          expect(it, `component ${index}`).toBeCloseTo((index + 1) * 10, 5)
        })
      })
    })

    describe('.multiplyScalar', () => {
      it ('multiplies components', () => {
        Mat4.multiplyScalar(mat, 10).m.forEach((it: number, index: number) => {
          expect(it, `component ${index}`).toBeCloseTo((index + 1) * 10, 5)
        })
      })
    })

    describe('#divide', () => {
      it ('divides components', () => {
        mat.divide(mat).m.forEach((it: number, index: number) => {
          expect(it, `component ${index}`).toBeCloseTo(1, 5)
        })
      })
    })

    describe('.divide', () => {
      it ('divides components', () => {
        Mat4.divide(mat, mat).m.forEach((it: number, index: number) => {
          expect(it, `component ${index}`).toBeCloseTo(1, 5)
        })
      })
    })

    describe('#divideScalar', () => {
      it ('divides components', () => {
        mat.divideScalar(10).m.forEach((it: number, index: number) => {
          expect(it, `component ${index}`).toBeCloseTo((index + 1) / 10, 5)
        })
      })
    })

    describe('.divideScalar', () => {
      it ('divides components', () => {
        Mat4.divideScalar(mat, 10).m.forEach((it: number, index: number) => {
          expect(it, `component ${index}`).toBeCloseTo((index + 1) / 10, 5)
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
        expectEquality(A.clone().invert().multiply(A), Mat4.createIdentity(), 5)
      })
      it ('a.multiply(b) is mathematically: A*B', () => {
        const A = Mat4.createRotationX(Math.PI)
        const B = Mat4.createRotationY(Math.PI)
        const C = Mat4.createRotationZ(Math.PI)
        const D = Mat4.createTranslation(1, 2, 3)
        const E = A.clone().multiply(B).multiply(C).multiply(D)
        const vec = E.transformV4(Vec4.create(1, 1, 1, 1))
        const expect =
          A.transformV4(
            B.transformV4(
              C.transformV4(
                D.transformV4(
                  Vec4.create(1, 1, 1, 1),
                ),
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
        expectEquality(Mat4.multiply(Mat4.invert(A), A), Mat4.createIdentity(), 5)
      })
      it ('multiply(a, b) is mathematically: A*B', () => {
        const A = Mat4.createRotationX(Math.PI)
        const B = Mat4.createRotationY(Math.PI)
        const C = Mat4.createRotationZ(Math.PI)
        const D = Mat4.createTranslation(1, 2, 3)
        const E = Mat4.multiply(Mat4.multiply(Mat4.multiply(A, B), C), D)
        const vec = E.transformV4(Vec4.create(1, 1, 1, 1))
        const expect =
          A.transformV4(
            B.transformV4(
              C.transformV4(
                D.transformV4(
                  Vec4.create(1, 1, 1, 1),
                ),
              ),
            ),
          )
        expectVec4Equality(vec, expect)
      })
    })

    // describe('.multiplyChain', () => {
    //   it ('multiply(a, b, c) is mathematically: A*B*C', () => {
    //     const A = Mat4.createRotationX(Math.PI)
    //     const B = Mat4.createRotationY(Math.PI)
    //     const C = Mat4.createRotationZ(Math.PI)
    //     const D = Mat4.createTranslation(1, 2, 3)
    //     const E = Mat4.multiplyChain(A, B, C, D)
    //     const vec = E.transformV4(Vec4.create(1, 1, 1, 1))
    //     const expect =
    //       D.transformV4(
    //         C.transformV4(
    //           B.transformV4(
    //             A.transformV4(Vec4.create(1, 1, 1, 1)),
    //           ),
    //         ),
    //       )
    //     expectVec4Equality(vec, expect)
    //   })
    // })

    describe('#premultiply', () => {
      it ('A * inv(A) == identity', () => {
        const A = Mat4.createRowMajor(
           4,    1,    2,   -4,
           4,    1,    2,   -3,
          -8,   -4,   -5,    3,
          -4,   -2,   -5,   -4,
        )
        expectEquality(A.clone().invert().premultiply(A), Mat4.createIdentity(), 5)
      })
      it ('a.premultiply(b) is mathematically: B*A', () => {
        const A = Mat4.createRotationX(Math.PI)
        const B = Mat4.createRotationY(Math.PI)
        const C = Mat4.createRotationZ(Math.PI)
        const D = Mat4.createTranslation(1, 2, 3)
        const E = A.clone().premultiply(B).premultiply(C).premultiply(D)
        const vec = E.transformV4(Vec4.create(1, 1, 1, 1))
        const expect =
          D.transformV4(
            C.transformV4(
              B.transformV4(
                A.transformV4(
                  Vec4.create(1, 1, 1, 1),
                ),
              ),
            ),
          )
        expectVec4Equality(vec, expect)
      })
    })

    describe('.premultiply', () => {
      it ('A * inv(A) == identity', () => {
        const A = Mat4.createRowMajor(
           4,    1,    2,   -4,
           4,    1,    2,   -3,
          -8,   -4,   -5,    3,
          -4,   -2,   -5,   -4,
        )
        expectEquality(Mat4.premultiply(Mat4.invert(A), A), Mat4.createIdentity(), 5)
      })
      it ('premultiply(a, b) is mathematically: B*A', () => {
        const A = Mat4.createRotationX(Math.PI)
        const B = Mat4.createRotationY(Math.PI)
        const C = Mat4.createRotationZ(Math.PI)
        const D = Mat4.createTranslation(1, 2, 3)
        const E = Mat4.premultiply(Mat4.premultiply(Mat4.premultiply(A, B), C), D)
        const vec = E.transformV4(Vec4.create(1, 1, 1, 1))
        const expect =
          D.transformV4(
            C.transformV4(
              B.transformV4(
                A.transformV4(
                  Vec4.create(1, 1, 1, 1),
                ),
              ),
            ),
          )
        expectVec4Equality(vec, expect)
      })
    })

    // describe('.concatChain', () => {
    //   it ('concat(a, b, c) is mathematically: C*B*A', () => {
    //     const A = Mat4.createRotationX(Math.PI)
    //     const B = Mat4.createRotationY(Math.PI)
    //     const C = Mat4.createRotationZ(Math.PI)
    //     const D = Mat4.createTranslation(1, 2, 3)
    //     const E = Mat4.concatChain(A, B, C, D)
    //     const vec = E.transformV4(Vec4.create(1, 1, 1, 1))
    //     const expect =
    //       A.transformV4(
    //         B.transformV4(
    //           C.transformV4(
    //             D.transformV4(
    //               Vec4.create(1, 1, 1, 1),
    //             ),
    //           ),
    //         ),
    //       )
    //     expectVec4Equality(vec, expect)
    //   })
    // })
  })

  describe('#rotateX', () => {
    it ('#rotateX', () => {
      const m = Mat4.createTranslation(1, 2, 3)
      expectVec3Components(m.getRight(),    [1, 0, 0])
      expectVec3Components(m.getUp(),       [0, 1, 0])
      expectVec3Components(m.getBackward(), [0, 0, 1])
      expectVec3Components(m.getTranslation(), [1, 2, 3])

      m.rotateX(Math.PI * 0.5)
      expectVec3Components(m.getRight(),    [1, 0, 0])
      expectVec3Components(m.getUp(),       [0, 0, 1])
      expectVec3Components(m.getBackward(), [0, -1, 0])
      expectVec3Components(m.getTranslation(), [1, 2, 3])

      m.rotateX(Math.PI * 0.5)
      expectVec3Components(m.getRight(),    [1, 0, 0])
      expectVec3Components(m.getUp(),       [0, -1, 0])
      expectVec3Components(m.getBackward(), [0, 0, -1])
      expectVec3Components(m.getTranslation(), [1, 2, 3])

      m.rotateX(Math.PI * 0.5)
      expectVec3Components(m.getRight(),    [1, 0, 0])
      expectVec3Components(m.getUp(),       [0, 0, -1])
      expectVec3Components(m.getBackward(), [0, 1, 0])
      expectVec3Components(m.getTranslation(), [1, 2, 3])

      m.rotateX(Math.PI * 0.5)
      expectVec3Components(m.getRight(),    [1, 0, 0])
      expectVec3Components(m.getUp(),       [0, 1, 0])
      expectVec3Components(m.getBackward(), [0, 0, 1])
      expectVec3Components(m.getTranslation(), [1, 2, 3])
    })

    it ('post rotates (in local space)', () => {
      const m = Mat4.createWorld({ x: 1, y: 2, z: 3}, Vec3.Left, Vec3.Up)
      expectVec3Components(m.getRight(),    [0, 0, -1])
      expectVec3Components(m.getUp(),       [0, 1, 0])
      expectVec3Components(m.getBackward(), [1, 0, 0])
      expectVec3Components(m.getTranslation(), [1, 2, 3])

      m.rotateX(Math.PI * 0.5)
      expectVec3Components(m.getRight(),    [0, 0, -1])
      expectVec3Components(m.getUp(),       [1, 0, 0])
      expectVec3Components(m.getBackward(), [0, -1, 0])
      expectVec3Components(m.getTranslation(), [1, 2, 3])
    })
  })

  describe('#preRotateX', () => {
    it ('#preRotateX', () => {
      const m = Mat4.createTranslation(1, 2, 3)
      expectVec3Components(m.getRight(),    [1, 0, 0])
      expectVec3Components(m.getUp(),       [0, 1, 0])
      expectVec3Components(m.getBackward(), [0, 0, 1])
      expectVec3Components(m.getTranslation(), [1, 2, 3])

      m.preRotateX(Math.PI * 0.5)
      expectVec3Components(m.getRight(),    [1, 0, 0])
      expectVec3Components(m.getUp(),       [0, 0, 1])
      expectVec3Components(m.getBackward(), [0, -1, 0])
      expectVec3Components(m.getTranslation(), [1, -3, 2])

      m.preRotateX(Math.PI * 0.5)
      expectVec3Components(m.getRight(),    [1, 0, 0])
      expectVec3Components(m.getUp(),       [0, -1, 0])
      expectVec3Components(m.getBackward(), [0, 0, -1])
      expectVec3Components(m.getTranslation(), [1, -2, -3])

      m.preRotateX(Math.PI * 0.5)
      expectVec3Components(m.getRight(),    [1, 0, 0])
      expectVec3Components(m.getUp(),       [0, 0, -1])
      expectVec3Components(m.getBackward(), [0, 1, 0])
      expectVec3Components(m.getTranslation(), [1, 3, -2])

      m.preRotateX(Math.PI * 0.5)
      expectVec3Components(m.getRight(),    [1, 0, 0])
      expectVec3Components(m.getUp(),       [0, 1, 0])
      expectVec3Components(m.getBackward(), [0, 0, 1])
      expectVec3Components(m.getTranslation(), [1, 2, 3])
    })

    it ('pre rotates (in global space)', () => {
      const m = Mat4.createWorld({ x: 1, y: 2, z: 3}, Vec3.Left, Vec3.Up)
      expectVec3Components(m.getRight(),    [0, 0, -1])
      expectVec3Components(m.getUp(),       [0, 1, 0])
      expectVec3Components(m.getBackward(), [1, 0, 0])
      expectVec3Components(m.getTranslation(), [1, 2, 3])

      m.preRotateX(Math.PI * 0.5)
      // expectVec3Components(m.getRight(),    [0, 0, -1])
      // expectVec3Components(m.getUp(),       [1, 0, 0])
      // expectVec3Components(m.getBackward(), [0, -1, 0])
      expectVec3Components(m.getTranslation(), [1, -3, 2])
    })
  })

  describe('#rotateY', () => {
    it ('rotates a matrix', () => {
      const m = Mat4.createTranslation(1, 2, 3)
      expectVec3Components(m.getRight(),    [1, 0, 0])
      expectVec3Components(m.getUp(),       [0, 1, 0])
      expectVec3Components(m.getBackward(), [0, 0, 1])
      expectVec3Components(m.getTranslation(), [1, 2, 3])

      m.rotateY(Math.PI * 0.5)
      expectVec3Components(m.getRight(),    [0, 0, -1])
      expectVec3Components(m.getUp(),       [0, 1, 0])
      expectVec3Components(m.getBackward(), [1, 0, 0])
      expectVec3Components(m.getTranslation(), [1, 2, 3])

      m.rotateY(Math.PI * 0.5)
      expectVec3Components(m.getRight(),    [-1, 0, 0])
      expectVec3Components(m.getUp(),       [0, 1, 0])
      expectVec3Components(m.getBackward(), [0, 0, -1])
      expectVec3Components(m.getTranslation(), [1, 2, 3])

      m.rotateY(Math.PI * 0.5)
      expectVec3Components(m.getRight(),    [0, 0, 1])
      expectVec3Components(m.getUp(),       [0, 1, 0])
      expectVec3Components(m.getBackward(), [-1, 0, 0])
      expectVec3Components(m.getTranslation(), [1, 2, 3])

      m.rotateY(Math.PI * 0.5)
      expectVec3Components(m.getRight(),    [1, 0, 0])
      expectVec3Components(m.getUp(),       [0, 1, 0])
      expectVec3Components(m.getBackward(), [0, 0, 1])
      expectVec3Components(m.getTranslation(), [1, 2, 3])
    })

    it ('post rotates (in local space)', () => {
      const m = Mat4.createWorld({ x: 1, y: 2, z: 3}, Vec3.Left, Vec3.Up)
      expectVec3Components(m.getRight(),    [0, 0, -1])
      expectVec3Components(m.getUp(),       [0, 1, 0])
      expectVec3Components(m.getBackward(), [1, 0, 0])
      expectVec3Components(m.getTranslation(), [1, 2, 3])

      m.rotateY(Math.PI * 0.5)
      expectVec3Components(m.getRight(),    [-1, 0, 0])
      expectVec3Components(m.getUp(),       [0, 1, 0])
      expectVec3Components(m.getBackward(), [0, 0, -1])
      expectVec3Components(m.getTranslation(), [1, 2, 3])
    })
  })

  describe('#preRotateY', () => {
    it ('rotates a matrix', () => {
      const m = Mat4.createTranslation(1, 2, 3)
      expectVec3Components(m.getRight(),    [1, 0, 0])
      expectVec3Components(m.getUp(),       [0, 1, 0])
      expectVec3Components(m.getBackward(), [0, 0, 1])
      expectVec3Components(m.getTranslation(), [1, 2, 3])

      m.preRotateY(Math.PI * 0.5)
      expectVec3Components(m.getRight(),    [0, 0, -1])
      expectVec3Components(m.getUp(),       [0, 1, 0])
      expectVec3Components(m.getBackward(), [1, 0, 0])
      expectVec3Components(m.getTranslation(), [3, 2, -1])

      m.preRotateY(Math.PI * 0.5)
      expectVec3Components(m.getRight(),    [-1, 0, 0])
      expectVec3Components(m.getUp(),       [0, 1, 0])
      expectVec3Components(m.getBackward(), [0, 0, -1])
      expectVec3Components(m.getTranslation(), [-1, 2, -3])

      m.preRotateY(Math.PI * 0.5)
      expectVec3Components(m.getRight(),    [0, 0, 1])
      expectVec3Components(m.getUp(),       [0, 1, 0])
      expectVec3Components(m.getBackward(), [-1, 0, 0])
      expectVec3Components(m.getTranslation(), [-3, 2, 1])

      m.preRotateY(Math.PI * 0.5)
      expectVec3Components(m.getRight(),    [1, 0, 0])
      expectVec3Components(m.getUp(),       [0, 1, 0])
      expectVec3Components(m.getBackward(), [0, 0, 1])
      expectVec3Components(m.getTranslation(), [1, 2, 3])
    })

    it ('pre rotates (in global space)', () => {
      const m = Mat4.createWorld({ x: 1, y: 2, z: 3}, Vec3.Left, Vec3.Up)
      expectVec3Components(m.getRight(),    [0, 0, -1])
      expectVec3Components(m.getUp(),       [0, 1, 0])
      expectVec3Components(m.getBackward(), [1, 0, 0])
      expectVec3Components(m.getTranslation(), [1, 2, 3])

      m.preRotateY(Math.PI * 0.5)
      expectVec3Components(m.getRight(),    [-1, 0, 0])
      expectVec3Components(m.getUp(),       [0, 1, 0])
      expectVec3Components(m.getBackward(), [0, 0, -1])
      expectVec3Components(m.getTranslation(), [3, 2, -1])
    })
  })

  describe('#rotateZ', () => {
    it ('rotates a matrix', () => {
      const m = Mat4.createTranslation(1, 2, 3)
      expectVec3Components(m.getRight(),    [1, 0, 0])
      expectVec3Components(m.getUp(),       [0, 1, 0])
      expectVec3Components(m.getBackward(), [0, 0, 1])
      expectVec3Components(m.getTranslation(), [1, 2, 3])

      m.rotateZ(Math.PI * 0.5)
      expectVec3Components(m.getRight(),    [0, 1, 0])
      expectVec3Components(m.getUp(),       [-1, 0, 0])
      expectVec3Components(m.getBackward(), [0, 0, 1])
      expectVec3Components(m.getTranslation(), [1, 2, 3])

      m.rotateZ(Math.PI * 0.5)
      expectVec3Components(m.getRight(),    [-1, 0, 0])
      expectVec3Components(m.getUp(),       [0, -1, 0])
      expectVec3Components(m.getBackward(), [0, 0, 1])
      expectVec3Components(m.getTranslation(), [1, 2, 3])

      m.rotateZ(Math.PI * 0.5)
      expectVec3Components(m.getRight(),    [0, -1, 0])
      expectVec3Components(m.getUp(),       [1, 0, 0])
      expectVec3Components(m.getBackward(), [0, 0, 1])
      expectVec3Components(m.getTranslation(), [1, 2, 3])

      m.rotateZ(Math.PI * 0.5)
      expectVec3Components(m.getRight(),    [1, 0, 0])
      expectVec3Components(m.getUp(),       [0, 1, 0])
      expectVec3Components(m.getBackward(), [0, 0, 1])
      expectVec3Components(m.getTranslation(), [1, 2, 3])
    })
  })

  describe('#preRotateZ', () => {
    it ('rotates a matrix', () => {
      const m = Mat4.createTranslation(1, 2, 3)
      expectVec3Components(m.getRight(),    [1, 0, 0])
      expectVec3Components(m.getUp(),       [0, 1, 0])
      expectVec3Components(m.getBackward(), [0, 0, 1])
      expectVec3Components(m.getTranslation(), [1, 2, 3])

      m.preRotateZ(Math.PI * 0.5)
      expectVec3Components(m.getRight(),    [0, 1, 0])
      expectVec3Components(m.getUp(),       [-1, 0, 0])
      expectVec3Components(m.getBackward(), [0, 0, 1])
      expectVec3Components(m.getTranslation(), [-2, 1, 3])

      m.preRotateZ(Math.PI * 0.5)
      expectVec3Components(m.getRight(),    [-1, 0, 0])
      expectVec3Components(m.getUp(),       [0, -1, 0])
      expectVec3Components(m.getBackward(), [0, 0, 1])
      expectVec3Components(m.getTranslation(), [-1, -2, 3])

      m.preRotateZ(Math.PI * 0.5)
      expectVec3Components(m.getRight(),    [0, -1, 0])
      expectVec3Components(m.getUp(),       [1, 0, 0])
      expectVec3Components(m.getBackward(), [0, 0, 1])
      expectVec3Components(m.getTranslation(), [2, -1, 3])

      m.preRotateZ(Math.PI * 0.5)
      expectVec3Components(m.getRight(),    [1, 0, 0])
      expectVec3Components(m.getUp(),       [0, 1, 0])
      expectVec3Components(m.getBackward(), [0, 0, 1])
      expectVec3Components(m.getTranslation(), [1, 2, 3])
    })
  })

  describe('#rotateYawPitchRoll', () => {

    it ('pitch', () => {
      const m = Mat4.createTranslation(1, 2, 3)
      expectVec3Components(m.getRight(),    [1, 0, 0])
      expectVec3Components(m.getUp(),       [0, 1, 0])
      expectVec3Components(m.getBackward(), [0, 0, 1])

      m.rotateYawPitchRoll(0, Math.PI * 0.5, 0)
      expectVec3Components(m.getRight(),    [1, 0, 0])
      expectVec3Components(m.getUp(),       [0, 0, 1])
      expectVec3Components(m.getBackward(), [0, -1, 0])

      m.rotateYawPitchRoll(0, Math.PI * 0.5, 0)
      expectVec3Components(m.getRight(),    [1, 0, 0])
      expectVec3Components(m.getUp(),       [0, -1, 0])
      expectVec3Components(m.getBackward(), [0, 0, -1])

      m.rotateYawPitchRoll(0, Math.PI * 0.5, 0)
      expectVec3Components(m.getRight(),    [1, 0, 0])
      expectVec3Components(m.getUp(),       [0, 0, -1])
      expectVec3Components(m.getBackward(), [0, 1, 0])

      m.rotateYawPitchRoll(0, Math.PI * 0.5, 0)
      expectVec3Components(m.getRight(),    [1, 0, 0])
      expectVec3Components(m.getUp(),       [0, 1, 0])
      expectVec3Components(m.getBackward(), [0, 0, 1])
    })

    it ('yaw', () => {
      const m = Mat4.createTranslation(1, 2, 3)
      expectVec3Components(m.getRight(),    [1, 0, 0])
      expectVec3Components(m.getUp(),       [0, 1, 0])
      expectVec3Components(m.getBackward(), [0, 0, 1])

      m.rotateYawPitchRoll(Math.PI * 0.5, 0, 0)
      expectVec3Components(m.getRight(),    [0, 0, -1])
      expectVec3Components(m.getUp(),       [0, 1, 0])
      expectVec3Components(m.getBackward(), [1, 0, 0])

      m.rotateYawPitchRoll(Math.PI * 0.5, 0, 0)
      expectVec3Components(m.getRight(),    [-1, 0, 0])
      expectVec3Components(m.getUp(),       [0, 1, 0])
      expectVec3Components(m.getBackward(), [0, 0, -1])

      m.rotateYawPitchRoll(Math.PI * 0.5, 0, 0)
      expectVec3Components(m.getRight(),    [0, 0, 1])
      expectVec3Components(m.getUp(),       [0, 1, 0])
      expectVec3Components(m.getBackward(), [-1, 0, 0])

      m.rotateYawPitchRoll(Math.PI * 0.5, 0, 0)
      expectVec3Components(m.getRight(),    [1, 0, 0])
      expectVec3Components(m.getUp(),       [0, 1, 0])
      expectVec3Components(m.getBackward(), [0, 0, 1])
    })

    it ('roll', () => {
      const m = Mat4.createTranslation(1, 2, 3)
      expectVec3Components(m.getRight(),    [1, 0, 0])
      expectVec3Components(m.getUp(),       [0, 1, 0])
      expectVec3Components(m.getBackward(), [0, 0, 1])

      m.rotateYawPitchRoll(0, 0, Math.PI * 0.5)
      expectVec3Components(m.getRight(),    [0, 1, 0])
      expectVec3Components(m.getUp(),       [-1, 0, 0])
      expectVec3Components(m.getBackward(), [0, 0, 1])

      m.rotateYawPitchRoll(0, 0, Math.PI * 0.5)
      expectVec3Components(m.getRight(),    [-1, 0, 0])
      expectVec3Components(m.getUp(),       [0, -1, 0])
      expectVec3Components(m.getBackward(), [0, 0, 1])

      m.rotateYawPitchRoll(0, 0, Math.PI * 0.5)
      expectVec3Components(m.getRight(),    [0, -1, 0])
      expectVec3Components(m.getUp(),       [1, 0, 0])
      expectVec3Components(m.getBackward(), [0, 0, 1])

      m.rotateYawPitchRoll(0, 0, Math.PI * 0.5)
      expectVec3Components(m.getRight(),    [1, 0, 0])
      expectVec3Components(m.getUp(),       [0, 1, 0])
      expectVec3Components(m.getBackward(), [0, 0, 1])
    })
  })

  describe('#rotateAxisAngle', () => {

    it ('X axis', () => {
      const m = Mat4.createTranslation(1, 2, 3)
      expectVec3Components(m.getRight(),    [1, 0, 0])
      expectVec3Components(m.getUp(),       [0, 1, 0])
      expectVec3Components(m.getBackward(), [0, 0, 1])

      m.rotateAxisAngleV(Vec3.UnitX, Math.PI * 0.5)
      expectVec3Components(m.getRight(),    [1, 0, 0])
      expectVec3Components(m.getUp(),       [0, 0, 1])
      expectVec3Components(m.getBackward(), [0, -1, 0])

      m.rotateAxisAngleV(Vec3.UnitX, Math.PI * 0.5)
      expectVec3Components(m.getRight(),    [1, 0, 0])
      expectVec3Components(m.getUp(),       [0, -1, 0])
      expectVec3Components(m.getBackward(), [0, 0, -1])

      m.rotateAxisAngleV(Vec3.UnitX, Math.PI * 0.5)
      expectVec3Components(m.getRight(),    [1, 0, 0])
      expectVec3Components(m.getUp(),       [0, 0, -1])
      expectVec3Components(m.getBackward(), [0, 1, 0])

      m.rotateAxisAngleV(Vec3.UnitX, Math.PI * 0.5)
      expectVec3Components(m.getRight(),    [1, 0, 0])
      expectVec3Components(m.getUp(),       [0, 1, 0])
      expectVec3Components(m.getBackward(), [0, 0, 1])
    })

    it ('Y axis', () => {
      const m = Mat4.createTranslation(1, 2, 3)
      expectVec3Components(m.getRight(),    [1, 0, 0])
      expectVec3Components(m.getUp(),       [0, 1, 0])
      expectVec3Components(m.getBackward(), [0, 0, 1])

      m.rotateAxisAngleV(Vec3.UnitY, Math.PI * 0.5)
      expectVec3Components(m.getRight(),    [0, 0, -1])
      expectVec3Components(m.getUp(),       [0, 1, 0])
      expectVec3Components(m.getBackward(), [1, 0, 0])

      m.rotateAxisAngleV(Vec3.UnitY, Math.PI * 0.5)
      expectVec3Components(m.getRight(),    [-1, 0, 0])
      expectVec3Components(m.getUp(),       [0, 1, 0])
      expectVec3Components(m.getBackward(), [0, 0, -1])

      m.rotateAxisAngleV(Vec3.UnitY, Math.PI * 0.5)
      expectVec3Components(m.getRight(),    [0, 0, 1])
      expectVec3Components(m.getUp(),       [0, 1, 0])
      expectVec3Components(m.getBackward(), [-1, 0, 0])

      m.rotateAxisAngleV(Vec3.UnitY, Math.PI * 0.5)
      expectVec3Components(m.getRight(),    [1, 0, 0])
      expectVec3Components(m.getUp(),       [0, 1, 0])
      expectVec3Components(m.getBackward(), [0, 0, 1])
    })

    it ('Z axis', () => {
      const m = Mat4.createTranslation(1, 2, 3)
      expectVec3Components(m.getRight(),    [1, 0, 0])
      expectVec3Components(m.getUp(),       [0, 1, 0])
      expectVec3Components(m.getBackward(), [0, 0, 1])

      m.rotateAxisAngleV(Vec3.UnitZ, Math.PI * 0.5)
      expectVec3Components(m.getRight(),    [0, 1, 0])
      expectVec3Components(m.getUp(),       [-1, 0, 0])
      expectVec3Components(m.getBackward(), [0, 0, 1])

      m.rotateAxisAngleV(Vec3.UnitZ, Math.PI * 0.5)
      expectVec3Components(m.getRight(),    [-1, 0, 0])
      expectVec3Components(m.getUp(),       [0, -1, 0])
      expectVec3Components(m.getBackward(), [0, 0, 1])

      m.rotateAxisAngleV(Vec3.UnitZ, Math.PI * 0.5)
      expectVec3Components(m.getRight(),    [0, -1, 0])
      expectVec3Components(m.getUp(),       [1, 0, 0])
      expectVec3Components(m.getBackward(), [0, 0, 1])

      m.rotateAxisAngleV(Vec3.UnitZ, Math.PI * 0.5)
      expectVec3Components(m.getRight(),    [1, 0, 0])
      expectVec3Components(m.getUp(),       [0, 1, 0])
      expectVec3Components(m.getBackward(), [0, 0, 1])
    })
  })

  describe('#clone', () => {
    it ('copies a matrix', () => {
      const M1 = Mat4.create(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16)
      const M2 = M1.clone()
      expectComponents(M2, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16])
      expect(M1 === M2).toBe(false)
    })

    it ('copies to another instance', () => {
      const M1 = Mat4.create(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16)
      const M2 = new Mat4()
      const M3 = M1.clone(M2)
      expectComponents(M3, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16])
      expect(M1 === M2).toBe(false)
      expect(M2 === M3).toBe(true)
    })
  })

  describe('.clone', () => {
    it ('copies a matrix', () => {
      const M1 = Mat4.create(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16)
      const M2 = Mat4.clone(M1)
      expectComponents(M2, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16])
      expect(M1 === M2).toBe(false)
    })
  })

  describe('#equals', () => {
    it ('checks for equality', () => {
      let M1 = Mat4.create(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16)
      let M2 = Mat4.create(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16)
      expect(M1.equals(M2)).toBe(true)
      for (let i = 0; i < 16; i++) {
        M1 = Mat4.create(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16)
        M1.m[i] = 0
        expect(M1.equals(M2)).toBe(false)
      }
    })
  })

  describe('.equals', () => {
    it ('checks for equality', () => {
      let M1 = Mat4.create(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16)
      let M2 = Mat4.create(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16)
      expect(Mat4.equals(M1, M2)).toBe(true)
      for (let i = 0; i < 16; i++) {
        M1 = Mat4.create(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16)
        M1.m[i] = 0
        expect(Mat4.equals(M1, M2)).toBe(false)
      }
    })
  })

  describe('.lerp', () => {
    it ('interpolates the components', () => {
      const M1 = Mat4.create(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16)
      const M2 = Mat4.create(3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18)
      const M3 = Mat4.lerp(M1, M2, 0.5)
      expectComponents(M3, [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17])
    })
  })

  describe('.smooth', () => {
    it ('interpolates the components', () => {
      const M1 = Mat4.create(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16)
      const M2 = Mat4.create(3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18)
      const M3 = Mat4.smooth(M1, M2, 0.5)
      expectComponents(M3, [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17])
    })
  })

  describe('#transform', () => {
    it ('transforms V2', () => {
      expectVec2Components(Mat4.createRotationX(Math.PI * 0.5).transformV2(Vec2.create(1, 0)), [1, 0])
      expectVec2Components(Mat4.createRotationX(Math.PI * 0.5).transformV2(Vec2.create(0, 1)), [0, 0])
      expectVec2Components(Mat4.createRotationY(Math.PI * 0.5).transformV2(Vec2.create(1, 0)), [0, 0])
      expectVec2Components(Mat4.createRotationY(Math.PI * 0.5).transformV2(Vec2.create(0, 1)), [0, 1])
      expectVec2Components(Mat4.createRotationZ(Math.PI * 0.5).transformV2(Vec2.create(1, 0)), [0, 1])
      expectVec2Components(Mat4.createRotationZ(Math.PI * 0.5).transformV2(Vec2.create(0, 1)), [-1, 0])
      expectVec2Components(Mat4.createTranslation(1, 2, 3).transformV2(Vec2.create(0, 0)), [1, 2])
    })
    it ('transforms V3', () => {
      expectVec3Components(Mat4.createRotationX(Math.PI * 0.5).transformV3(Vec3.create(1, 0, 0)), [1,  0, 0])
      expectVec3Components(Mat4.createRotationX(Math.PI * 0.5).transformV3(Vec3.create(0, 1, 0)), [0,  0, 1])
      expectVec3Components(Mat4.createRotationX(Math.PI * 0.5).transformV3(Vec3.create(0, 0, 1)), [0, -1, 0])

      expectVec3Components(Mat4.createRotationY(Math.PI * 0.5).transformV3(Vec3.create(1, 0, 0)), [0, 0, -1])
      expectVec3Components(Mat4.createRotationY(Math.PI * 0.5).transformV3(Vec3.create(0, 1, 0)), [0, 1, 0])
      expectVec3Components(Mat4.createRotationY(Math.PI * 0.5).transformV3(Vec3.create(0, 0, 1)), [1, 0, 0])

      expectVec3Components(Mat4.createRotationZ(Math.PI * 0.5).transformV3(Vec3.create(1, 0, 0)), [ 0, 1, 0])
      expectVec3Components(Mat4.createRotationZ(Math.PI * 0.5).transformV3(Vec3.create(0, 1, 0)), [-1, 0, 0])
      expectVec3Components(Mat4.createRotationZ(Math.PI * 0.5).transformV3(Vec3.create(0, 0, 1)), [ 0, 0, 1])

      expectVec3Components(Mat4.createTranslation(1, 2, 3).transformV3(Vec3.create(0, 0, 0)), [1, 2, 3])
    })

    it ('transforms V4', () => {
      expectVec4Components(Mat4.createRotationX(Math.PI * 0.5).transformV4(Vec4.create(1, 0, 0, 0)), [1,  0, 0, 0])
      expectVec4Components(Mat4.createRotationX(Math.PI * 0.5).transformV4(Vec4.create(0, 1, 0, 0)), [0,  0, 1, 0])
      expectVec4Components(Mat4.createRotationX(Math.PI * 0.5).transformV4(Vec4.create(0, 0, 1, 0)), [0, -1, 0, 0])
      expectVec4Components(Mat4.createRotationX(Math.PI * 0.5).transformV4(Vec4.create(0, 0, 0, 1)), [0,  0, 0, 1])

      expectVec4Components(Mat4.createRotationY(Math.PI * 0.5).transformV4(Vec4.create(1, 0, 0, 0)), [0, 0, -1, 0])
      expectVec4Components(Mat4.createRotationY(Math.PI * 0.5).transformV4(Vec4.create(0, 1, 0, 0)), [0, 1,  0, 0])
      expectVec4Components(Mat4.createRotationY(Math.PI * 0.5).transformV4(Vec4.create(0, 0, 1, 0)), [1, 0,  0, 0])
      expectVec4Components(Mat4.createRotationY(Math.PI * 0.5).transformV4(Vec4.create(0, 0, 0, 1)), [0, 0,  0, 1])

      expectVec4Components(Mat4.createRotationZ(Math.PI * 0.5).transformV4(Vec4.create(1, 0, 0, 0)), [ 0, 1, 0, 0])
      expectVec4Components(Mat4.createRotationZ(Math.PI * 0.5).transformV4(Vec4.create(0, 1, 0, 0)), [-1, 0, 0, 0])
      expectVec4Components(Mat4.createRotationZ(Math.PI * 0.5).transformV4(Vec4.create(0, 0, 1, 0)), [ 0, 0, 1, 0])
      expectVec4Components(Mat4.createRotationZ(Math.PI * 0.5).transformV4(Vec4.create(0, 0, 0, 1)), [ 0, 0, 0, 1])

      expectVec4Components(Mat4.createTranslation(1, 2, 3).transformV4(Vec4.create(0, 0, 0, 1)), [1, 2, 3, 1])
    })
  })

  describe('#transformNormal', () => {
    it ('transforms V2', () => {
      expectVec2Components(Mat4.createRotationX(Math.PI * 0.5).transformV2Normal(Vec2.create(1, 0)), [1, 0])
      expectVec2Components(Mat4.createRotationX(Math.PI * 0.5).transformV2Normal(Vec2.create(0, 1)), [0, 0])
      expectVec2Components(Mat4.createRotationY(Math.PI * 0.5).transformV2Normal(Vec2.create(1, 0)), [0, 0])
      expectVec2Components(Mat4.createRotationY(Math.PI * 0.5).transformV2Normal(Vec2.create(0, 1)), [0, 1])
      expectVec2Components(Mat4.createRotationZ(Math.PI * 0.5).transformV2Normal(Vec2.create(1, 0)), [0, 1])
      expectVec2Components(Mat4.createRotationZ(Math.PI * 0.5).transformV2Normal(Vec2.create(0, 1)), [-1, 0])
      expectVec2Components(Mat4.createTranslation(1, 2, 3).transformV2Normal(Vec2.create(0, 0)), [0, 0])
    })
    it ('transforms V3', () => {
      expectVec3Components(Mat4.createRotationX(Math.PI * 0.5).transformV3Normal(Vec3.create(1, 0, 0)), [1,  0, 0])
      expectVec3Components(Mat4.createRotationX(Math.PI * 0.5).transformV3Normal(Vec3.create(0, 1, 0)), [0,  0, 1])
      expectVec3Components(Mat4.createRotationX(Math.PI * 0.5).transformV3Normal(Vec3.create(0, 0, 1)), [0, -1, 0])

      expectVec3Components(Mat4.createRotationY(Math.PI * 0.5).transformV3Normal(Vec3.create(1, 0, 0)), [0, 0, -1])
      expectVec3Components(Mat4.createRotationY(Math.PI * 0.5).transformV3Normal(Vec3.create(0, 1, 0)), [0, 1, 0])
      expectVec3Components(Mat4.createRotationY(Math.PI * 0.5).transformV3Normal(Vec3.create(0, 0, 1)), [1, 0, 0])

      expectVec3Components(Mat4.createRotationZ(Math.PI * 0.5).transformV3Normal(Vec3.create(1, 0, 0)), [ 0, 1, 0])
      expectVec3Components(Mat4.createRotationZ(Math.PI * 0.5).transformV3Normal(Vec3.create(0, 1, 0)), [-1, 0, 0])
      expectVec3Components(Mat4.createRotationZ(Math.PI * 0.5).transformV3Normal(Vec3.create(0, 0, 1)), [ 0, 0, 1])

      expectVec3Components(Mat4.createTranslation(1, 2, 3).transformV3Normal(Vec3.create(0, 0, 0)), [0, 0, 0])
    })

    it ('transforms V4', () => {
      expectVec4Components(Mat4.createRotationX(Math.PI * 0.5).transformV3Normal(Vec4.create(1, 0, 0, 0)), [1,  0, 0, 0])
      expectVec4Components(Mat4.createRotationX(Math.PI * 0.5).transformV3Normal(Vec4.create(0, 1, 0, 0)), [0,  0, 1, 0])
      expectVec4Components(Mat4.createRotationX(Math.PI * 0.5).transformV3Normal(Vec4.create(0, 0, 1, 0)), [0, -1, 0, 0])
      expectVec4Components(Mat4.createRotationX(Math.PI * 0.5).transformV3Normal(Vec4.create(0, 0, 0, 1)), [0,  0, 0, 1])

      expectVec4Components(Mat4.createRotationY(Math.PI * 0.5).transformV3Normal(Vec4.create(1, 0, 0, 0)), [0, 0, -1, 0])
      expectVec4Components(Mat4.createRotationY(Math.PI * 0.5).transformV3Normal(Vec4.create(0, 1, 0, 0)), [0, 1,  0, 0])
      expectVec4Components(Mat4.createRotationY(Math.PI * 0.5).transformV3Normal(Vec4.create(0, 0, 1, 0)), [1, 0,  0, 0])
      expectVec4Components(Mat4.createRotationY(Math.PI * 0.5).transformV3Normal(Vec4.create(0, 0, 0, 1)), [0, 0,  0, 1])

      expectVec4Components(Mat4.createRotationZ(Math.PI * 0.5).transformV3Normal(Vec4.create(1, 0, 0, 0)), [ 0, 1, 0, 0])
      expectVec4Components(Mat4.createRotationZ(Math.PI * 0.5).transformV3Normal(Vec4.create(0, 1, 0, 0)), [-1, 0, 0, 0])
      expectVec4Components(Mat4.createRotationZ(Math.PI * 0.5).transformV3Normal(Vec4.create(0, 0, 1, 0)), [ 0, 0, 1, 0])
      expectVec4Components(Mat4.createRotationZ(Math.PI * 0.5).transformV3Normal(Vec4.create(0, 0, 0, 1)), [ 0, 0, 0, 1])

      expectVec4Components(Mat4.createTranslation(1, 2, 3).transformV3Normal(Vec4.create(0, 0, 0, 1)), [0, 0, 0, 1])
    })
  })
})
