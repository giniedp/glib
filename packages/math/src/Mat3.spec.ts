import { describe, expect, it } from 'vitest'
import {
  IVec3,
  IVec4,
  Mat3,
  mat3,
  mat3$add,
  mat3$addScalar,
  mat3$divide,
  mat3$divideScalar,
  mat3$init,
  mat3$initAxisAngle,
  mat3$initAxisAngleValues,
  mat3$initFill,
  mat3$initFrom,
  mat3$initFromArray,
  mat3$initFromQuat,
  mat3$initFromQuatValues,
  mat3$initIdentity,
  mat3$initOrientation,
  mat3$initRotationX,
  mat3$initRotationY,
  mat3$initRotationZ,
  mat3$initRowMajor,
  mat3$initScale,
  mat3$initScaleUniform,
  mat3$initScaleXYZ,
  mat3$initYawPitchRoll,
  mat3$invert,
  mat3$multiply,
  mat3$multiplyScalar,
  mat3$negate,
  mat3$premultiply,
  mat3$preRotateByAxisAngle,
  mat3$preRotateByAxisAngleValues,
  mat3$preRotateByQuat,
  mat3$preRotateByQuatValues,
  mat3$preRotateX,
  mat3$preRotateY,
  mat3$preRotateYawPitchRoll,
  mat3$preRotateZ,
  mat3$preScale,
  mat3$preScaleX,
  mat3$preScaleXYZ,
  mat3$preScaleY,
  mat3$preScaleZ,
  mat3$rotateByAxisAngle,
  mat3$rotateByAxisAngleValues,
  mat3$rotateByQuat,
  mat3$rotateByQuatValues,
  mat3$rotateX,
  mat3$rotateY,
  mat3$rotateYawPitchRoll,
  mat3$rotateZ,
  mat3$scale,
  mat3$scaleUniform,
  mat3$scaleX,
  mat3$scaleXYZ,
  mat3$scaleY,
  mat3$scaleZ,
  mat3$setBackward,
  mat3$setDown,
  mat3$setForward,
  mat3$setLeft,
  mat3$setRight,
  mat3$setScale,
  mat3$setScaleX,
  mat3$setScaleXYZ,
  mat3$setScaleY,
  mat3$setScaleZ,
  mat3$setUp,
  mat3$subtract,
  mat3$subtractScalar,
  mat3$transpose,
  mat3Add,
  mat3AddScalar,
  mat3Copy,
  mat3Create,
  mat3CreateAxisAngle,
  mat3CreateAxisAngleValues,
  mat3CreateFill,
  mat3CreateFrom,
  mat3CreateFromArray,
  mat3CreateFromQuat,
  mat3CreateFromQuatValues,
  mat3CreateIdentity,
  mat3CreateOrientation,
  mat3CreateRotationX,
  mat3CreateRotationY,
  mat3CreateRotationZ,
  mat3CreateRowMajor,
  mat3CreateScale,
  mat3CreateScaleUniform,
  mat3CreateScaleXYZ,
  mat3CreateYawPitchRoll,
  mat3Determinant,
  mat3Divide,
  mat3DivideScalar,
  mat3Equals,
  mat3Format,
  mat3GetBackward,
  mat3GetDown,
  mat3GetForward,
  mat3GetLeft,
  mat3GetRight,
  mat3GetScale,
  mat3GetUp,
  mat3Invert,
  mat3Lerp,
  mat3Multiply,
  mat3MultiplyScalar,
  mat3Negate,
  mat3Premultiply,
  mat3Smooth,
  mat3Subtract,
  mat3SubtractScalar,
  mat3ToArray,
  mat3TransformVec2Array,
  mat3TransformVec3Array,
  mat3Transpose,
  vec3,
  vec3ApplyMat3,
} from './index'

describe('mat3', () => {
  function expectComponents(m: Mat3, parts: number[], precision: number = 5) {
    for (let i = 0; i < 9; i++) {
      expect(m[i], `component ${i}`).toBeCloseTo(parts[i], precision)
    }
  }

  function expectEquality(m1: Mat3, m2: Mat3, precision: number = 5) {
    expectComponents(m1, Array.from(m2), precision)
  }

  function expectVec3(v: IVec3, x: number, y: number, z: number, precision: number = 5) {
    expect(v.x, 'x component').toBeCloseTo(x, precision)
    expect(v.y, 'y component').toBeCloseTo(y, precision)
    expect(v.z, 'z component').toBeCloseTo(z, precision)
  }

  function expectArray(actual: number[], expected: number[], precision: number = 5) {
    expect(actual.length).toBe(expected.length)
    actual.forEach((v, i) => expect(v, `index ${i}`).toBeCloseTo(expected[i], precision))
  }

  function transform(m: Mat3, x: number, y: number, z: number) {
    return vec3ApplyMat3(vec3(x, y, z), m)
  }

  // matrix with distinct components in column major order
  const sample = () => mat3Create(1, 2, 3, 4, 5, 6, 7, 8, 9)
  // invertible matrix with determinant 12
  const invertible = () => mat3CreateRowMajor(-1, 5, -2, -5, 0, 1, -2, 2, 0)
  // 90 degree rotation around the y axis
  const angle = Math.PI * 0.5
  const axis = { x: 0, y: 1, z: 0 }
  const quat: IVec4 = { x: 0, y: Math.SQRT1_2, z: 0, w: Math.SQRT1_2 }

  describe('mat3', () => {
    it('creates zero matrix', () => {
      expectComponents(mat3(), [0, 0, 0, 0, 0, 0, 0, 0, 0])
    })
    it('creates new instance', () => {
      expect(mat3()).not.toBe(mat3())
    })
  })

  describe('mat3$init', () => {
    it('sets components in column major order', () => {
      expectComponents(mat3$init(mat3(), 1, 2, 3, 4, 5, 6, 7, 8, 9), [1, 2, 3, 4, 5, 6, 7, 8, 9])
    })
    it('returns out', () => {
      const out = mat3()
      expect(mat3$init(out, 1, 2, 3, 4, 5, 6, 7, 8, 9)).toBe(out)
    })
  })

  describe('mat3Create', () => {
    it('creates matrix in column major order', () => {
      expectComponents(mat3Create(1, 2, 3, 4, 5, 6, 7, 8, 9), [1, 2, 3, 4, 5, 6, 7, 8, 9])
    })
  })

  describe('mat3$initRowMajor', () => {
    it('sets components in row major order', () => {
      expectComponents(mat3$initRowMajor(mat3(), 1, 2, 3, 4, 5, 6, 7, 8, 9), [1, 4, 7, 2, 5, 8, 3, 6, 9])
    })
    it('returns out', () => {
      const out = mat3()
      expect(mat3$initRowMajor(out, 1, 2, 3, 4, 5, 6, 7, 8, 9)).toBe(out)
    })
  })

  describe('mat3CreateRowMajor', () => {
    it('creates matrix in row major order', () => {
      expectComponents(mat3CreateRowMajor(1, 2, 3, 4, 5, 6, 7, 8, 9), [1, 4, 7, 2, 5, 8, 3, 6, 9])
    })
  })

  describe('mat3$initFill', () => {
    it('sets all components', () => {
      expectComponents(mat3$initFill(mat3(), 2), [2, 2, 2, 2, 2, 2, 2, 2, 2])
    })
    it('returns out', () => {
      const out = mat3()
      expect(mat3$initFill(out, 2)).toBe(out)
    })
  })

  describe('mat3CreateFill', () => {
    it('creates filled matrix', () => {
      expectComponents(mat3CreateFill(2), [2, 2, 2, 2, 2, 2, 2, 2, 2])
    })
  })

  describe('mat3$initIdentity', () => {
    it('sets identity', () => {
      expectComponents(mat3$initIdentity(mat3CreateFill(2)), [1, 0, 0, 0, 1, 0, 0, 0, 1])
    })
    it('returns out', () => {
      const out = mat3()
      expect(mat3$initIdentity(out)).toBe(out)
    })
  })

  describe('mat3CreateIdentity', () => {
    it('creates identity matrix', () => {
      expectComponents(mat3CreateIdentity(), [1, 0, 0, 0, 1, 0, 0, 0, 1])
    })
    it('creates new instance', () => {
      expect(mat3CreateIdentity()).not.toBe(mat3CreateIdentity())
    })
  })

  describe('mat3$initFrom', () => {
    it('copies components', () => {
      expectComponents(mat3$initFrom(mat3(), sample()), [1, 2, 3, 4, 5, 6, 7, 8, 9])
    })
    it('returns out', () => {
      const out = mat3()
      expect(mat3$initFrom(out, sample())).toBe(out)
    })
  })

  describe('mat3CreateFrom', () => {
    it('creates copy', () => {
      const m = sample()
      const result = mat3CreateFrom(m)
      expectComponents(result, [1, 2, 3, 4, 5, 6, 7, 8, 9])
      expect(result).not.toBe(m)
    })
  })

  describe('mat3$initFromArray', () => {
    it('reads components', () => {
      expectComponents(mat3$initFromArray(mat3(), [1, 2, 3, 4, 5, 6, 7, 8, 9]), [1, 2, 3, 4, 5, 6, 7, 8, 9])
    })
    it('reads from offset', () => {
      expectComponents(mat3$initFromArray(mat3(), [0, 0, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9], 3), [1, 2, 3, 4, 5, 6, 7, 8, 9])
    })
    it('returns out', () => {
      const out = mat3()
      expect(mat3$initFromArray(out, [1, 2, 3, 4, 5, 6, 7, 8, 9])).toBe(out)
    })
  })

  describe('mat3CreateFromArray', () => {
    it('reads from offset', () => {
      expectComponents(mat3CreateFromArray([0, 0, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9], 3), [1, 2, 3, 4, 5, 6, 7, 8, 9])
    })
  })

  describe('mat3$initFromQuat', () => {
    it('sets rotation', () => {
      expectVec3(transform(mat3$initFromQuat(mat3(), quat), 1, 1, 0), 0, 1, -1)
    })
    it('returns out', () => {
      const out = mat3()
      expect(mat3$initFromQuat(out, quat)).toBe(out)
    })
  })

  describe('mat3$initFromQuatValues', () => {
    it('sets rotation', () => {
      const m = mat3$initFromQuatValues(mat3(), quat.x, quat.y, quat.z, quat.w)
      expectVec3(transform(m, 1, 1, 0), 0, 1, -1)
    })
  })

  describe('mat3CreateFromQuat', () => {
    it('creates rotation', () => {
      expectVec3(transform(mat3CreateFromQuat(quat), 1, 1, 0), 0, 1, -1)
    })
  })

  describe('mat3CreateFromQuatValues', () => {
    it('creates rotation', () => {
      expectVec3(transform(mat3CreateFromQuatValues(quat.x, quat.y, quat.z, quat.w), 1, 1, 0), 0, 1, -1)
    })
  })

  describe('mat3$initAxisAngle', () => {
    it('sets rotation', () => {
      expectVec3(transform(mat3$initAxisAngle(mat3(), axis, angle), 1, 1, 0), 0, 1, -1)
    })
    it('equals rotation around base axes', () => {
      const a = 0.7
      expectEquality(mat3$initAxisAngle(mat3(), { x: 1, y: 0, z: 0 }, a), mat3CreateRotationX(a))
      expectEquality(mat3$initAxisAngle(mat3(), { x: 0, y: 1, z: 0 }, a), mat3CreateRotationY(a))
      expectEquality(mat3$initAxisAngle(mat3(), { x: 0, y: 0, z: 1 }, a), mat3CreateRotationZ(a))
    })
    it('returns out', () => {
      const out = mat3()
      expect(mat3$initAxisAngle(out, axis, angle)).toBe(out)
    })
  })

  describe('mat3$initAxisAngleValues', () => {
    it('sets rotation', () => {
      expectVec3(transform(mat3$initAxisAngleValues(mat3(), 0, 1, 0, angle), 1, 1, 0), 0, 1, -1)
    })
  })

  describe('mat3CreateAxisAngle', () => {
    it('creates rotation', () => {
      expectVec3(transform(mat3CreateAxisAngle(axis, angle), 1, 1, 0), 0, 1, -1)
    })
  })

  describe('mat3CreateAxisAngleValues', () => {
    it('creates rotation', () => {
      expectVec3(transform(mat3CreateAxisAngleValues(0, 1, 0, angle), 1, 1, 0), 0, 1, -1)
    })
  })

  describe('mat3$initYawPitchRoll', () => {
    it('sets rotation', () => {
      expectVec3(transform(mat3$initYawPitchRoll(mat3(), angle, angle, angle), 0, 0, -1), 0, 1, 0)
    })
    it('returns out', () => {
      const out = mat3()
      expect(mat3$initYawPitchRoll(out, angle, angle, angle)).toBe(out)
    })
  })

  describe('mat3CreateYawPitchRoll', () => {
    it('creates rotation', () => {
      expectVec3(transform(mat3CreateYawPitchRoll(angle, angle, angle), 0, 0, -1), 0, 1, 0)
    })
  })

  describe('mat3$initRotationX', () => {
    it('sets rotation', () => {
      expectVec3(transform(mat3$initRotationX(mat3(), angle), 0, 1, 0), 0, 0, 1)
    })
    it('returns out', () => {
      const out = mat3()
      expect(mat3$initRotationX(out, angle)).toBe(out)
    })
  })

  describe('mat3CreateRotationX', () => {
    it('creates rotation', () => {
      expectVec3(transform(mat3CreateRotationX(angle), 0, 1, 0), 0, 0, 1)
    })
  })

  describe('mat3$initRotationY', () => {
    it('sets rotation', () => {
      expectVec3(transform(mat3$initRotationY(mat3(), angle), 1, 0, 0), 0, 0, -1)
    })
    it('returns out', () => {
      const out = mat3()
      expect(mat3$initRotationY(out, angle)).toBe(out)
    })
  })

  describe('mat3CreateRotationY', () => {
    it('creates rotation', () => {
      expectVec3(transform(mat3CreateRotationY(angle), 1, 0, 0), 0, 0, -1)
    })
  })

  describe('mat3$initRotationZ', () => {
    it('sets rotation', () => {
      expectVec3(transform(mat3$initRotationZ(mat3(), angle), 1, 0, 0), 0, 1, 0)
    })
    it('returns out', () => {
      const out = mat3()
      expect(mat3$initRotationZ(out, angle)).toBe(out)
    })
  })

  describe('mat3CreateRotationZ', () => {
    it('creates rotation', () => {
      expectVec3(transform(mat3CreateRotationZ(angle), 1, 0, 0), 0, 1, 0)
    })
  })

  describe('mat3$initOrientation', () => {
    it('looks along negative z', () => {
      const m = mat3$initOrientation(mat3(), { x: 0, y: 0, z: -1 }, { x: 0, y: 1, z: 0 })
      expectEquality(m, mat3CreateIdentity())
    })
    it('looks along positive x', () => {
      const m = mat3$initOrientation(mat3(), { x: 2, y: 0, z: 0 }, { x: 0, y: 1, z: 0 })
      expectVec3(mat3GetForward(m), 1, 0, 0)
      expectVec3(mat3GetUp(m), 0, 1, 0)
      expectVec3(mat3GetRight(m), 0, 0, 1)
    })
    it('returns out', () => {
      const out = mat3()
      expect(mat3$initOrientation(out, { x: 0, y: 0, z: -1 }, { x: 0, y: 1, z: 0 })).toBe(out)
    })
  })

  describe('mat3CreateOrientation', () => {
    it('creates rotation', () => {
      const m = mat3CreateOrientation({ x: 0, y: 0, z: -1 }, { x: 0, y: 1, z: 0 })
      expectEquality(m, mat3CreateIdentity())
    })
  })

  describe('mat3$initScale', () => {
    it('sets scale', () => {
      expectComponents(mat3$initScale(sample(), vec3(1, 2, 3)), [1, 0, 0, 0, 2, 0, 0, 0, 3])
    })
    it('returns out', () => {
      const out = mat3()
      expect(mat3$initScale(out, vec3(1, 2, 3))).toBe(out)
    })
  })

  describe('mat3$initScaleXYZ', () => {
    it('sets scale', () => {
      expectComponents(mat3$initScaleXYZ(sample(), 1, 2, 3), [1, 0, 0, 0, 2, 0, 0, 0, 3])
    })
  })

  describe('mat3$initScaleUniform', () => {
    it('sets scale', () => {
      expectComponents(mat3$initScaleUniform(sample(), 2), [2, 0, 0, 0, 2, 0, 0, 0, 2])
    })
  })

  describe('mat3CreateScale', () => {
    it('creates scale', () => {
      expectVec3(transform(mat3CreateScale(vec3(1, 2, 3)), 1, 2, 3), 1, 4, 9)
    })
  })

  describe('mat3CreateScaleXYZ', () => {
    it('creates scale', () => {
      expectVec3(transform(mat3CreateScaleXYZ(1, 2, 3), 1, 2, 3), 1, 4, 9)
    })
  })

  describe('mat3CreateScaleUniform', () => {
    it('creates scale', () => {
      expectVec3(transform(mat3CreateScaleUniform(2), 1, 2, 3), 2, 4, 6)
    })
  })

  describe('rotate', () => {
    // rotate multiplies from the right: M * R
    // preRotate multiplies from the left: R * M
    // uses an axis that is not a base axis, so the rotation matrix is not symmetric
    const a = 0.7
    const n = { x: 2 / 7, y: 3 / 7, z: 6 / 7 }
    const s = Math.sin(a / 2)
    const q: IVec4 = { x: n.x * s, y: n.y * s, z: n.z * s, w: Math.cos(a / 2) }
    const r = mat3CreateAxisAngle(n, a)
    const cases: Array<[string, (m: Mat3) => Mat3, (m: Mat3) => Mat3, Mat3]> = [
      ['X', (m) => mat3$rotateX(m, a), (m) => mat3$preRotateX(m, a), mat3CreateRotationX(a)],
      ['Y', (m) => mat3$rotateY(m, a), (m) => mat3$preRotateY(m, a), mat3CreateRotationY(a)],
      ['Z', (m) => mat3$rotateZ(m, a), (m) => mat3$preRotateZ(m, a), mat3CreateRotationZ(a)],
      ['ByQuat', (m) => mat3$rotateByQuat(m, q), (m) => mat3$preRotateByQuat(m, q), r],
      [
        'ByQuatValues',
        (m) => mat3$rotateByQuatValues(m, q.x, q.y, q.z, q.w),
        (m) => mat3$preRotateByQuatValues(m, q.x, q.y, q.z, q.w),
        r,
      ],
      ['ByAxisAngle', (m) => mat3$rotateByAxisAngle(m, n, a), (m) => mat3$preRotateByAxisAngle(m, n, a), r],
      [
        'ByAxisAngleValues',
        (m) => mat3$rotateByAxisAngleValues(m, n.x, n.y, n.z, a),
        (m) => mat3$preRotateByAxisAngleValues(m, n.x, n.y, n.z, a),
        r,
      ],
      [
        'YawPitchRoll',
        (m) => mat3$rotateYawPitchRoll(m, 0.3, 0.5, 0.7),
        (m) => mat3$preRotateYawPitchRoll(m, 0.3, 0.5, 0.7),
        mat3CreateYawPitchRoll(0.3, 0.5, 0.7),
      ],
    ]

    for (const [name, rotate, preRotate, rotation] of cases) {
      describe(`mat3$rotate${name}`, () => {
        it('multiplies rotation from the right', () => {
          expectEquality(rotate(sample()), mat3Multiply(sample(), rotation))
        })
        it('returns out', () => {
          const out = sample()
          expect(rotate(out)).toBe(out)
        })
      })

      describe(`mat3$preRotate${name}`, () => {
        it('multiplies rotation from the left', () => {
          expectEquality(preRotate(sample()), mat3Multiply(rotation, sample()))
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
    const cases: Array<[string, (m: Mat3) => Mat3, Mat3]> = [
      ['mat3$scale', (m) => mat3$scale(m, vec3(2, 3, 4)), mat3CreateScaleXYZ(2, 3, 4)],
      ['mat3$scaleXYZ', (m) => mat3$scaleXYZ(m, 2, 3, 4), mat3CreateScaleXYZ(2, 3, 4)],
      ['mat3$scaleX', (m) => mat3$scaleX(m, 2), mat3CreateScaleXYZ(2, 1, 1)],
      ['mat3$scaleY', (m) => mat3$scaleY(m, 3), mat3CreateScaleXYZ(1, 3, 1)],
      ['mat3$scaleZ', (m) => mat3$scaleZ(m, 4), mat3CreateScaleXYZ(1, 1, 4)],
      ['mat3$scaleUniform', (m) => mat3$scaleUniform(m, 2), mat3CreateScaleUniform(2)],
    ]
    const preCases: Array<[string, (m: Mat3) => Mat3, Mat3]> = [
      ['mat3$preScale', (m) => mat3$preScale(m, vec3(2, 3, 4)), mat3CreateScaleXYZ(2, 3, 4)],
      ['mat3$preScaleXYZ', (m) => mat3$preScaleXYZ(m, 2, 3, 4), mat3CreateScaleXYZ(2, 3, 4)],
      ['mat3$preScaleX', (m) => mat3$preScaleX(m, 2), mat3CreateScaleXYZ(2, 1, 1)],
      ['mat3$preScaleY', (m) => mat3$preScaleY(m, 3), mat3CreateScaleXYZ(1, 3, 1)],
      ['mat3$preScaleZ', (m) => mat3$preScaleZ(m, 4), mat3CreateScaleXYZ(1, 1, 4)],
    ]

    for (const [name, scale, scaling] of cases) {
      describe(name, () => {
        it('multiplies scale from the right', () => {
          expectEquality(scale(sample()), mat3Multiply(sample(), scaling))
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
          expectEquality(preScale(sample()), mat3Multiply(scaling, sample()))
        })
        it('returns out', () => {
          const out = sample()
          expect(preScale(out)).toBe(out)
        })
      })
    }
  })

  describe('directions', () => {
    // sample columns: right (1, 2, 3), up (4, 5, 6), backward (7, 8, 9)
    const vec = () => vec3(21, 22, 23)
    const cases: Array<[string, (m: Mat3, out?: IVec3) => IVec3, (m: Mat3, v: IVec3) => Mat3, number[], number[]]> = [
      ['Right', mat3GetRight, mat3$setRight, [1, 2, 3], [21, 22, 23, 4, 5, 6, 7, 8, 9]],
      ['Left', mat3GetLeft, mat3$setLeft, [-1, -2, -3], [-21, -22, -23, 4, 5, 6, 7, 8, 9]],
      ['Up', mat3GetUp, mat3$setUp, [4, 5, 6], [1, 2, 3, 21, 22, 23, 7, 8, 9]],
      ['Down', mat3GetDown, mat3$setDown, [-4, -5, -6], [1, 2, 3, -21, -22, -23, 7, 8, 9]],
      ['Backward', mat3GetBackward, mat3$setBackward, [7, 8, 9], [1, 2, 3, 4, 5, 6, 21, 22, 23]],
      ['Forward', mat3GetForward, mat3$setForward, [-7, -8, -9], [1, 2, 3, 4, 5, 6, -21, -22, -23]],
    ]

    for (const [name, get, set, direction, components] of cases) {
      describe(`mat3get${name}`, () => {
        it('gets direction', () => {
          expectVec3(get(sample()), direction[0], direction[1], direction[2])
        })
        it('writes to out', () => {
          const out = vec3()
          expect(get(sample(), out)).toBe(out)
          expectVec3(out, direction[0], direction[1], direction[2])
        })
      })

      describe(`mat3$set${name}`, () => {
        it('sets direction', () => {
          expectComponents(set(sample(), vec()), components)
        })
        it('returns out', () => {
          const out = sample()
          expect(set(out, vec())).toBe(out)
        })
      })
    }
  })

  describe('mat3GetScale', () => {
    it('gets scale', () => {
      expectVec3(mat3GetScale(sample()), 1, 5, 9)
    })
    it('writes to out', () => {
      const out = vec3()
      expect(mat3GetScale(sample(), out)).toBe(out)
      expectVec3(out, 1, 5, 9)
    })
  })

  describe('mat3$setScale', () => {
    it('sets scale', () => {
      expectComponents(mat3$setScale(sample(), vec3(21, 22, 23)), [21, 2, 3, 4, 22, 6, 7, 8, 23])
    })
    it('returns out', () => {
      const out = sample()
      expect(mat3$setScale(out, vec3(21, 22, 23))).toBe(out)
    })
  })

  describe('mat3$setScaleXYZ', () => {
    it('sets scale', () => {
      expectComponents(mat3$setScaleXYZ(sample(), 21, 22, 23), [21, 2, 3, 4, 22, 6, 7, 8, 23])
    })
  })

  describe('mat3$setScaleX', () => {
    it('sets x scale', () => {
      expectComponents(mat3$setScaleX(sample(), 21), [21, 2, 3, 4, 5, 6, 7, 8, 9])
    })
  })

  describe('mat3$setScaleY', () => {
    it('sets y scale', () => {
      expectComponents(mat3$setScaleY(sample(), 22), [1, 2, 3, 4, 22, 6, 7, 8, 9])
    })
  })

  describe('mat3$setScaleZ', () => {
    it('sets z scale', () => {
      expectComponents(mat3$setScaleZ(sample(), 23), [1, 2, 3, 4, 5, 6, 7, 8, 23])
    })
  })

  describe('mat3Copy', () => {
    it('copies components', () => {
      const m = sample()
      const result = mat3Copy(m)
      expectComponents(result, [1, 2, 3, 4, 5, 6, 7, 8, 9])
      expect(result).not.toBe(m)
    })
    it('writes to out', () => {
      const out = mat3()
      expect(mat3Copy(sample(), out)).toBe(out)
      expectComponents(out, [1, 2, 3, 4, 5, 6, 7, 8, 9])
    })
  })

  describe('mat3Equals', () => {
    it('compares components', () => {
      expect(mat3Equals(sample(), sample())).toBe(true)
      for (let i = 0; i < 9; i++) {
        const other = sample()
        other[i] = 100
        expect(mat3Equals(sample(), other), `component ${i}`).toBe(false)
      }
    })
  })

  describe('mat3Determinant', () => {
    it('calculates determinant', () => {
      expect(mat3Determinant(invertible())).toBeCloseTo(12)
    })
  })

  describe('mat3$transpose', () => {
    it('transposes in place', () => {
      expectComponents(mat3$transpose(sample()), [1, 4, 7, 2, 5, 8, 3, 6, 9])
    })
    it('returns out', () => {
      const out = sample()
      expect(mat3$transpose(out)).toBe(out)
    })
  })

  describe('mat3Transpose', () => {
    it('transposes', () => {
      const m = sample()
      expectComponents(mat3Transpose(m), [1, 4, 7, 2, 5, 8, 3, 6, 9])
      expectComponents(m, [1, 2, 3, 4, 5, 6, 7, 8, 9])
    })
    it('writes to out', () => {
      const out = mat3()
      expect(mat3Transpose(sample(), out)).toBe(out)
    })
  })

  describe('mat3$invert', () => {
    it('inverts in place', () => {
      expectEquality(mat3Multiply(mat3$invert(invertible()), invertible()), mat3CreateIdentity())
    })
    it('returns out', () => {
      const out = invertible()
      expect(mat3$invert(out)).toBe(out)
    })
  })

  describe('mat3Invert', () => {
    it('A * inv(A) is identity', () => {
      expectEquality(mat3Multiply(invertible(), mat3Invert(invertible())), mat3CreateIdentity())
    })
    it('inverts twice to original', () => {
      expectEquality(mat3Invert(mat3Invert(invertible())), invertible())
    })
    it('writes to out', () => {
      const out = mat3()
      expect(mat3Invert(invertible(), out)).toBe(out)
    })
  })

  describe('mat3$negate', () => {
    it('negates in place', () => {
      expectComponents(mat3$negate(sample()), [-1, -2, -3, -4, -5, -6, -7, -8, -9])
    })
    it('returns out', () => {
      const out = sample()
      expect(mat3$negate(out)).toBe(out)
    })
  })

  describe('mat3Negate', () => {
    it('negates', () => {
      expectComponents(mat3Negate(sample()), [-1, -2, -3, -4, -5, -6, -7, -8, -9])
    })
    it('writes to out', () => {
      const out = mat3()
      expect(mat3Negate(sample(), out)).toBe(out)
    })
  })

  describe('mat3$add', () => {
    it('adds in place', () => {
      expectComponents(mat3$add(sample(), sample()), [2, 4, 6, 8, 10, 12, 14, 16, 18])
    })
    it('returns out', () => {
      const out = sample()
      expect(mat3$add(out, sample())).toBe(out)
    })
  })

  describe('mat3Add', () => {
    it('adds', () => {
      expectComponents(mat3Add(sample(), sample()), [2, 4, 6, 8, 10, 12, 14, 16, 18])
    })
    it('writes to out', () => {
      const out = mat3()
      expect(mat3Add(sample(), sample(), out)).toBe(out)
    })
  })

  describe('mat3$addScalar', () => {
    it('adds in place', () => {
      expectComponents(mat3$addScalar(sample(), 10), [11, 12, 13, 14, 15, 16, 17, 18, 19])
    })
    it('returns out', () => {
      const out = sample()
      expect(mat3$addScalar(out, 10)).toBe(out)
    })
  })

  describe('mat3AddScalar', () => {
    it('adds', () => {
      expectComponents(mat3AddScalar(sample(), 10), [11, 12, 13, 14, 15, 16, 17, 18, 19])
    })
    it('writes to out', () => {
      const out = mat3()
      expect(mat3AddScalar(sample(), 10, out)).toBe(out)
    })
  })

  describe('mat3$subtract', () => {
    it('subtracts in place', () => {
      expectComponents(mat3$subtract(sample(), mat3CreateFill(1)), [0, 1, 2, 3, 4, 5, 6, 7, 8])
    })
    it('returns out', () => {
      const out = sample()
      expect(mat3$subtract(out, sample())).toBe(out)
    })
  })

  describe('mat3Subtract', () => {
    it('subtracts', () => {
      expectComponents(mat3Subtract(sample(), mat3CreateFill(1)), [0, 1, 2, 3, 4, 5, 6, 7, 8])
    })
    it('writes to out', () => {
      const out = mat3()
      expect(mat3Subtract(sample(), sample(), out)).toBe(out)
    })
  })

  describe('mat3$subtractScalar', () => {
    it('subtracts in place', () => {
      expectComponents(mat3$subtractScalar(sample(), 10), [-9, -8, -7, -6, -5, -4, -3, -2, -1])
    })
    it('returns out', () => {
      const out = sample()
      expect(mat3$subtractScalar(out, 10)).toBe(out)
    })
  })

  describe('mat3SubtractScalar', () => {
    it('subtracts', () => {
      expectComponents(mat3SubtractScalar(sample(), 10), [-9, -8, -7, -6, -5, -4, -3, -2, -1])
    })
    it('writes to out', () => {
      const out = mat3()
      expect(mat3SubtractScalar(sample(), 10, out)).toBe(out)
    })
  })

  describe('mat3$multiplyScalar', () => {
    it('multiplies in place', () => {
      expectComponents(mat3$multiplyScalar(sample(), 10), [10, 20, 30, 40, 50, 60, 70, 80, 90])
    })
    it('returns out', () => {
      const out = sample()
      expect(mat3$multiplyScalar(out, 10)).toBe(out)
    })
  })

  describe('mat3MultiplyScalar', () => {
    it('multiplies', () => {
      expectComponents(mat3MultiplyScalar(sample(), 10), [10, 20, 30, 40, 50, 60, 70, 80, 90])
    })
    it('writes to out', () => {
      const out = mat3()
      expect(mat3MultiplyScalar(sample(), 10, out)).toBe(out)
    })
  })

  describe('mat3$divide', () => {
    it('divides in place', () => {
      expectComponents(mat3$divide(sample(), mat3CreateFill(2)), [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5])
    })
    it('returns out', () => {
      const out = sample()
      expect(mat3$divide(out, sample())).toBe(out)
    })
  })

  describe('mat3Divide', () => {
    it('divides', () => {
      expectComponents(mat3Divide(sample(), mat3CreateFill(2)), [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5])
    })
    it('writes to out', () => {
      const out = mat3()
      expect(mat3Divide(sample(), sample(), out)).toBe(out)
    })
  })

  describe('mat3$divideScalar', () => {
    it('divides in place', () => {
      expectComponents(mat3$divideScalar(sample(), 10), [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9])
    })
    it('returns out', () => {
      const out = sample()
      expect(mat3$divideScalar(out, 10)).toBe(out)
    })
  })

  describe('mat3DivideScalar', () => {
    it('divides', () => {
      expectComponents(mat3DivideScalar(sample(), 10), [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9])
    })
    it('writes to out', () => {
      const out = mat3()
      expect(mat3DivideScalar(sample(), 10, out)).toBe(out)
    })
  })

  describe('mat3Multiply', () => {
    it('A * inv(A) is identity', () => {
      expectEquality(mat3Multiply(invertible(), mat3Invert(invertible())), mat3CreateIdentity())
    })
    it('multiply(A, B) transforms like A * B', () => {
      const a = mat3CreateRotationX(angle)
      const b = mat3CreateScaleXYZ(1, 2, 3)
      const v = transform(mat3Multiply(a, b), 1, 1, 1)
      const expected = vec3ApplyMat3(transform(b, 1, 1, 1), a)
      expectVec3(v, expected.x, expected.y, expected.z)
    })
    it('writes to out', () => {
      const out = mat3()
      expect(mat3Multiply(sample(), sample(), out)).toBe(out)
    })
  })

  describe('mat3$multiply', () => {
    it('multiplies in place: A = A * B', () => {
      const a = mat3CreateRotationX(angle)
      const b = mat3CreateScaleXYZ(1, 2, 3)
      expectEquality(mat3$multiply(mat3Copy(a), b), mat3Multiply(a, b))
    })
    it('returns out', () => {
      const out = sample()
      expect(mat3$multiply(out, sample())).toBe(out)
    })
  })

  describe('mat3Premultiply', () => {
    it('premultiply(A, B) is B * A', () => {
      const a = mat3CreateRotationX(angle)
      const b = mat3CreateScaleXYZ(1, 2, 3)
      expectEquality(mat3Premultiply(a, b), mat3Multiply(b, a))
    })
    it('writes to out', () => {
      const out = mat3()
      expect(mat3Premultiply(sample(), sample(), out)).toBe(out)
    })
  })

  describe('mat3$premultiply', () => {
    it('multiplies in place: A = B * A', () => {
      const a = mat3CreateRotationX(angle)
      const b = mat3CreateScaleXYZ(1, 2, 3)
      expectEquality(mat3$premultiply(mat3Copy(a), b), mat3Multiply(b, a))
    })
    it('returns out', () => {
      const out = sample()
      expect(mat3$premultiply(out, sample())).toBe(out)
    })
  })

  describe('mat3Lerp', () => {
    it('interpolates components', () => {
      const result = mat3Lerp(mat3Create(1, 2, 3, 4, 5, 6, 7, 8, 9), mat3Create(3, 4, 5, 6, 7, 8, 9, 10, 11), 0.5)
      expectComponents(result, [2, 3, 4, 5, 6, 7, 8, 9, 10])
    })
    it('writes to out', () => {
      const out = mat3()
      expect(mat3Lerp(sample(), sample(), 0.5, out)).toBe(out)
    })
  })

  describe('mat3Smooth', () => {
    const a = () => mat3Create(1, 2, 3, 4, 5, 6, 7, 8, 9)
    const b = () => mat3Create(3, 4, 5, 6, 7, 8, 9, 10, 11)
    it('interpolates components', () => {
      expectComponents(mat3Smooth(a(), b(), 0.5), [2, 3, 4, 5, 6, 7, 8, 9, 10])
    })
    it('clamps t to [0, 1]', () => {
      expectComponents(mat3Smooth(a(), b(), 2), [3, 4, 5, 6, 7, 8, 9, 10, 11])
      expectComponents(mat3Smooth(a(), b(), -1), [1, 2, 3, 4, 5, 6, 7, 8, 9])
    })
  })

  describe('mat3TransformVec2Array', () => {
    it('transforms all points', () => {
      const array = [1, 0, 1, 0, 1, 0]
      mat3TransformVec2Array(mat3CreateRotationZ(angle), array)
      expectArray(array, [0, 1, 0, 1, 0, 1])
    })
    it('applies translation', () => {
      const array = [1, 2]
      mat3TransformVec2Array(mat3CreateRowMajor(1, 0, 5, 0, 1, 6, 0, 0, 1), array)
      expectArray(array, [6, 8])
    })
    it('uses offset, stride and count', () => {
      const array = [9, 1, 0, 9, 1, 0, 9, 1, 0]
      mat3TransformVec2Array(mat3CreateRotationZ(angle), array, 1, 3, 2)
      expectArray(array, [9, 0, 1, 9, 0, 1, 9, 1, 0])
    })
    it('returns the array', () => {
      const array = [1, 0]
      expect(mat3TransformVec2Array(sample(), array)).toBe(array)
    })
  })

  describe('mat3TransformVec3Array', () => {
    it('transforms all vectors', () => {
      const array = [1, 0, 0, 1, 0, 0, 1, 0, 0]
      mat3TransformVec3Array(mat3CreateRotationZ(angle), array)
      expectArray(array, [0, 1, 0, 0, 1, 0, 0, 1, 0])
    })
    it('uses offset, stride and count', () => {
      const array = [9, 1, 0, 0, 9, 1, 0, 0, 9, 1, 0, 0]
      mat3TransformVec3Array(mat3CreateRotationZ(angle), array, 1, 4, 2)
      expectArray(array, [9, 0, 1, 0, 9, 0, 1, 0, 9, 1, 0, 0])
    })
    it('returns the array', () => {
      const array = [1, 0, 0]
      expect(mat3TransformVec3Array(sample(), array)).toBe(array)
    })
  })

  describe('mat3Format', () => {
    it('formats rows', () => {
      expect(mat3Format(sample())).toBe('1.00000,4.00000,7.00000\n2.00000,5.00000,8.00000\n3.00000,6.00000,9.00000')
    })
  })

  describe('mat3ToArray', () => {
    it('creates array', () => {
      expect(mat3ToArray(sample())).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9])
    })
    it('writes at offset', () => {
      expect(mat3ToArray(sample(), [], 2)).toEqual([undefined, undefined, 1, 2, 3, 4, 5, 6, 7, 8, 9])
    })
  })
})
