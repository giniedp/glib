import { describe, expect, it } from 'vitest'
import {
  IVec2,
  IVec4,
  Mat2,
  mat2,
  mat2$add,
  mat2$addScalar,
  mat2$divide,
  mat2$divideScalar,
  mat2$init,
  mat2$initAxisAngle,
  mat2$initAxisAngleValues,
  mat2$initFill,
  mat2$initFrom,
  mat2$initFromArray,
  mat2$initFromQuat,
  mat2$initFromQuatValues,
  mat2$initIdentity,
  mat2$initRotationX,
  mat2$initRotationY,
  mat2$initRotationZ,
  mat2$initRowMajor,
  mat2$initScale,
  mat2$initScaleUniform,
  mat2$initScaleXY,
  mat2$invert,
  mat2$multiply,
  mat2$multiplyScalar,
  mat2$negate,
  mat2$premultiply,
  mat2$preRotateByAxisAngle,
  mat2$preRotateByAxisAngleValues,
  mat2$preRotateByQuat,
  mat2$preRotateByQuatValues,
  mat2$preRotateX,
  mat2$preRotateY,
  mat2$preRotateZ,
  mat2$preScale,
  mat2$preScaleX,
  mat2$preScaleXY,
  mat2$preScaleY,
  mat2$rotateByAxisAngle,
  mat2$rotateByAxisAngleValues,
  mat2$rotateByQuat,
  mat2$rotateByQuatValues,
  mat2$rotateX,
  mat2$rotateY,
  mat2$rotateZ,
  mat2$scale,
  mat2$scaleUniform,
  mat2$scaleX,
  mat2$scaleXY,
  mat2$scaleY,
  mat2$setScale,
  mat2$setScaleX,
  mat2$setScaleXY,
  mat2$setScaleY,
  mat2$subtract,
  mat2$subtractScalar,
  mat2$transpose,
  mat2Add,
  mat2AddScalar,
  mat2Copy,
  mat2Create,
  mat2CreateAxisAngle,
  mat2CreateAxisAngleValues,
  mat2CreateFill,
  mat2CreateFrom,
  mat2CreateFromArray,
  mat2CreateFromQuat,
  mat2CreateFromQuatValues,
  mat2CreateIdentity,
  mat2CreateRotationX,
  mat2CreateRotationY,
  mat2CreateRotationZ,
  mat2CreateRowMajor,
  mat2CreateScale,
  mat2CreateScaleUniform,
  mat2CreateScaleXY,
  mat2Determinant,
  mat2Divide,
  mat2DivideScalar,
  mat2Equals,
  mat2Format,
  mat2GetScale,
  mat2Identity,
  mat2Invert,
  mat2Lerp,
  mat2Multiply,
  mat2MultiplyScalar,
  mat2Negate,
  mat2Premultiply,
  mat2Smooth,
  mat2Subtract,
  mat2SubtractScalar,
  mat2ToArray,
  mat2TransformVec2Array,
  mat2Transpose,
  vec2,
  vec2TransformByMat2,
} from './index'

describe('mat2', () => {
  function expectComponents(m: Mat2, parts: number[], precision: number = 5) {
    expect(m[0], 'component 0').toBeCloseTo(parts[0], precision)
    expect(m[1], 'component 1').toBeCloseTo(parts[1], precision)
    expect(m[2], 'component 2').toBeCloseTo(parts[2], precision)
    expect(m[3], 'component 3').toBeCloseTo(parts[3], precision)
  }

  function expectEquality(m1: Mat2, m2: Mat2, precision: number = 5) {
    expectComponents(m1, Array.from(m2), precision)
  }

  function expectVec2(v: IVec2, x: number, y: number, precision: number = 5) {
    expect(v.x, 'x component').toBeCloseTo(x, precision)
    expect(v.y, 'y component').toBeCloseTo(y, precision)
  }

  function transform(m: Mat2, x: number, y: number) {
    return vec2TransformByMat2(vec2(x, y), m)
  }

  // matrix with distinct components in column major order
  const sample = () => mat2Create(1, 2, 3, 4)
  // 90 degree rotation around the y axis
  const angle = Math.PI * 0.5
  const axis = { x: 0, y: 1, z: 0 }
  const quat: IVec4 = { x: 0, y: Math.SQRT1_2, z: 0, w: Math.SQRT1_2 }

  describe('mat2', () => {
    it('creates zero matrix', () => {
      expectComponents(mat2(), [0, 0, 0, 0])
    })
    it('creates new instance', () => {
      expect(mat2()).not.toBe(mat2())
    })
  })

  describe('mat2Identity', () => {
    it('creates identity matrix', () => {
      expectComponents(mat2Identity(), [1, 0, 0, 1])
    })
  })

  describe('mat2$init', () => {
    it('sets components in column major order', () => {
      expectComponents(mat2$init(mat2(), 1, 2, 3, 4), [1, 2, 3, 4])
    })
    it('returns out', () => {
      const out = mat2()
      expect(mat2$init(out, 1, 2, 3, 4)).toBe(out)
    })
  })

  describe('mat2Create', () => {
    it('creates matrix in column major order', () => {
      expectComponents(mat2Create(1, 2, 3, 4), [1, 2, 3, 4])
    })
  })

  describe('mat2$initRowMajor', () => {
    it('sets components in row major order', () => {
      expectComponents(mat2$initRowMajor(mat2(), 1, 2, 3, 4), [1, 3, 2, 4])
    })
    it('returns out', () => {
      const out = mat2()
      expect(mat2$initRowMajor(out, 1, 2, 3, 4)).toBe(out)
    })
  })

  describe('mat2CreateRowMajor', () => {
    it('creates matrix in row major order', () => {
      expectComponents(mat2CreateRowMajor(1, 2, 3, 4), [1, 3, 2, 4])
    })
  })

  describe('mat2$initFill', () => {
    it('sets all components', () => {
      expectComponents(mat2$initFill(mat2(), 2), [2, 2, 2, 2])
    })
    it('returns out', () => {
      const out = mat2()
      expect(mat2$initFill(out, 2)).toBe(out)
    })
  })

  describe('mat2CreateFill', () => {
    it('creates filled matrix', () => {
      expectComponents(mat2CreateFill(2), [2, 2, 2, 2])
    })
  })

  describe('mat2$initIdentity', () => {
    it('sets identity', () => {
      expectComponents(mat2$initIdentity(mat2CreateFill(2)), [1, 0, 0, 1])
    })
    it('returns out', () => {
      const out = mat2()
      expect(mat2$initIdentity(out)).toBe(out)
    })
  })

  describe('mat2CreateIdentity', () => {
    it('creates identity matrix', () => {
      expectComponents(mat2CreateIdentity(), [1, 0, 0, 1])
    })
    it('creates new instance', () => {
      expect(mat2CreateIdentity()).not.toBe(mat2CreateIdentity())
    })
  })

  describe('mat2$initFrom', () => {
    it('copies components', () => {
      expectComponents(mat2$initFrom(mat2(), sample()), [1, 2, 3, 4])
    })
    it('returns out', () => {
      const out = mat2()
      expect(mat2$initFrom(out, sample())).toBe(out)
    })
  })

  describe('mat2CreateFrom', () => {
    it('creates copy', () => {
      const m = sample()
      const result = mat2CreateFrom(m)
      expectComponents(result, [1, 2, 3, 4])
      expect(result).not.toBe(m)
    })
  })

  describe('mat2$initFromArray', () => {
    it('reads components', () => {
      expectComponents(mat2$initFromArray(mat2(), [1, 2, 3, 4]), [1, 2, 3, 4])
    })
    it('reads from offset', () => {
      expectComponents(mat2$initFromArray(mat2(), [0, 0, 1, 2, 3, 4], 2), [1, 2, 3, 4])
    })
    it('returns out', () => {
      const out = mat2()
      expect(mat2$initFromArray(out, [1, 2, 3, 4])).toBe(out)
    })
  })

  describe('mat2CreateFromArray', () => {
    it('reads from offset', () => {
      expectComponents(mat2CreateFromArray([0, 0, 1, 2, 3, 4], 2), [1, 2, 3, 4])
    })
  })

  describe('mat2$initFromQuat', () => {
    it('sets rotation', () => {
      expectVec2(transform(mat2$initFromQuat(mat2(), quat), 1, 1), 0, 1)
    })
    it('returns out', () => {
      const out = mat2()
      expect(mat2$initFromQuat(out, quat)).toBe(out)
    })
  })

  describe('mat2$initFromQuatValues', () => {
    it('sets rotation', () => {
      const m = mat2$initFromQuatValues(mat2(), quat.x, quat.y, quat.z, quat.w)
      expectVec2(transform(m, 1, 1), 0, 1)
    })
  })

  describe('mat2CreateFromQuat', () => {
    it('creates rotation', () => {
      expectVec2(transform(mat2CreateFromQuat(quat), 1, 1), 0, 1)
    })
  })

  describe('mat2CreateFromQuatValues', () => {
    it('creates rotation', () => {
      expectVec2(transform(mat2CreateFromQuatValues(quat.x, quat.y, quat.z, quat.w), 1, 1), 0, 1)
    })
  })

  describe('mat2$initAxisAngle', () => {
    it('sets rotation', () => {
      expectVec2(transform(mat2$initAxisAngle(mat2(), axis, angle), 1, 1), 0, 1)
    })
    it('returns out', () => {
      const out = mat2()
      expect(mat2$initAxisAngle(out, axis, angle)).toBe(out)
    })
  })

  describe('mat2$initAxisAngleValues', () => {
    it('sets rotation', () => {
      expectVec2(transform(mat2$initAxisAngleValues(mat2(), 0, 1, 0, angle), 1, 1), 0, 1)
    })
  })

  describe('mat2CreateAxisAngle', () => {
    it('creates rotation', () => {
      expectVec2(transform(mat2CreateAxisAngle(axis, angle), 1, 1), 0, 1)
    })
  })

  describe('mat2CreateAxisAngleValues', () => {
    it('creates rotation', () => {
      expectVec2(transform(mat2CreateAxisAngleValues(0, 1, 0, angle), 1, 1), 0, 1)
    })
  })

  describe('mat2$initRotationX', () => {
    it('sets rotation', () => {
      expectVec2(transform(mat2$initRotationX(mat2(), angle), 0, 1), 0, 0)
    })
    it('returns out', () => {
      const out = mat2()
      expect(mat2$initRotationX(out, angle)).toBe(out)
    })
  })

  describe('mat2CreateRotationX', () => {
    it('creates rotation', () => {
      expectVec2(transform(mat2CreateRotationX(angle), 0, 1), 0, 0)
    })
  })

  describe('mat2$initRotationY', () => {
    it('sets rotation', () => {
      expectVec2(transform(mat2$initRotationY(mat2(), angle), 1, 0), 0, 0)
    })
    it('returns out', () => {
      const out = mat2()
      expect(mat2$initRotationY(out, angle)).toBe(out)
    })
  })

  describe('mat2CreateRotationY', () => {
    it('creates rotation', () => {
      expectVec2(transform(mat2CreateRotationY(angle), 1, 0), 0, 0)
    })
  })

  describe('mat2$initRotationZ', () => {
    it('sets rotation', () => {
      expectVec2(transform(mat2$initRotationZ(mat2(), angle), 1, 0), 0, 1)
    })
    it('returns out', () => {
      const out = mat2()
      expect(mat2$initRotationZ(out, angle)).toBe(out)
    })
  })

  describe('mat2CreateRotationZ', () => {
    it('creates rotation', () => {
      expectVec2(transform(mat2CreateRotationZ(angle), 1, 0), 0, 1)
    })
  })

  describe('mat2$initScale', () => {
    it('sets scale', () => {
      expectComponents(mat2$initScale(sample(), vec2(1, 2)), [1, 0, 0, 2])
    })
    it('returns out', () => {
      const out = mat2()
      expect(mat2$initScale(out, vec2(1, 2))).toBe(out)
    })
  })

  describe('mat2$initScaleXY', () => {
    it('sets scale', () => {
      expectComponents(mat2$initScaleXY(sample(), 1, 2), [1, 0, 0, 2])
    })
  })

  describe('mat2$initScaleUniform', () => {
    it('sets scale', () => {
      expectComponents(mat2$initScaleUniform(sample(), 2), [2, 0, 0, 2])
    })
  })

  describe('mat2CreateScale', () => {
    it('creates scale', () => {
      expectVec2(transform(mat2CreateScale(vec2(1, 2)), 1, 2), 1, 4)
    })
  })

  describe('mat2CreateScaleXY', () => {
    it('creates scale', () => {
      expectVec2(transform(mat2CreateScaleXY(1, 2), 1, 2), 1, 4)
    })
  })

  describe('mat2CreateScaleUniform', () => {
    it('creates scale', () => {
      expectVec2(transform(mat2CreateScaleUniform(2), 1, 2), 2, 4)
    })
  })

  describe('rotate', () => {
    // rotate multiplies from the right: M * R
    // preRotate multiplies from the left: R * M
    // uses the z axis, so the rotation matrix is not symmetric
    const a = 0.7
    const q: IVec4 = { x: 0, y: 0, z: Math.sin(a / 2), w: Math.cos(a / 2) }
    const cases: Array<[string, (m: Mat2) => Mat2, (m: Mat2) => Mat2, Mat2]> = [
      ['X', (m) => mat2$rotateX(m, a), (m) => mat2$preRotateX(m, a), mat2CreateRotationX(a)],
      ['Y', (m) => mat2$rotateY(m, a), (m) => mat2$preRotateY(m, a), mat2CreateRotationY(a)],
      ['Z', (m) => mat2$rotateZ(m, a), (m) => mat2$preRotateZ(m, a), mat2CreateRotationZ(a)],
      ['ByQuat', (m) => mat2$rotateByQuat(m, q), (m) => mat2$preRotateByQuat(m, q), mat2CreateRotationZ(a)],
      [
        'ByQuatValues',
        (m) => mat2$rotateByQuatValues(m, q.x, q.y, q.z, q.w),
        (m) => mat2$preRotateByQuatValues(m, q.x, q.y, q.z, q.w),
        mat2CreateRotationZ(a),
      ],
      [
        'ByAxisAngle',
        (m) => mat2$rotateByAxisAngle(m, { x: 0, y: 0, z: 1 }, a),
        (m) => mat2$preRotateByAxisAngle(m, { x: 0, y: 0, z: 1 }, a),
        mat2CreateRotationZ(a),
      ],
      [
        'ByAxisAngleValues',
        (m) => mat2$rotateByAxisAngleValues(m, 0, 0, 1, a),
        (m) => mat2$preRotateByAxisAngleValues(m, 0, 0, 1, a),
        mat2CreateRotationZ(a),
      ],
    ]

    for (const [name, rotate, preRotate, rotation] of cases) {
      describe(`mat2$rotate${name}`, () => {
        it('multiplies rotation from the right', () => {
          expectEquality(rotate(sample()), mat2Multiply(sample(), rotation))
        })
        it('returns out', () => {
          const out = sample()
          expect(rotate(out)).toBe(out)
        })
      })

      describe(`mat2$preRotate${name}`, () => {
        it('multiplies rotation from the left', () => {
          expectEquality(preRotate(sample()), mat2Multiply(rotation, sample()))
        })
        it('returns out', () => {
          const out = sample()
          expect(preRotate(out)).toBe(out)
        })
      })
    }
  })

  describe('scale', () => {
    // scale multiplies from the right: M * S
    // preScale multiplies from the left: S * M
    const cases: Array<[string, (m: Mat2) => Mat2, Mat2]> = [
      ['mat2$scale', (m) => mat2$scale(m, vec2(2, 3)), mat2CreateScaleXY(2, 3)],
      ['mat2$scaleXY', (m) => mat2$scaleXY(m, 2, 3), mat2CreateScaleXY(2, 3)],
      ['mat2$scaleX', (m) => mat2$scaleX(m, 2), mat2CreateScaleXY(2, 1)],
      ['mat2$scaleY', (m) => mat2$scaleY(m, 3), mat2CreateScaleXY(1, 3)],
      ['mat2$scaleUniform', (m) => mat2$scaleUniform(m, 2), mat2CreateScaleXY(2, 2)],
    ]
    const preCases: Array<[string, (m: Mat2) => Mat2, Mat2]> = [
      ['mat2$preScale', (m) => mat2$preScale(m, vec2(2, 3)), mat2CreateScaleXY(2, 3)],
      ['mat2$preScaleXY', (m) => mat2$preScaleXY(m, 2, 3), mat2CreateScaleXY(2, 3)],
      ['mat2$preScaleX', (m) => mat2$preScaleX(m, 2), mat2CreateScaleXY(2, 1)],
      ['mat2$preScaleY', (m) => mat2$preScaleY(m, 3), mat2CreateScaleXY(1, 3)],
    ]

    for (const [name, scale, scaling] of cases) {
      describe(name, () => {
        it('multiplies scale from the right', () => {
          expectEquality(scale(sample()), mat2Multiply(sample(), scaling))
        })
        it('returns out', () => {
          const out = sample()
          expect(scale(out)).toBe(out)
        })
      })
    }

    for (const [name, preScale, scaling] of preCases) {
      describe(name, () => {
        it('multiplies scale from the left', () => {
          expectEquality(preScale(sample()), mat2Multiply(scaling, sample()))
        })
        it('returns out', () => {
          const out = sample()
          expect(preScale(out)).toBe(out)
        })
      })
    }
  })

  describe('mat2GetScale', () => {
    it('gets scale', () => {
      expectVec2(mat2GetScale(sample()), 1, 4)
    })
    it('writes to out', () => {
      const out = vec2()
      expect(mat2GetScale(sample(), out)).toBe(out)
      expectVec2(out, 1, 4)
    })
  })

  describe('mat2$setScale', () => {
    it('sets scale', () => {
      expectComponents(mat2$setScale(sample(), vec2(21, 22)), [21, 2, 3, 22])
    })
    it('returns out', () => {
      const out = sample()
      expect(mat2$setScale(out, vec2(21, 22))).toBe(out)
    })
  })

  describe('mat2$setScaleXY', () => {
    it('sets scale', () => {
      expectComponents(mat2$setScaleXY(sample(), 21, 22), [21, 2, 3, 22])
    })
  })

  describe('mat2$setScaleX', () => {
    it('sets x scale', () => {
      expectComponents(mat2$setScaleX(sample(), 21), [21, 2, 3, 4])
    })
  })

  describe('mat2$setScaleY', () => {
    it('sets y scale', () => {
      expectComponents(mat2$setScaleY(sample(), 22), [1, 2, 3, 22])
    })
  })

  describe('mat2Copy', () => {
    it('copies components', () => {
      const m = sample()
      const result = mat2Copy(m)
      expectComponents(result, [1, 2, 3, 4])
      expect(result).not.toBe(m)
    })
    it('writes to out', () => {
      const out = mat2()
      expect(mat2Copy(sample(), out)).toBe(out)
      expectComponents(out, [1, 2, 3, 4])
    })
  })

  describe('mat2Equals', () => {
    it('compares components', () => {
      expect(mat2Equals(sample(), sample())).toBe(true)
      for (let i = 0; i < 4; i++) {
        const other = sample()
        other[i] = 100
        expect(mat2Equals(sample(), other), `component ${i}`).toBe(false)
      }
    })
  })

  describe('mat2Determinant', () => {
    it('calculates determinant', () => {
      expect(mat2Determinant(mat2CreateRowMajor(8, -10, -2, 0))).toBeCloseTo(-20)
    })
  })

  describe('mat2$transpose', () => {
    it('transposes in place', () => {
      expectComponents(mat2$transpose(sample()), [1, 3, 2, 4])
    })
    it('returns out', () => {
      const out = sample()
      expect(mat2$transpose(out)).toBe(out)
    })
  })

  describe('mat2Transpose', () => {
    it('transposes', () => {
      const m = sample()
      expectComponents(mat2Transpose(m), [1, 3, 2, 4])
      expectComponents(m, [1, 2, 3, 4])
    })
    it('writes to out', () => {
      const out = mat2()
      expect(mat2Transpose(sample(), out)).toBe(out)
    })
  })

  describe('mat2$invert', () => {
    it('inverts in place', () => {
      expectComponents(mat2$invert(mat2CreateRowMajor(8, -10, -2, 0)), [0, -0.1, -0.5, -0.4])
    })
    it('returns out', () => {
      const out = sample()
      expect(mat2$invert(out)).toBe(out)
    })
  })

  describe('mat2Invert', () => {
    it('inverts', () => {
      expectComponents(mat2Invert(mat2CreateRowMajor(8, -10, -2, 0)), [0, -0.1, -0.5, -0.4])
    })
    it('inverts twice to original', () => {
      const m = mat2CreateRowMajor(8, -10, -2, 0)
      expectEquality(mat2Invert(mat2Invert(m)), m)
    })
    it('writes to out', () => {
      const out = mat2()
      expect(mat2Invert(sample(), out)).toBe(out)
    })
  })

  describe('mat2$negate', () => {
    it('negates in place', () => {
      expectComponents(mat2$negate(sample()), [-1, -2, -3, -4])
    })
    it('returns out', () => {
      const out = sample()
      expect(mat2$negate(out)).toBe(out)
    })
  })

  describe('mat2Negate', () => {
    it('negates', () => {
      expectComponents(mat2Negate(sample()), [-1, -2, -3, -4])
    })
    it('writes to out', () => {
      const out = mat2()
      expect(mat2Negate(sample(), out)).toBe(out)
    })
  })

  describe('mat2$add', () => {
    it('adds in place', () => {
      expectComponents(mat2$add(sample(), sample()), [2, 4, 6, 8])
    })
    it('returns out', () => {
      const out = sample()
      expect(mat2$add(out, sample())).toBe(out)
    })
  })

  describe('mat2Add', () => {
    it('adds', () => {
      expectComponents(mat2Add(sample(), sample()), [2, 4, 6, 8])
    })
    it('writes to out', () => {
      const out = mat2()
      expect(mat2Add(sample(), sample(), out)).toBe(out)
    })
  })

  describe('mat2$addScalar', () => {
    it('adds in place', () => {
      expectComponents(mat2$addScalar(sample(), 10), [11, 12, 13, 14])
    })
    it('returns out', () => {
      const out = sample()
      expect(mat2$addScalar(out, 10)).toBe(out)
    })
  })

  describe('mat2AddScalar', () => {
    it('adds', () => {
      expectComponents(mat2AddScalar(sample(), 10), [11, 12, 13, 14])
    })
    it('writes to out', () => {
      const out = mat2()
      expect(mat2AddScalar(sample(), 10, out)).toBe(out)
    })
  })

  describe('mat2$subtract', () => {
    it('subtracts in place', () => {
      expectComponents(mat2$subtract(sample(), mat2CreateFill(1)), [0, 1, 2, 3])
    })
    it('returns out', () => {
      const out = sample()
      expect(mat2$subtract(out, sample())).toBe(out)
    })
  })

  describe('mat2Subtract', () => {
    it('subtracts', () => {
      expectComponents(mat2Subtract(sample(), mat2CreateFill(1)), [0, 1, 2, 3])
    })
    it('writes to out', () => {
      const out = mat2()
      expect(mat2Subtract(sample(), sample(), out)).toBe(out)
    })
  })

  describe('mat2$subtractScalar', () => {
    it('subtracts in place', () => {
      expectComponents(mat2$subtractScalar(sample(), 10), [-9, -8, -7, -6])
    })
    it('returns out', () => {
      const out = sample()
      expect(mat2$subtractScalar(out, 10)).toBe(out)
    })
  })

  describe('mat2SubtractScalar', () => {
    it('subtracts', () => {
      expectComponents(mat2SubtractScalar(sample(), 10), [-9, -8, -7, -6])
    })
    it('writes to out', () => {
      const out = mat2()
      expect(mat2SubtractScalar(sample(), 10, out)).toBe(out)
    })
  })

  describe('mat2$multiplyScalar', () => {
    it('multiplies in place', () => {
      expectComponents(mat2$multiplyScalar(sample(), 10), [10, 20, 30, 40])
    })
    it('returns out', () => {
      const out = sample()
      expect(mat2$multiplyScalar(out, 10)).toBe(out)
    })
  })

  describe('mat2MultiplyScalar', () => {
    it('multiplies', () => {
      expectComponents(mat2MultiplyScalar(sample(), 10), [10, 20, 30, 40])
    })
    it('writes to out', () => {
      const out = mat2()
      expect(mat2MultiplyScalar(sample(), 10, out)).toBe(out)
    })
  })

  describe('mat2$divide', () => {
    it('divides in place', () => {
      expectComponents(mat2$divide(sample(), mat2CreateFill(2)), [0.5, 1, 1.5, 2])
    })
    it('returns out', () => {
      const out = sample()
      expect(mat2$divide(out, sample())).toBe(out)
    })
  })

  describe('mat2Divide', () => {
    it('divides', () => {
      expectComponents(mat2Divide(sample(), mat2CreateFill(2)), [0.5, 1, 1.5, 2])
    })
    it('writes to out', () => {
      const out = mat2()
      expect(mat2Divide(sample(), sample(), out)).toBe(out)
    })
  })

  describe('mat2$divideScalar', () => {
    it('divides in place', () => {
      expectComponents(mat2$divideScalar(sample(), 10), [0.1, 0.2, 0.3, 0.4])
    })
    it('returns out', () => {
      const out = sample()
      expect(mat2$divideScalar(out, 10)).toBe(out)
    })
  })

  describe('mat2DivideScalar', () => {
    it('divides', () => {
      expectComponents(mat2DivideScalar(sample(), 10), [0.1, 0.2, 0.3, 0.4])
    })
    it('writes to out', () => {
      const out = mat2()
      expect(mat2DivideScalar(sample(), 10, out)).toBe(out)
    })
  })

  describe('mat2Multiply', () => {
    it('A * inv(A) is identity', () => {
      const a = mat2CreateRowMajor(8, -10, -2, 0)
      expectEquality(mat2Multiply(a, mat2Invert(a)), mat2CreateIdentity())
    })
    it('multiply(A, B) transforms like A * B', () => {
      const a = mat2CreateRotationZ(angle)
      const b = mat2CreateScaleXY(1, 2)
      const v = transform(mat2Multiply(a, b), 1, 1)
      const expected = vec2TransformByMat2(transform(b, 1, 1), a)
      expectVec2(v, expected.x, expected.y)
    })
    it('writes to out', () => {
      const out = mat2()
      expect(mat2Multiply(sample(), sample(), out)).toBe(out)
    })
  })

  describe('mat2$multiply', () => {
    it('multiplies in place: A = A * B', () => {
      const a = mat2CreateRotationZ(angle)
      const b = mat2CreateScaleXY(1, 2)
      expectEquality(mat2$multiply(mat2Copy(a), b), mat2Multiply(a, b))
    })
    it('returns out', () => {
      const out = sample()
      expect(mat2$multiply(out, sample())).toBe(out)
    })
  })

  describe('mat2Premultiply', () => {
    it('premultiply(A, B) is B * A', () => {
      const a = mat2CreateRotationZ(angle)
      const b = mat2CreateScaleXY(1, 2)
      expectEquality(mat2Premultiply(a, b), mat2Multiply(b, a))
    })
    it('writes to out', () => {
      const out = mat2()
      expect(mat2Premultiply(sample(), sample(), out)).toBe(out)
    })
  })

  describe('mat2$premultiply', () => {
    it('multiplies in place: A = B * A', () => {
      const a = mat2CreateRotationZ(angle)
      const b = mat2CreateScaleXY(1, 2)
      expectEquality(mat2$premultiply(mat2Copy(a), b), mat2Multiply(b, a))
    })
    it('returns out', () => {
      const out = sample()
      expect(mat2$premultiply(out, sample())).toBe(out)
    })
  })

  describe('mat2Lerp', () => {
    it('interpolates components', () => {
      expectComponents(mat2Lerp(mat2Create(1, 2, 3, 4), mat2Create(3, 4, 5, 6), 0.5), [2, 3, 4, 5])
    })
    it('writes to out', () => {
      const out = mat2()
      expect(mat2Lerp(sample(), sample(), 0.5, out)).toBe(out)
    })
  })

  describe('mat2Smooth', () => {
    it('interpolates components', () => {
      expectComponents(mat2Smooth(mat2Create(1, 2, 3, 4), mat2Create(3, 4, 5, 6), 0.5), [2, 3, 4, 5])
    })
    it('clamps t to [0, 1]', () => {
      expectComponents(mat2Smooth(mat2Create(1, 2, 3, 4), mat2Create(3, 4, 5, 6), 2), [3, 4, 5, 6])
      expectComponents(mat2Smooth(mat2Create(1, 2, 3, 4), mat2Create(3, 4, 5, 6), -1), [1, 2, 3, 4])
    })
  })

  describe('mat2TransformVec2Array', () => {
    it('transforms all vectors', () => {
      const array = [1, 0, 1, 0, 1, 0]
      mat2TransformVec2Array(mat2CreateRotationZ(angle), array)
      array.forEach((v, i) => expect(v, `index ${i}`).toBeCloseTo([0, 1, 0, 1, 0, 1][i], 5))
    })
    it('uses offset, stride and count', () => {
      const array = [9, 1, 0, 9, 1, 0, 9, 1, 0]
      mat2TransformVec2Array(mat2CreateRotationZ(angle), array, 1, 3, 2)
      array.forEach((v, i) => expect(v, `index ${i}`).toBeCloseTo([9, 0, 1, 9, 0, 1, 9, 1, 0][i], 5))
    })
    it('returns the array', () => {
      const array = [1, 0]
      expect(mat2TransformVec2Array(sample(), array)).toBe(array)
    })
  })

  describe('mat2Format', () => {
    it('formats rows', () => {
      expect(mat2Format(sample())).toBe('1.00000,3.00000\n2.00000,4.00000')
    })
  })

  describe('mat2ToArray', () => {
    it('creates array', () => {
      expect(mat2ToArray(sample())).toEqual([1, 2, 3, 4])
    })
    it('writes at offset', () => {
      expect(mat2ToArray(sample(), [], 2)).toEqual([undefined, undefined, 1, 2, 3, 4])
    })
  })
})
