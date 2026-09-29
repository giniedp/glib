import { describe, expect, it } from 'vitest'
import {
  IVec2,
  IVec3,
  IVec4,
  Mat4,
  NdcMinZ,
  mat4,
  mat4$add,
  mat4$addScalar,
  mat4$divide,
  mat4$divideScalar,
  mat4$init,
  mat4$initAxisAngle,
  mat4$initAxisAngleValues,
  mat4$initFill,
  mat4$initFrom,
  mat4$initFromArray,
  mat4$initFromQuat,
  mat4$initFromQuatValues,
  mat4$initFromRTS,
  mat4$initIdentity,
  mat4$initLookAt,
  mat4$initOrientation,
  mat4$initOrthographic,
  mat4$initOrthographicOffCenter,
  mat4$initPerspective,
  mat4$initPerspectiveFieldOfView,
  mat4$initPerspectiveOffCenter,
  mat4$initRotationX,
  mat4$initRotationY,
  mat4$initRotationZ,
  mat4$initRowMajor,
  mat4$initScale,
  mat4$initScaleUniform,
  mat4$initScaleXYZ,
  mat4$initTranslation,
  mat4$initTranslationXYZ,
  mat4$initWorld,
  mat4$initYawPitchRoll,
  mat4$invert,
  mat4$multiply,
  mat4$multiplyScalar,
  mat4$negate,
  mat4$premultiply,
  mat4$preRotateByAxisAngle,
  mat4$preRotateByAxisAngleValues,
  mat4$preRotateByQuat,
  mat4$preRotateByQuatValues,
  mat4$preRotateX,
  mat4$preRotateY,
  mat4$preRotateYawPitchRoll,
  mat4$preRotateZ,
  mat4$preScale,
  mat4$preScaleUniform,
  mat4$preScaleX,
  mat4$preScaleXYZ,
  mat4$preScaleY,
  mat4$preScaleZ,
  mat4$preTranslate,
  mat4$preTranslateX,
  mat4$preTranslateXYZ,
  mat4$preTranslateY,
  mat4$preTranslateZ,
  mat4$rotateByAxisAngle,
  mat4$rotateByAxisAngleValues,
  mat4$rotateByQuat,
  mat4$rotateByQuatValues,
  mat4$rotateX,
  mat4$rotateY,
  mat4$rotateYawPitchRoll,
  mat4$rotateZ,
  mat4$scale,
  mat4$scaleUniform,
  mat4$scaleX,
  mat4$scaleXYZ,
  mat4$scaleY,
  mat4$scaleZ,
  mat4$setBackward,
  mat4$setDown,
  mat4$setForward,
  mat4$setLeft,
  mat4$setRight,
  mat4$setScale,
  mat4$setScaleX,
  mat4$setScaleXYZ,
  mat4$setScaleY,
  mat4$setScaleZ,
  mat4$setTranslation,
  mat4$setTranslationX,
  mat4$setTranslationXYZ,
  mat4$setTranslationY,
  mat4$setTranslationZ,
  mat4$setUp,
  mat4$subtract,
  mat4$subtractScalar,
  mat4$translate,
  mat4$translateX,
  mat4$translateXYZ,
  mat4$translateY,
  mat4$translateZ,
  mat4$transpose,
  mat4Add,
  mat4AddScalar,
  mat4ApplyToVec2Array,
  mat4ApplyToVec2DirArray,
  mat4ApplyToVec3,
  mat4ApplyToVec3Array,
  mat4ApplyToVec3DirArray,
  mat4ApplyToVec4Array,
  mat4Copy,
  mat4Create,
  mat4CreateAxisAngle,
  mat4CreateAxisAngleValues,
  mat4CreateFill,
  mat4CreateFrom,
  mat4CreateFromArray,
  mat4CreateFromQuat,
  mat4CreateFromQuatValues,
  mat4CreateFromRTS,
  mat4CreateIdentity,
  mat4CreateLookAt,
  mat4CreateOrientation,
  mat4CreateOrthographic,
  mat4CreateOrthographicOffCenter,
  mat4CreatePerspective,
  mat4CreatePerspectiveFieldOfView,
  mat4CreatePerspectiveOffCenter,
  mat4CreateRotationX,
  mat4CreateRotationY,
  mat4CreateRotationZ,
  mat4CreateRowMajor,
  mat4CreateScale,
  mat4CreateScaleUniform,
  mat4CreateScaleXYZ,
  mat4CreateTranslation,
  mat4CreateTranslationXYZ,
  mat4CreateWorld,
  mat4CreateYawPitchRoll,
  mat4Decompose,
  mat4Determinant,
  mat4Divide,
  mat4DivideScalar,
  mat4Equals,
  mat4Format,
  mat4GetBackward,
  mat4GetCol,
  mat4GetDown,
  mat4GetForward,
  mat4GetLeft,
  mat4GetRight,
  mat4GetRow,
  mat4GetScale,
  mat4GetTranslation,
  mat4GetTranslationX,
  mat4GetTranslationY,
  mat4GetTranslationZ,
  mat4GetUp,
  mat4Identity,
  mat4Invert,
  mat4Lerp,
  mat4Multiply,
  mat4MultiplyScalar,
  mat4Negate,
  mat4Premultiply,
  mat4Smooth,
  mat4Subtract,
  mat4SubtractScalar,
  mat4ToArray,
  mat4TransformNormal2,
  mat4TransformNormal3,
  mat4TransformNormal3Abs,
  mat4TransformPoint2,
  mat4TransformPoint3,
  mat4Transpose,
  vec2,
  vec3,
  vec4,
} from './index'

describe('mat4', () => {
  // components are stored as Float32, so the default precision is lower than for plain numbers
  function expectComponents(m: Mat4, parts: number[], precision: number = 4) {
    for (let i = 0; i < 16; i++) {
      expect(m[i], `component ${i}`).toBeCloseTo(parts[i], precision)
    }
  }

  function expectEquality(m1: Mat4, m2: Mat4, precision: number = 4) {
    expectComponents(m1, Array.from(m2), precision)
  }

  function expectVec2(v: IVec2, x: number, y: number, precision: number = 5) {
    expect(v.x, 'x component').toBeCloseTo(x, precision)
    expect(v.y, 'y component').toBeCloseTo(y, precision)
  }

  function expectVec3(v: IVec3, x: number, y: number, z: number, precision: number = 5) {
    expect(v.x, 'x component').toBeCloseTo(x, precision)
    expect(v.y, 'y component').toBeCloseTo(y, precision)
    expect(v.z, 'z component').toBeCloseTo(z, precision)
  }

  function expectVec4(v: IVec4, x: number, y: number, z: number, w: number, precision: number = 5) {
    expect(v.x, 'x component').toBeCloseTo(x, precision)
    expect(v.y, 'y component').toBeCloseTo(y, precision)
    expect(v.z, 'z component').toBeCloseTo(z, precision)
    expect(v.w, 'w component').toBeCloseTo(w, precision)
  }

  function expectArray(actual: ArrayLike<number>, expected: number[], precision: number = 5) {
    expect(actual.length).toBe(expected.length)
    for (let i = 0; i < expected.length; i++) {
      expect(actual[i], `index ${i}`).toBeCloseTo(expected[i], precision)
    }
  }

  function transform(m: Mat4, x: number, y: number, z: number) {
    return mat4TransformPoint3(m, vec3(x, y, z))
  }

  // matrix with distinct components in column major order
  const sample = () => mat4Create(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16)
  const sampleParts = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]
  // invertible matrix with determinant 450
  const invertible = () => mat4CreateRowMajor(1, 2, 3, 4, 0, 9, 8, 7, 2, 3, 1, 4, 8, 7, 6, 5)
  // 90 degree rotation around the y axis
  const angle = Math.PI * 0.5
  const axis = { x: 0, y: 1, z: 0 }
  const quat: IVec4 = { x: 0, y: Math.SQRT1_2, z: 0, w: Math.SQRT1_2 }

  describe('mat4', () => {
    it('creates zero matrix', () => {
      expectComponents(mat4(), [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])
    })
    it('creates new instance', () => {
      expect(mat4()).not.toBe(mat4())
    })
  })

  describe('mat4$init', () => {
    it('sets components in column major order', () => {
      expectComponents(mat4$init(mat4(), 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16), sampleParts)
    })
    it('returns out', () => {
      const out = mat4()
      expect(mat4$init(out, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16)).toBe(out)
    })
  })

  describe('mat4Create', () => {
    it('creates matrix in column major order', () => {
      expectComponents(mat4Create(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16), sampleParts)
    })
  })

  describe('mat4$initRowMajor', () => {
    it('sets components in row major order', () => {
      expectComponents(
        mat4$initRowMajor(mat4(), 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16),
        [1, 5, 9, 13, 2, 6, 10, 14, 3, 7, 11, 15, 4, 8, 12, 16],
      )
    })
    it('returns out', () => {
      const out = mat4()
      expect(mat4$initRowMajor(out, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16)).toBe(out)
    })
  })

  describe('mat4CreateRowMajor', () => {
    it('creates matrix in row major order', () => {
      expectComponents(
        mat4CreateRowMajor(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16),
        [1, 5, 9, 13, 2, 6, 10, 14, 3, 7, 11, 15, 4, 8, 12, 16],
      )
    })
  })

  describe('mat4$initFill', () => {
    it('sets all components', () => {
      expectComponents(mat4$initFill(mat4(), 2), [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2])
    })
    it('returns out', () => {
      const out = mat4()
      expect(mat4$initFill(out, 2)).toBe(out)
    })
  })

  describe('mat4CreateFill', () => {
    it('creates filled matrix', () => {
      expectComponents(mat4CreateFill(2), [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2])
    })
  })

  describe('mat4$initIdentity', () => {
    it('sets identity', () => {
      expectComponents(mat4$initIdentity(mat4CreateFill(2)), [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1])
    })
    it('returns out', () => {
      const out = mat4()
      expect(mat4$initIdentity(out)).toBe(out)
    })
  })

  describe('mat4CreateIdentity', () => {
    it('creates identity matrix', () => {
      expectComponents(mat4CreateIdentity(), [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1])
    })
    it('creates new instance', () => {
      expect(mat4CreateIdentity()).not.toBe(mat4CreateIdentity())
    })
  })

  describe('mat4Identity', () => {
    it('creates identity matrix', () => {
      expectComponents(mat4Identity(), [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1])
    })
    it('creates new instance', () => {
      expect(mat4Identity()).not.toBe(mat4Identity())
    })
  })

  describe('mat4$initFrom', () => {
    it('copies components', () => {
      expectComponents(mat4$initFrom(mat4(), sample()), sampleParts)
    })
    it('returns out', () => {
      const out = mat4()
      expect(mat4$initFrom(out, sample())).toBe(out)
    })
  })

  describe('mat4CreateFrom', () => {
    it('creates copy', () => {
      const m = sample()
      const result = mat4CreateFrom(m)
      expectComponents(result, sampleParts)
      expect(result).not.toBe(m)
    })
  })

  describe('mat4$initFromArray', () => {
    it('reads components', () => {
      expectComponents(mat4$initFromArray(mat4(), sampleParts), sampleParts)
    })
    it('reads from offset', () => {
      expectComponents(mat4$initFromArray(mat4(), [0, 0, 0, 0, ...sampleParts], 4), sampleParts)
    })
    it('returns out', () => {
      const out = mat4()
      expect(mat4$initFromArray(out, sampleParts)).toBe(out)
    })
  })

  describe('mat4CreateFromArray', () => {
    it('reads components', () => {
      expectComponents(mat4CreateFromArray(sampleParts), sampleParts)
    })
    it('reads from offset', () => {
      expectComponents(mat4CreateFromArray([0, 0, 0, 0, ...sampleParts], 4), sampleParts)
    })
  })

  describe('mat4$initFromQuat', () => {
    it('sets rotation', () => {
      expectVec3(transform(mat4$initFromQuat(mat4(), quat), 1, 1, 0), 0, 1, -1)
    })
    it('equals rotation around base axes', () => {
      const s = Math.sin(angle / 2)
      const c = Math.cos(angle / 2)
      expectEquality(mat4$initFromQuat(mat4(), { x: s, y: 0, z: 0, w: c }), mat4CreateRotationX(angle))
      expectEquality(mat4$initFromQuat(mat4(), { x: 0, y: s, z: 0, w: c }), mat4CreateRotationY(angle))
      expectEquality(mat4$initFromQuat(mat4(), { x: 0, y: 0, z: s, w: c }), mat4CreateRotationZ(angle))
    })
    it('returns out', () => {
      const out = mat4()
      expect(mat4$initFromQuat(out, quat)).toBe(out)
    })
  })

  describe('mat4$initFromQuatValues', () => {
    it('sets rotation', () => {
      const m = mat4$initFromQuatValues(mat4(), quat.x, quat.y, quat.z, quat.w)
      expectVec3(transform(m, 1, 1, 0), 0, 1, -1)
    })
  })

  describe('mat4CreateFromQuat', () => {
    it('creates rotation', () => {
      expectVec3(transform(mat4CreateFromQuat(quat), 1, 1, 0), 0, 1, -1)
    })
  })

  describe('mat4CreateFromQuatValues', () => {
    it('creates rotation', () => {
      expectVec3(transform(mat4CreateFromQuatValues(quat.x, quat.y, quat.z, quat.w), 1, 1, 0), 0, 1, -1)
    })
  })

  describe('mat4$initFromRTS', () => {
    it('equals T * R * S', () => {
      const t = mat4CreateTranslationXYZ(1, 2, 3)
      const r = mat4CreateFromQuat(quat)
      const s = mat4CreateScaleXYZ(2, 3, 4)
      const m = mat4$initFromRTS(mat4(), quat, vec3(1, 2, 3), vec3(2, 3, 4))
      expectEquality(m, mat4Multiply(mat4Multiply(t, r), s))
    })
    it('returns out', () => {
      const out = mat4()
      expect(mat4$initFromRTS(out, quat, vec3(1, 2, 3), vec3(2, 3, 4))).toBe(out)
    })
  })

  describe('mat4CreateFromRTS', () => {
    it('creates transformation', () => {
      const m = mat4CreateFromRTS(quat, vec3(1, 2, 3), vec3(2, 3, 4))
      expectVec3(transform(m, 1, 0, 0), 1, 2, 1)
    })
  })

  describe('mat4Decompose', () => {
    it('gets scale, rotation and translation', () => {
      const m = mat4CreateFromRTS(quat, vec3(1, 2, 3), vec3(2, 3, 4))
      const s = vec3()
      const r = vec4()
      const t = vec3()
      expect(mat4Decompose(m, s, r, t)).toBe(true)
      expectVec3(s, 2, 3, 4)
      expectVec4(r, quat.x, quat.y, quat.z, quat.w)
      expectVec3(t, 1, 2, 3)
    })
    it('skips translation if not given', () => {
      const m = mat4CreateFromRTS(quat, vec3(1, 2, 3), vec3(2, 3, 4))
      expect(mat4Decompose(m, vec3(), vec4())).toBe(true)
    })
    it('returns false for zero scale', () => {
      const r = vec4(1, 2, 3, 4)
      expect(mat4Decompose(mat4CreateScaleXYZ(1, 0, 1), vec3(), r)).toBe(false)
      expectVec4(r, 0, 0, 0, 1)
    })
  })

  describe('mat4$initAxisAngle', () => {
    it('sets rotation', () => {
      expectVec3(transform(mat4$initAxisAngle(mat4(), axis, angle), 1, 1, 0), 0, 1, -1)
    })
    it('equals rotation around base axes', () => {
      const a = 0.7
      expectEquality(mat4$initAxisAngle(mat4(), { x: 1, y: 0, z: 0 }, a), mat4CreateRotationX(a))
      expectEquality(mat4$initAxisAngle(mat4(), { x: 0, y: 1, z: 0 }, a), mat4CreateRotationY(a))
      expectEquality(mat4$initAxisAngle(mat4(), { x: 0, y: 0, z: 1 }, a), mat4CreateRotationZ(a))
    })
    it('returns out', () => {
      const out = mat4()
      expect(mat4$initAxisAngle(out, axis, angle)).toBe(out)
    })
  })

  describe('mat4$initAxisAngleValues', () => {
    it('sets rotation', () => {
      expectVec3(transform(mat4$initAxisAngleValues(mat4(), 0, 1, 0, angle), 1, 1, 0), 0, 1, -1)
    })
  })

  describe('mat4CreateAxisAngle', () => {
    it('creates rotation', () => {
      expectVec3(transform(mat4CreateAxisAngle(axis, angle), 1, 1, 0), 0, 1, -1)
    })
  })

  describe('mat4CreateAxisAngleValues', () => {
    it('creates rotation', () => {
      expectVec3(transform(mat4CreateAxisAngleValues(0, 1, 0, angle), 1, 1, 0), 0, 1, -1)
    })
  })

  describe('mat4$initYawPitchRoll', () => {
    it('sets rotation', () => {
      expectVec3(transform(mat4$initYawPitchRoll(mat4(), angle, angle, angle), 0, 0, -1), 0, 1, 0)
    })
    it('rotates yaw around y, pitch around x and roll around z', () => {
      const a = 0.7
      expectEquality(mat4$initYawPitchRoll(mat4(), a, 0, 0), mat4CreateRotationY(a))
      expectEquality(mat4$initYawPitchRoll(mat4(), 0, a, 0), mat4CreateRotationX(a))
      expectEquality(mat4$initYawPitchRoll(mat4(), 0, 0, a), mat4CreateRotationZ(a))
    })
    it('returns out', () => {
      const out = mat4()
      expect(mat4$initYawPitchRoll(out, angle, angle, angle)).toBe(out)
    })
  })

  describe('mat4CreateYawPitchRoll', () => {
    it('creates rotation', () => {
      expectVec3(transform(mat4CreateYawPitchRoll(angle, angle, angle), 0, 0, -1), 0, 1, 0)
    })
  })

  describe('mat4$initRotationX', () => {
    it('sets rotation', () => {
      const m = mat4$initRotationX(mat4(), angle)
      expectVec3(transform(m, 1, 0, 0), 1, 0, 0)
      expectVec3(transform(m, 0, 1, 0), 0, 0, 1)
      expectVec3(transform(m, 0, 0, 1), 0, -1, 0)
    })
    it('returns out', () => {
      const out = mat4()
      expect(mat4$initRotationX(out, angle)).toBe(out)
    })
  })

  describe('mat4CreateRotationX', () => {
    it('creates rotation', () => {
      expectVec3(transform(mat4CreateRotationX(angle), 0, 1, 0), 0, 0, 1)
    })
  })

  describe('mat4$initRotationY', () => {
    it('sets rotation', () => {
      const m = mat4$initRotationY(mat4(), angle)
      expectVec3(transform(m, 1, 0, 0), 0, 0, -1)
      expectVec3(transform(m, 0, 1, 0), 0, 1, 0)
      expectVec3(transform(m, 0, 0, 1), 1, 0, 0)
    })
    it('returns out', () => {
      const out = mat4()
      expect(mat4$initRotationY(out, angle)).toBe(out)
    })
  })

  describe('mat4CreateRotationY', () => {
    it('creates rotation', () => {
      expectVec3(transform(mat4CreateRotationY(angle), 1, 0, 0), 0, 0, -1)
    })
  })

  describe('mat4$initRotationZ', () => {
    it('sets rotation', () => {
      const m = mat4$initRotationZ(mat4(), angle)
      expectVec3(transform(m, 1, 0, 0), 0, 1, 0)
      expectVec3(transform(m, 0, 1, 0), -1, 0, 0)
      expectVec3(transform(m, 0, 0, 1), 0, 0, 1)
    })
    it('returns out', () => {
      const out = mat4()
      expect(mat4$initRotationZ(out, angle)).toBe(out)
    })
  })

  describe('mat4CreateRotationZ', () => {
    it('creates rotation', () => {
      expectVec3(transform(mat4CreateRotationZ(angle), 1, 0, 0), 0, 1, 0)
    })
  })

  describe('mat4$initScale', () => {
    it('sets scale', () => {
      expectComponents(mat4$initScale(sample(), vec3(1, 2, 3)), [1, 0, 0, 0, 0, 2, 0, 0, 0, 0, 3, 0, 0, 0, 0, 1])
    })
    it('returns out', () => {
      const out = mat4()
      expect(mat4$initScale(out, vec3(1, 2, 3))).toBe(out)
    })
  })

  describe('mat4$initScaleXYZ', () => {
    it('sets scale', () => {
      expectComponents(mat4$initScaleXYZ(sample(), 1, 2, 3), [1, 0, 0, 0, 0, 2, 0, 0, 0, 0, 3, 0, 0, 0, 0, 1])
    })
  })

  describe('mat4$initScaleUniform', () => {
    it('sets scale', () => {
      expectComponents(mat4$initScaleUniform(sample(), 2), [2, 0, 0, 0, 0, 2, 0, 0, 0, 0, 2, 0, 0, 0, 0, 1])
    })
  })

  describe('mat4CreateScale', () => {
    it('creates scale', () => {
      expectVec3(transform(mat4CreateScale(vec3(1, 2, 3)), 1, 2, 3), 1, 4, 9)
    })
  })

  describe('mat4CreateScaleXYZ', () => {
    it('creates scale', () => {
      expectVec3(transform(mat4CreateScaleXYZ(1, 2, 3), 1, 2, 3), 1, 4, 9)
    })
  })

  describe('mat4CreateScaleUniform', () => {
    it('creates scale', () => {
      expectVec3(transform(mat4CreateScaleUniform(2), 1, 2, 3), 2, 4, 6)
    })
  })

  describe('mat4$initTranslation', () => {
    it('sets translation', () => {
      expectComponents(
        mat4$initTranslation(sample(), vec3(1, 2, 3)),
        [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 1, 2, 3, 1],
      )
    })
    it('returns out', () => {
      const out = mat4()
      expect(mat4$initTranslation(out, vec3(1, 2, 3))).toBe(out)
    })
  })

  describe('mat4$initTranslationXYZ', () => {
    it('sets translation', () => {
      expectComponents(mat4$initTranslationXYZ(sample(), 1, 2, 3), [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 1, 2, 3, 1])
    })
  })

  describe('mat4CreateTranslation', () => {
    it('creates translation', () => {
      expectVec3(transform(mat4CreateTranslation(vec3(1, 2, 3)), 1, 0, 0), 2, 2, 3)
    })
  })

  describe('mat4CreateTranslationXYZ', () => {
    it('creates translation', () => {
      const m = mat4CreateTranslationXYZ(1, 2, 3)
      expectVec3(transform(m, 1, 0, 0), 2, 2, 3)
      expectVec3(transform(m, 0, 1, 0), 1, 3, 3)
      expectVec3(transform(m, 0, 0, 1), 1, 2, 4)
    })
  })

  describe('mat4$initOrientation', () => {
    it('looks along negative z', () => {
      const m = mat4$initOrientation(mat4(), { x: 0, y: 0, z: -1 }, { x: 0, y: 1, z: 0 })
      expectEquality(m, mat4CreateIdentity())
    })
    it('looks along positive x', () => {
      const m = mat4$initOrientation(mat4(), { x: 2, y: 0, z: 0 }, { x: 0, y: 1, z: 0 })
      expectVec3(mat4GetForward(m), 1, 0, 0)
      expectVec3(mat4GetUp(m), 0, 1, 0)
      expectVec3(mat4GetRight(m), 0, 0, 1)
      expectVec3(mat4GetTranslation(m), 0, 0, 0)
    })
    it('returns out', () => {
      const out = mat4()
      expect(mat4$initOrientation(out, { x: 0, y: 0, z: -1 }, { x: 0, y: 1, z: 0 })).toBe(out)
    })
  })

  describe('mat4CreateOrientation', () => {
    it('creates rotation', () => {
      const m = mat4CreateOrientation({ x: 0, y: 0, z: -1 }, { x: 0, y: 1, z: 0 })
      expectEquality(m, mat4CreateIdentity())
    })
  })

  describe('mat4$initWorld', () => {
    it('sets direction and translation', () => {
      const m = mat4$initWorld(mat4(), vec3(1, 2, 3), vec3.NegativeUnitX, vec3.UnitY)
      expectVec3(mat4GetRight(m), 0, 0, -1)
      expectVec3(mat4GetUp(m), 0, 1, 0)
      expectVec3(mat4GetBackward(m), 1, 0, 0)
      expectVec3(mat4GetTranslation(m), 1, 2, 3)
    })
    it('equals look at the point in forward direction', () => {
      expectEquality(
        mat4$initWorld(mat4(), vec3(1, 1, 1), vec3(-1, -1, -1), vec3.UnitY),
        mat4CreateLookAt(vec3(1, 1, 1), vec3.Zero, vec3.UnitY),
      )
    })
    it('returns out', () => {
      const out = mat4()
      expect(mat4$initWorld(out, vec3(1, 2, 3), vec3.NegativeUnitX, vec3.UnitY)).toBe(out)
    })
  })

  describe('mat4CreateWorld', () => {
    it('creates world transformation', () => {
      expectEquality(
        mat4CreateWorld(vec3(1, 1, 1), vec3(-1, -1, -1), vec3.UnitY),
        mat4CreateLookAt(vec3(1, 1, 1), vec3.Zero, vec3.UnitY),
      )
    })
  })

  describe('mat4$initLookAt', () => {
    it('sets rotation towards target', () => {
      expectEquality(mat4$initLookAt(mat4(), vec3.Zero, vec3.UnitX, vec3.UnitY), mat4CreateRotationY(-angle))
      expectEquality(mat4$initLookAt(mat4(), vec3.Zero, vec3.NegativeUnitX, vec3.UnitY), mat4CreateRotationY(angle))
      expectEquality(mat4$initLookAt(mat4(), vec3.Zero, vec3.NegativeUnitZ, vec3.UnitY), mat4CreateRotationY(0))
      expectEquality(mat4$initLookAt(mat4(), vec3.Zero, vec3.UnitZ, vec3.UnitY), mat4CreateRotationY(Math.PI))
    })
    it('sets translation to position', () => {
      expectVec3(mat4GetTranslation(mat4$initLookAt(mat4(), vec3(1, 2, 3), vec3.Zero, vec3.UnitY)), 1, 2, 3)
    })
    it('returns out', () => {
      const out = mat4()
      expect(mat4$initLookAt(out, vec3.Zero, vec3.UnitX, vec3.UnitY)).toBe(out)
    })
  })

  describe('mat4CreateLookAt', () => {
    it('creates rotation towards target', () => {
      expectEquality(mat4CreateLookAt(vec3.Zero, vec3.UnitX, vec3.UnitY), mat4CreateRotationY(-angle))
    })
  })

  describe('projection', () => {
    // near and far plane distances, the camera looks along negative z
    const n = 1
    const f = 10
    // [name, ndcMinZ, reversedZ, depth at near plane, depth at far plane]
    const depths: Array<[string, NdcMinZ, boolean, number, number]> = [
      ['WebGL', NdcMinZ.MinusOne, false, -1, 1],
      ['WebGPU', NdcMinZ.Zero, false, 0, 1],
      ['reversed z', NdcMinZ.Zero, true, 1, 0],
    ]

    describe('mat4$initPerspective', () => {
      for (const [name, ndcMinZ, reversedZ, near, far] of depths) {
        it(`maps near and far plane to depth range for ${name}`, () => {
          const m = mat4$initPerspective(mat4(), 4, 2, n, f, ndcMinZ, reversedZ)
          expect(transform(m, 0, 0, -n).z).toBeCloseTo(near, 5)
          expect(transform(m, 0, 0, -f).z).toBeCloseTo(far, 5)
        })
      }
      it('maps edges at near plane to -1 and 1', () => {
        const m = mat4$initPerspective(mat4(), 4, 2, n, f, NdcMinZ.MinusOne)
        expectVec2(transform(m, 2, 1, -n), 1, 1)
        expectVec2(transform(m, -2, -1, -n), -1, -1)
      })
      it('equals field of view version', () => {
        // 90 degree field of view with aspect 2 has a view volume of 4 x 2 at distance 1
        expectEquality(
          mat4$initPerspective(mat4(), 4, 2, 1, f, NdcMinZ.Zero),
          mat4CreatePerspectiveFieldOfView(angle, 2, 1, f, NdcMinZ.Zero),
        )
      })
      it('returns out', () => {
        const out = mat4()
        expect(mat4$initPerspective(out, 2, 2, n, f, NdcMinZ.MinusOne)).toBe(out)
      })
    })

    describe('mat4CreatePerspective', () => {
      it('creates projection', () => {
        expectEquality(
          mat4CreatePerspective(2, 2, n, f, NdcMinZ.MinusOne),
          mat4$initPerspective(mat4(), 2, 2, n, f, NdcMinZ.MinusOne),
        )
      })
    })

    describe('mat4$initPerspectiveFieldOfView', () => {
      for (const [name, ndcMinZ, reversedZ, near, far] of depths) {
        it(`maps near and far plane to depth range for ${name}`, () => {
          const m = mat4$initPerspectiveFieldOfView(mat4(), angle, 2, n, f, ndcMinZ, reversedZ)
          expect(transform(m, 0, 0, -n).z).toBeCloseTo(near, 5)
          expect(transform(m, 0, 0, -f).z).toBeCloseTo(far, 5)
        })
      }
      it('maps edges of the field of view to -1 and 1', () => {
        // with 90 degree field of view the edges at distance d are at y = d and x = d * aspect
        const m = mat4$initPerspectiveFieldOfView(mat4(), angle, 2, n, f, NdcMinZ.MinusOne)
        expectVec2(transform(m, 10, 5, -5), 1, 1)
        expectVec2(transform(m, -10, -5, -5), -1, -1)
      })
      it('returns out', () => {
        const out = mat4()
        expect(mat4$initPerspectiveFieldOfView(out, angle, 2, n, f, NdcMinZ.MinusOne)).toBe(out)
      })
    })

    describe('mat4CreatePerspectiveFieldOfView', () => {
      it('creates projection', () => {
        expectEquality(
          mat4CreatePerspectiveFieldOfView(angle, 2, n, f, NdcMinZ.Zero),
          mat4$initPerspectiveFieldOfView(mat4(), angle, 2, n, f, NdcMinZ.Zero),
        )
      })
    })

    describe('mat4$initPerspectiveOffCenter', () => {
      for (const [name, ndcMinZ, reversedZ, near, far] of depths) {
        it(`maps near and far plane to depth range for ${name}`, () => {
          const m = mat4$initPerspectiveOffCenter(mat4(), -1, 1, -1, 1, n, f, ndcMinZ, reversedZ)
          expect(transform(m, 0, 0, -n).z).toBeCloseTo(near, 5)
          expect(transform(m, 0, 0, -f).z).toBeCloseTo(far, 5)
        })
      }
      it('maps edges at near plane to -1 and 1', () => {
        const m = mat4$initPerspectiveOffCenter(mat4(), 1, 3, 2, 6, n, f, NdcMinZ.MinusOne)
        expectVec2(transform(m, 1, 2, -n), -1, -1)
        expectVec2(transform(m, 3, 6, -n), 1, 1)
      })
      it('returns out', () => {
        const out = mat4()
        expect(mat4$initPerspectiveOffCenter(out, -1, 1, -1, 1, n, f, NdcMinZ.MinusOne)).toBe(out)
      })
    })

    describe('mat4CreatePerspectiveOffCenter', () => {
      it('creates projection', () => {
        expectEquality(
          mat4CreatePerspectiveOffCenter(1, 3, 2, 6, n, f, NdcMinZ.Zero),
          mat4$initPerspectiveOffCenter(mat4(), 1, 3, 2, 6, n, f, NdcMinZ.Zero),
        )
      })
    })

    describe('mat4$initOrthographic', () => {
      for (const [name, ndcMinZ, reversedZ, near, far] of depths) {
        it(`maps near and far plane to depth range for ${name}`, () => {
          const m = mat4$initOrthographic(mat4(), 4, 2, n, f, ndcMinZ, reversedZ)
          expect(transform(m, 0, 0, -n).z).toBeCloseTo(near, 5)
          expect(transform(m, 0, 0, -f).z).toBeCloseTo(far, 5)
        })
      }
      it('maps edges to -1 and 1', () => {
        const m = mat4$initOrthographic(mat4(), 4, 2, n, f, NdcMinZ.MinusOne)
        expectVec2(transform(m, 2, 1, -n), 1, 1)
        expectVec2(transform(m, -2, -1, -f), -1, -1)
      })
      it('returns out', () => {
        const out = mat4()
        expect(mat4$initOrthographic(out, 4, 2, n, f, NdcMinZ.MinusOne)).toBe(out)
      })
    })

    describe('mat4CreateOrthographic', () => {
      it('creates projection', () => {
        expectEquality(
          mat4CreateOrthographic(4, 2, n, f, NdcMinZ.Zero),
          mat4$initOrthographic(mat4(), 4, 2, n, f, NdcMinZ.Zero),
        )
      })
    })

    describe('mat4$initOrthographicOffCenter', () => {
      for (const [name, ndcMinZ, reversedZ, near, far] of depths) {
        it(`maps near and far plane to depth range for ${name}`, () => {
          const m = mat4$initOrthographicOffCenter(mat4(), -1, 1, -1, 1, n, f, ndcMinZ, reversedZ)
          expect(transform(m, 0, 0, -n).z).toBeCloseTo(near, 5)
          expect(transform(m, 0, 0, -f).z).toBeCloseTo(far, 5)
        })
      }
      it('maps edges to -1 and 1', () => {
        const m = mat4$initOrthographicOffCenter(mat4(), 1, 3, 2, 6, n, f, NdcMinZ.MinusOne)
        expectVec2(transform(m, 1, 2, -n), -1, -1)
        expectVec2(transform(m, 3, 6, -f), 1, 1)
      })
      it('returns out', () => {
        const out = mat4()
        expect(mat4$initOrthographicOffCenter(out, -1, 1, -1, 1, n, f, NdcMinZ.MinusOne)).toBe(out)
      })
    })

    describe('mat4CreateOrthographicOffCenter', () => {
      it('creates projection', () => {
        expectEquality(
          mat4CreateOrthographicOffCenter(1, 3, 2, 6, n, f, NdcMinZ.Zero),
          mat4$initOrthographicOffCenter(mat4(), 1, 3, 2, 6, n, f, NdcMinZ.Zero),
        )
      })
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
    const r = mat4CreateAxisAngle(n, a)
    const cases: Array<[string, (m: Mat4) => Mat4, (m: Mat4) => Mat4, Mat4]> = [
      ['X', (m) => mat4$rotateX(m, a), (m) => mat4$preRotateX(m, a), mat4CreateRotationX(a)],
      ['Y', (m) => mat4$rotateY(m, a), (m) => mat4$preRotateY(m, a), mat4CreateRotationY(a)],
      ['Z', (m) => mat4$rotateZ(m, a), (m) => mat4$preRotateZ(m, a), mat4CreateRotationZ(a)],
      ['ByQuat', (m) => mat4$rotateByQuat(m, q), (m) => mat4$preRotateByQuat(m, q), r],
      [
        'ByQuatValues',
        (m) => mat4$rotateByQuatValues(m, q.x, q.y, q.z, q.w),
        (m) => mat4$preRotateByQuatValues(m, q.x, q.y, q.z, q.w),
        r,
      ],
      ['ByAxisAngle', (m) => mat4$rotateByAxisAngle(m, n, a), (m) => mat4$preRotateByAxisAngle(m, n, a), r],
      [
        'ByAxisAngleValues',
        (m) => mat4$rotateByAxisAngleValues(m, n.x, n.y, n.z, a),
        (m) => mat4$preRotateByAxisAngleValues(m, n.x, n.y, n.z, a),
        r,
      ],
      [
        'YawPitchRoll',
        (m) => mat4$rotateYawPitchRoll(m, 0.3, 0.5, 0.7),
        (m) => mat4$preRotateYawPitchRoll(m, 0.3, 0.5, 0.7),
        mat4CreateYawPitchRoll(0.3, 0.5, 0.7),
      ],
    ]

    for (const [name, rotate, preRotate, rotation] of cases) {
      describe(`mat4$rotate${name}`, () => {
        it('multiplies rotation from the right', () => {
          expectEquality(rotate(sample()), mat4Multiply(sample(), rotation))
        })
        it('keeps translation', () => {
          expectVec3(mat4GetTranslation(rotate(mat4CreateTranslationXYZ(1, 2, 3))), 1, 2, 3)
        })
        it('returns out', () => {
          const out = sample()
          expect(rotate(out)).toBe(out)
        })
      })

      describe(`mat4$preRotate${name}`, () => {
        it('multiplies rotation from the left', () => {
          expectEquality(preRotate(sample()), mat4Multiply(rotation, sample()))
        })
        it('rotates translation', () => {
          const t = mat4TransformPoint3(rotation, vec3(1, 2, 3))
          expectVec3(mat4GetTranslation(preRotate(mat4CreateTranslationXYZ(1, 2, 3))), t.x, t.y, t.z)
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
    const cases: Array<[string, (m: Mat4) => Mat4, Mat4]> = [
      ['mat4$scale', (m) => mat4$scale(m, vec3(2, 3, 4)), mat4CreateScaleXYZ(2, 3, 4)],
      ['mat4$scaleXYZ', (m) => mat4$scaleXYZ(m, 2, 3, 4), mat4CreateScaleXYZ(2, 3, 4)],
      ['mat4$scaleX', (m) => mat4$scaleX(m, 2), mat4CreateScaleXYZ(2, 1, 1)],
      ['mat4$scaleY', (m) => mat4$scaleY(m, 3), mat4CreateScaleXYZ(1, 3, 1)],
      ['mat4$scaleZ', (m) => mat4$scaleZ(m, 4), mat4CreateScaleXYZ(1, 1, 4)],
      ['mat4$scaleUniform', (m) => mat4$scaleUniform(m, 2), mat4CreateScaleUniform(2)],
    ]
    const preCases: Array<[string, (m: Mat4) => Mat4, Mat4]> = [
      ['mat4$preScale', (m) => mat4$preScale(m, vec3(2, 3, 4)), mat4CreateScaleXYZ(2, 3, 4)],
      ['mat4$preScaleXYZ', (m) => mat4$preScaleXYZ(m, 2, 3, 4), mat4CreateScaleXYZ(2, 3, 4)],
      ['mat4$preScaleX', (m) => mat4$preScaleX(m, 2), mat4CreateScaleXYZ(2, 1, 1)],
      ['mat4$preScaleY', (m) => mat4$preScaleY(m, 3), mat4CreateScaleXYZ(1, 3, 1)],
      ['mat4$preScaleZ', (m) => mat4$preScaleZ(m, 4), mat4CreateScaleXYZ(1, 1, 4)],
      ['mat4$preScaleUniform', (m) => mat4$preScaleUniform(m, 2), mat4CreateScaleUniform(2)],
    ]

    for (const [name, scale, scaling] of cases) {
      describe(name, () => {
        it('multiplies scale from the right', () => {
          expectEquality(scale(sample()), mat4Multiply(sample(), scaling))
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
          expectEquality(preScale(sample()), mat4Multiply(scaling, sample()))
        })
        it('returns out', () => {
          const out = sample()
          expect(preScale(out)).toBe(out)
        })
      })
    }
  })

  describe('translate', () => {
    // translate multiplies from the right: M * T
    // preTranslate multiplies from the left: T * M
    const cases: Array<[string, (m: Mat4) => Mat4, Mat4]> = [
      ['mat4$translate', (m) => mat4$translate(m, vec3(2, 3, 4)), mat4CreateTranslationXYZ(2, 3, 4)],
      ['mat4$translateXYZ', (m) => mat4$translateXYZ(m, 2, 3, 4), mat4CreateTranslationXYZ(2, 3, 4)],
      ['mat4$translateX', (m) => mat4$translateX(m, 2), mat4CreateTranslationXYZ(2, 0, 0)],
      ['mat4$translateY', (m) => mat4$translateY(m, 3), mat4CreateTranslationXYZ(0, 3, 0)],
      ['mat4$translateZ', (m) => mat4$translateZ(m, 4), mat4CreateTranslationXYZ(0, 0, 4)],
    ]
    const preCases: Array<[string, (m: Mat4) => Mat4, Mat4]> = [
      ['mat4$preTranslate', (m) => mat4$preTranslate(m, vec3(2, 3, 4)), mat4CreateTranslationXYZ(2, 3, 4)],
      ['mat4$preTranslateXYZ', (m) => mat4$preTranslateXYZ(m, 2, 3, 4), mat4CreateTranslationXYZ(2, 3, 4)],
      ['mat4$preTranslateX', (m) => mat4$preTranslateX(m, 2), mat4CreateTranslationXYZ(2, 0, 0)],
      ['mat4$preTranslateY', (m) => mat4$preTranslateY(m, 3), mat4CreateTranslationXYZ(0, 3, 0)],
      ['mat4$preTranslateZ', (m) => mat4$preTranslateZ(m, 4), mat4CreateTranslationXYZ(0, 0, 4)],
    ]

    for (const [name, translate, translation] of cases) {
      describe(name, () => {
        it('multiplies translation from the right', () => {
          expectEquality(translate(sample()), mat4Multiply(sample(), translation))
        })
        it('returns out', () => {
          const out = sample()
          expect(translate(out)).toBe(out)
        })
      })
    }

    for (const [name, preTranslate, translation] of preCases) {
      describe(name, () => {
        it('multiplies translation from the left', () => {
          expectEquality(preTranslate(sample()), mat4Multiply(translation, sample()))
        })
        it('returns out', () => {
          const out = sample()
          expect(preTranslate(out)).toBe(out)
        })
      })
    }
  })

  describe('directions', () => {
    // sample columns: right (1, 2, 3), up (5, 6, 7), backward (9, 10, 11), translation (13, 14, 15)
    const vec = () => vec3(21, 22, 23)
    const cases: Array<[string, (m: Mat4, out?: IVec3) => IVec3, (m: Mat4, v: IVec3) => Mat4, number[], number[]]> = [
      ['Right', mat4GetRight, mat4$setRight, [1, 2, 3], [21, 22, 23, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]],
      ['Left', mat4GetLeft, mat4$setLeft, [-1, -2, -3], [-21, -22, -23, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]],
      ['Up', mat4GetUp, mat4$setUp, [5, 6, 7], [1, 2, 3, 4, 21, 22, 23, 8, 9, 10, 11, 12, 13, 14, 15, 16]],
      ['Down', mat4GetDown, mat4$setDown, [-5, -6, -7], [1, 2, 3, 4, -21, -22, -23, 8, 9, 10, 11, 12, 13, 14, 15, 16]],
      [
        'Backward',
        mat4GetBackward,
        mat4$setBackward,
        [9, 10, 11],
        [1, 2, 3, 4, 5, 6, 7, 8, 21, 22, 23, 12, 13, 14, 15, 16],
      ],
      [
        'Forward',
        mat4GetForward,
        mat4$setForward,
        [-9, -10, -11],
        [1, 2, 3, 4, 5, 6, 7, 8, -21, -22, -23, 12, 13, 14, 15, 16],
      ],
      [
        'Translation',
        mat4GetTranslation,
        mat4$setTranslation,
        [13, 14, 15],
        [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 21, 22, 23, 16],
      ],
    ]

    for (const [name, get, set, direction, components] of cases) {
      describe(`mat4Get${name}`, () => {
        it('gets vector', () => {
          expectVec3(get(sample()), direction[0], direction[1], direction[2])
        })
        it('writes to out', () => {
          const out = vec3()
          expect(get(sample(), out)).toBe(out)
          expectVec3(out, direction[0], direction[1], direction[2])
        })
      })

      describe(`mat4$set${name}`, () => {
        it('sets vector', () => {
          expectComponents(set(sample(), vec()), components)
        })
        it('returns out', () => {
          const out = sample()
          expect(set(out, vec())).toBe(out)
        })
      })
    }
  })

  describe('mat4$setTranslationXYZ', () => {
    it('sets translation', () => {
      expectComponents(
        mat4$setTranslationXYZ(sample(), 21, 22, 23),
        [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 21, 22, 23, 16],
      )
    })
  })

  describe('mat4GetTranslationX', () => {
    it('gets x translation', () => {
      expect(mat4GetTranslationX(sample())).toBe(13)
    })
  })

  describe('mat4GetTranslationY', () => {
    it('gets y translation', () => {
      expect(mat4GetTranslationY(sample())).toBe(14)
    })
  })

  describe('mat4GetTranslationZ', () => {
    it('gets z translation', () => {
      expect(mat4GetTranslationZ(sample())).toBe(15)
    })
  })

  describe('mat4$setTranslationX', () => {
    it('sets x translation', () => {
      expectComponents(mat4$setTranslationX(sample(), 21), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 21, 14, 15, 16])
    })
  })

  describe('mat4$setTranslationY', () => {
    it('sets y translation', () => {
      expectComponents(mat4$setTranslationY(sample(), 22), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 22, 15, 16])
    })
  })

  describe('mat4$setTranslationZ', () => {
    it('sets z translation', () => {
      expectComponents(mat4$setTranslationZ(sample(), 23), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 23, 16])
    })
  })

  describe('mat4GetScale', () => {
    it('gets scale', () => {
      expectVec3(mat4GetScale(sample()), 1, 6, 11)
    })
    it('writes to out', () => {
      const out = vec3()
      expect(mat4GetScale(sample(), out)).toBe(out)
      expectVec3(out, 1, 6, 11)
    })
  })

  describe('mat4$setScale', () => {
    it('sets scale', () => {
      expectComponents(
        mat4$setScale(sample(), vec3(21, 22, 23)),
        [21, 2, 3, 4, 5, 22, 7, 8, 9, 10, 23, 12, 13, 14, 15, 16],
      )
    })
    it('returns out', () => {
      const out = sample()
      expect(mat4$setScale(out, vec3(21, 22, 23))).toBe(out)
    })
  })

  describe('mat4$setScaleXYZ', () => {
    it('sets scale', () => {
      expectComponents(mat4$setScaleXYZ(sample(), 21, 22, 23), [21, 2, 3, 4, 5, 22, 7, 8, 9, 10, 23, 12, 13, 14, 15, 16])
    })
  })

  describe('mat4$setScaleX', () => {
    it('sets x scale', () => {
      expectComponents(mat4$setScaleX(sample(), 21), [21, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16])
    })
  })

  describe('mat4$setScaleY', () => {
    it('sets y scale', () => {
      expectComponents(mat4$setScaleY(sample(), 22), [1, 2, 3, 4, 5, 22, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16])
    })
  })

  describe('mat4$setScaleZ', () => {
    it('sets z scale', () => {
      expectComponents(mat4$setScaleZ(sample(), 23), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 23, 12, 13, 14, 15, 16])
    })
  })

  describe('mat4GetRow', () => {
    it('gets row', () => {
      expectVec4(mat4GetRow(sample(), 1), 2, 6, 10, 14)
    })
    it('writes to out', () => {
      const out = vec4()
      expect(mat4GetRow(sample(), 1, out)).toBe(out)
    })
  })

  describe('mat4GetCol', () => {
    it('gets column', () => {
      expectVec4(mat4GetCol(sample(), 1), 5, 6, 7, 8)
    })
    it('writes to out', () => {
      const out = vec4()
      expect(mat4GetCol(sample(), 1, out)).toBe(out)
    })
  })

  describe('mat4Copy', () => {
    it('copies components', () => {
      const m = sample()
      const result = mat4Copy(m)
      expectComponents(result, sampleParts)
      expect(result).not.toBe(m)
    })
    it('writes to out', () => {
      const out = mat4()
      expect(mat4Copy(sample(), out)).toBe(out)
      expectComponents(out, sampleParts)
    })
  })

  describe('mat4Equals', () => {
    it('compares components', () => {
      expect(mat4Equals(sample(), sample())).toBe(true)
      for (let i = 0; i < 16; i++) {
        const other = sample()
        other[i] = 100
        expect(mat4Equals(sample(), other), `component ${i}`).toBe(false)
      }
    })
  })

  describe('mat4Determinant', () => {
    it('calculates determinant', () => {
      expect(mat4Determinant(invertible())).toBeCloseTo(450, 3)
    })
  })

  describe('mat4$transpose', () => {
    it('transposes in place', () => {
      expectComponents(mat4$transpose(sample()), [1, 5, 9, 13, 2, 6, 10, 14, 3, 7, 11, 15, 4, 8, 12, 16])
    })
    it('returns out', () => {
      const out = sample()
      expect(mat4$transpose(out)).toBe(out)
    })
  })

  describe('mat4Transpose', () => {
    it('transposes', () => {
      const m = sample()
      expectComponents(mat4Transpose(m), [1, 5, 9, 13, 2, 6, 10, 14, 3, 7, 11, 15, 4, 8, 12, 16])
      expectComponents(m, sampleParts)
    })
    it('writes to out', () => {
      const out = mat4()
      expect(mat4Transpose(sample(), out)).toBe(out)
    })
  })

  describe('mat4$invert', () => {
    it('inverts in place', () => {
      expectEquality(mat4Multiply(mat4$invert(invertible()), invertible()), mat4CreateIdentity())
    })
    it('returns out', () => {
      const out = invertible()
      expect(mat4$invert(out)).toBe(out)
    })
  })

  describe('mat4Invert', () => {
    it('A * inv(A) is identity', () => {
      expectEquality(mat4Multiply(invertible(), mat4Invert(invertible())), mat4CreateIdentity())
    })
    it('inverts twice to original', () => {
      expectEquality(mat4Invert(mat4Invert(invertible())), invertible())
    })
    it('writes to out', () => {
      const out = mat4()
      expect(mat4Invert(invertible(), out)).toBe(out)
    })
  })

  describe('mat4$negate', () => {
    it('negates in place', () => {
      expectComponents(mat4$negate(sample()), sampleParts.map((v) => -v))
    })
    it('returns out', () => {
      const out = sample()
      expect(mat4$negate(out)).toBe(out)
    })
  })

  describe('mat4Negate', () => {
    it('negates', () => {
      expectComponents(mat4Negate(sample()), sampleParts.map((v) => -v))
    })
    it('writes to out', () => {
      const out = mat4()
      expect(mat4Negate(sample(), out)).toBe(out)
    })
  })

  describe('mat4$add', () => {
    it('adds in place', () => {
      expectComponents(mat4$add(sample(), sample()), sampleParts.map((v) => v + v))
    })
    it('returns out', () => {
      const out = sample()
      expect(mat4$add(out, sample())).toBe(out)
    })
  })

  describe('mat4Add', () => {
    it('adds', () => {
      expectComponents(mat4Add(sample(), sample()), sampleParts.map((v) => v + v))
    })
    it('writes to out', () => {
      const out = mat4()
      expect(mat4Add(sample(), sample(), out)).toBe(out)
    })
  })

  describe('mat4$addScalar', () => {
    it('adds in place', () => {
      expectComponents(mat4$addScalar(sample(), 10), sampleParts.map((v) => v + 10))
    })
    it('returns out', () => {
      const out = sample()
      expect(mat4$addScalar(out, 10)).toBe(out)
    })
  })

  describe('mat4AddScalar', () => {
    it('adds', () => {
      expectComponents(mat4AddScalar(sample(), 10), sampleParts.map((v) => v + 10))
    })
    it('writes to out', () => {
      const out = mat4()
      expect(mat4AddScalar(sample(), 10, out)).toBe(out)
    })
  })

  describe('mat4$subtract', () => {
    it('subtracts in place', () => {
      expectComponents(mat4$subtract(sample(), mat4CreateFill(1)), sampleParts.map((v) => v - 1))
    })
    it('returns out', () => {
      const out = sample()
      expect(mat4$subtract(out, sample())).toBe(out)
    })
  })

  describe('mat4Subtract', () => {
    it('subtracts', () => {
      expectComponents(mat4Subtract(sample(), mat4CreateFill(1)), sampleParts.map((v) => v - 1))
    })
    it('writes to out', () => {
      const out = mat4()
      expect(mat4Subtract(sample(), sample(), out)).toBe(out)
    })
  })

  describe('mat4$subtractScalar', () => {
    it('subtracts in place', () => {
      expectComponents(mat4$subtractScalar(sample(), 10), sampleParts.map((v) => v - 10))
    })
    it('returns out', () => {
      const out = sample()
      expect(mat4$subtractScalar(out, 10)).toBe(out)
    })
  })

  describe('mat4SubtractScalar', () => {
    it('subtracts', () => {
      expectComponents(mat4SubtractScalar(sample(), 10), sampleParts.map((v) => v - 10))
    })
    it('writes to out', () => {
      const out = mat4()
      expect(mat4SubtractScalar(sample(), 10, out)).toBe(out)
    })
  })

  describe('mat4$multiplyScalar', () => {
    it('multiplies in place', () => {
      expectComponents(mat4$multiplyScalar(sample(), 10), sampleParts.map((v) => v * 10))
    })
    it('returns out', () => {
      const out = sample()
      expect(mat4$multiplyScalar(out, 10)).toBe(out)
    })
  })

  describe('mat4MultiplyScalar', () => {
    it('multiplies', () => {
      expectComponents(mat4MultiplyScalar(sample(), 10), sampleParts.map((v) => v * 10))
    })
    it('writes to out', () => {
      const out = mat4()
      expect(mat4MultiplyScalar(sample(), 10, out)).toBe(out)
    })
  })

  describe('mat4$divide', () => {
    it('divides in place', () => {
      expectComponents(mat4$divide(sample(), mat4CreateFill(2)), sampleParts.map((v) => v / 2))
    })
    it('returns out', () => {
      const out = sample()
      expect(mat4$divide(out, sample())).toBe(out)
    })
  })

  describe('mat4Divide', () => {
    it('divides', () => {
      expectComponents(mat4Divide(sample(), mat4CreateFill(2)), sampleParts.map((v) => v / 2))
    })
    it('writes to out', () => {
      const out = mat4()
      expect(mat4Divide(sample(), sample(), out)).toBe(out)
    })
  })

  describe('mat4$divideScalar', () => {
    it('divides in place', () => {
      expectComponents(mat4$divideScalar(sample(), 10), sampleParts.map((v) => v / 10))
    })
    it('returns out', () => {
      const out = sample()
      expect(mat4$divideScalar(out, 10)).toBe(out)
    })
  })

  describe('mat4DivideScalar', () => {
    it('divides', () => {
      expectComponents(mat4DivideScalar(sample(), 10), sampleParts.map((v) => v / 10))
    })
    it('writes to out', () => {
      const out = mat4()
      expect(mat4DivideScalar(sample(), 10, out)).toBe(out)
    })
  })

  describe('mat4Multiply', () => {
    it('A * inv(A) is identity', () => {
      expectEquality(mat4Multiply(invertible(), mat4Invert(invertible())), mat4CreateIdentity())
    })
    it('multiply(A, B) transforms like A * B', () => {
      const a = mat4CreateRotationX(angle)
      const b = mat4CreateTranslationXYZ(1, 2, 3)
      const v = transform(mat4Multiply(a, b), 1, 1, 1)
      const expected = mat4TransformPoint3(a, transform(b, 1, 1, 1))
      expectVec3(v, expected.x, expected.y, expected.z)
    })
    it('writes to out', () => {
      const out = mat4()
      expect(mat4Multiply(sample(), sample(), out)).toBe(out)
    })
  })

  describe('mat4$multiply', () => {
    it('multiplies in place: A = A * B', () => {
      const a = mat4CreateRotationX(angle)
      const b = mat4CreateTranslationXYZ(1, 2, 3)
      expectEquality(mat4$multiply(mat4Copy(a), b), mat4Multiply(a, b))
    })
    it('returns out', () => {
      const out = sample()
      expect(mat4$multiply(out, sample())).toBe(out)
    })
  })

  describe('mat4Premultiply', () => {
    it('premultiply(A, B) is B * A', () => {
      const a = mat4CreateRotationX(angle)
      const b = mat4CreateTranslationXYZ(1, 2, 3)
      expectEquality(mat4Premultiply(a, b), mat4Multiply(b, a))
    })
    it('writes to out', () => {
      const out = mat4()
      expect(mat4Premultiply(sample(), sample(), out)).toBe(out)
    })
  })

  describe('mat4$premultiply', () => {
    it('multiplies in place: A = B * A', () => {
      const a = mat4CreateRotationX(angle)
      const b = mat4CreateTranslationXYZ(1, 2, 3)
      expectEquality(mat4$premultiply(mat4Copy(a), b), mat4Multiply(b, a))
    })
    it('returns out', () => {
      const out = sample()
      expect(mat4$premultiply(out, sample())).toBe(out)
    })
  })

  describe('mat4Lerp', () => {
    it('interpolates components', () => {
      const b = mat4CreateFromArray(sampleParts.map((v) => v + 2))
      expectComponents(mat4Lerp(sample(), b, 0.5), sampleParts.map((v) => v + 1))
    })
    it('writes to out', () => {
      const out = mat4()
      expect(mat4Lerp(sample(), sample(), 0.5, out)).toBe(out)
    })
  })

  describe('mat4Smooth', () => {
    const b = () => mat4CreateFromArray(sampleParts.map((v) => v + 2))
    it('interpolates components', () => {
      expectComponents(mat4Smooth(sample(), b(), 0.5), sampleParts.map((v) => v + 1))
    })
    it('clamps t to [0, 1]', () => {
      expectComponents(mat4Smooth(sample(), b(), 2), sampleParts.map((v) => v + 2))
      expectComponents(mat4Smooth(sample(), b(), -1), sampleParts)
    })
  })

  describe('mat4TransformPoint2', () => {
    it('applies rotation and translation', () => {
      expectVec2(mat4TransformPoint2(mat4CreateRotationZ(angle), vec2(1, 0)), 0, 1)
      expectVec2(mat4TransformPoint2(mat4CreateTranslationXYZ(1, 2, 3), vec2(0, 0)), 1, 2)
    })
    it('divides by w', () => {
      const m = mat4CreateIdentity()
      m[15] = 2
      expectVec2(mat4TransformPoint2(m, vec2(2, 4)), 1, 2)
    })
    it('writes to out', () => {
      const out = vec2()
      expect(mat4TransformPoint2(sample(), vec2(1, 0), out)).toBe(out)
    })
  })

  describe('mat4TransformPoint3', () => {
    it('applies rotation and translation', () => {
      expectVec3(mat4TransformPoint3(mat4CreateRotationZ(angle), vec3(1, 0, 0)), 0, 1, 0)
      expectVec3(mat4TransformPoint3(mat4CreateTranslationXYZ(1, 2, 3), vec3(0, 0, 0)), 1, 2, 3)
    })
    it('divides by w', () => {
      const m = mat4CreateIdentity()
      m[15] = 2
      expectVec3(mat4TransformPoint3(m, vec3(2, 4, 6)), 1, 2, 3)
    })
    it('writes to out', () => {
      const out = vec3()
      expect(mat4TransformPoint3(sample(), vec3(1, 0, 0), out)).toBe(out)
    })
  })

  describe('mat4ApplyToVec3', () => {
    it('applies rotation and translation', () => {
      expectVec3(mat4ApplyToVec3(mat4CreateRotationZ(angle), vec3(1, 0, 0)), 0, 1, 0)
      expectVec3(mat4ApplyToVec3(mat4CreateTranslationXYZ(1, 2, 3), vec3(0, 0, 0)), 1, 2, 3)
    })
    it('does not divide by w', () => {
      const m = mat4CreateIdentity()
      m[15] = 2
      expectVec3(mat4ApplyToVec3(m, vec3(2, 4, 6)), 2, 4, 6)
    })
    it('writes to out', () => {
      const out = vec3()
      expect(mat4ApplyToVec3(sample(), vec3(1, 0, 0), out)).toBe(out)
    })
  })

  describe('mat4TransformNormal2', () => {
    it('applies rotation', () => {
      expectVec2(mat4TransformNormal2(mat4CreateRotationZ(angle), vec2(1, 0)), 0, 1)
      expectVec2(mat4TransformNormal2(mat4CreateRotationZ(angle), vec2(0, 1)), -1, 0)
    })
    it('ignores translation', () => {
      expectVec2(mat4TransformNormal2(mat4CreateTranslationXYZ(1, 2, 3), vec2(1, 0)), 1, 0)
    })
    it('writes to out', () => {
      const out = vec2()
      expect(mat4TransformNormal2(sample(), vec2(1, 0), out)).toBe(out)
    })
  })

  describe('mat4TransformNormal3', () => {
    it('applies rotation', () => {
      expectVec3(mat4TransformNormal3(mat4CreateRotationX(angle), vec3(0, 1, 0)), 0, 0, 1)
      expectVec3(mat4TransformNormal3(mat4CreateRotationY(angle), vec3(1, 0, 0)), 0, 0, -1)
      expectVec3(mat4TransformNormal3(mat4CreateRotationZ(angle), vec3(1, 0, 0)), 0, 1, 0)
    })
    it('ignores translation', () => {
      expectVec3(mat4TransformNormal3(mat4CreateTranslationXYZ(1, 2, 3), vec3(1, 0, 0)), 1, 0, 0)
    })
    it('writes to out', () => {
      const out = vec3()
      expect(mat4TransformNormal3(sample(), vec3(1, 0, 0), out)).toBe(out)
    })
  })

  describe('mat4TransformNormal3Abs', () => {
    it('uses absolute values of the matrix', () => {
      expectVec3(mat4TransformNormal3Abs(mat4CreateRotationZ(angle), vec3(1, 2, 3)), 2, 1, 3)
    })
    it('ignores translation', () => {
      expectVec3(mat4TransformNormal3Abs(mat4CreateTranslationXYZ(1, 2, 3), vec3(1, 2, 3)), 1, 2, 3)
    })
    it('writes to out', () => {
      const out = vec3()
      expect(mat4TransformNormal3Abs(sample(), vec3(1, 0, 0), out)).toBe(out)
    })
  })

  describe('mat4ApplyToVec2Array', () => {
    it('transforms all points', () => {
      const array = [1, 0, 1, 0, 1, 0]
      mat4ApplyToVec2Array(mat4CreateRotationZ(angle), array)
      expectArray(array, [0, 1, 0, 1, 0, 1])
    })
    it('applies translation', () => {
      const array = [1, 2]
      mat4ApplyToVec2Array(mat4CreateTranslationXYZ(5, 6, 7), array)
      expectArray(array, [6, 8])
    })
    it('uses offset, stride and count', () => {
      const array = [9, 1, 0, 9, 1, 0, 9, 1, 0]
      mat4ApplyToVec2Array(mat4CreateRotationZ(angle), array, 1, 3, 2)
      expectArray(array, [9, 0, 1, 9, 0, 1, 9, 1, 0])
    })
    it('returns the array', () => {
      const array = [1, 0]
      expect(mat4ApplyToVec2Array(sample(), array)).toBe(array)
    })
  })

  describe('mat4ApplyToVec3Array', () => {
    it('transforms all points', () => {
      const array = [1, 0, 0, 1, 0, 0]
      mat4ApplyToVec3Array(mat4CreateRotationZ(angle), array)
      expectArray(array, [0, 1, 0, 0, 1, 0])
    })
    it('applies translation', () => {
      const array = [1, 2, 3]
      mat4ApplyToVec3Array(mat4CreateTranslationXYZ(5, 6, 7), array)
      expectArray(array, [6, 8, 10])
    })
    it('uses offset, stride and count', () => {
      const array = [9, 1, 0, 0, 9, 1, 0, 0, 9, 1, 0, 0]
      mat4ApplyToVec3Array(mat4CreateRotationZ(angle), array, 1, 4, 2)
      expectArray(array, [9, 0, 1, 0, 9, 0, 1, 0, 9, 1, 0, 0])
    })
    it('returns the array', () => {
      const array = [1, 0, 0]
      expect(mat4ApplyToVec3Array(sample(), array)).toBe(array)
    })
  })

  describe('mat4ApplyToVec4Array', () => {
    it('transforms all vectors', () => {
      const array = [1, 0, 0, 1, 1, 0, 0, 1]
      mat4ApplyToVec4Array(mat4CreateRotationZ(angle), array)
      expectArray(array, [0, 1, 0, 1, 0, 1, 0, 1])
    })
    it('applies translation scaled by w', () => {
      const array = [0, 0, 0, 1, 0, 0, 0, 0]
      mat4ApplyToVec4Array(mat4CreateTranslationXYZ(1, 2, 3), array)
      expectArray(array, [1, 2, 3, 1, 0, 0, 0, 0])
    })
    it('uses offset, stride and count', () => {
      const array = [9, 1, 0, 0, 0, 9, 1, 0, 0, 0, 9, 1, 0, 0, 0]
      mat4ApplyToVec4Array(mat4CreateRotationZ(angle), array, 1, 5, 2)
      expectArray(array, [9, 0, 1, 0, 0, 9, 0, 1, 0, 0, 9, 1, 0, 0, 0])
    })
    it('returns the array', () => {
      const array = [1, 0, 0, 0]
      expect(mat4ApplyToVec4Array(sample(), array)).toBe(array)
    })
  })

  describe('mat4ApplyToVec2DirArray', () => {
    it('transforms all directions', () => {
      const array = [1, 0, 1, 0]
      mat4ApplyToVec2DirArray(mat4CreateRotationZ(angle), array)
      expectArray(array, [0, 1, 0, 1])
    })
    it('ignores translation', () => {
      const array = [1, 2]
      mat4ApplyToVec2DirArray(mat4CreateTranslationXYZ(5, 6, 7), array)
      expectArray(array, [1, 2])
    })
    it('uses offset, stride and count', () => {
      const array = [9, 1, 0, 9, 1, 0, 9, 1, 0]
      mat4ApplyToVec2DirArray(mat4CreateRotationZ(angle), array, 1, 3, 2)
      expectArray(array, [9, 0, 1, 9, 0, 1, 9, 1, 0])
    })
    it('returns the array', () => {
      const array = [1, 0]
      expect(mat4ApplyToVec2DirArray(sample(), array)).toBe(array)
    })
  })

  describe('mat4ApplyToVec3DirArray', () => {
    it('transforms all directions', () => {
      const array = [1, 0, 0, 1, 0, 0]
      mat4ApplyToVec3DirArray(mat4CreateRotationZ(angle), array)
      expectArray(array, [0, 1, 0, 0, 1, 0])
    })
    it('ignores translation', () => {
      const array = [1, 2, 3]
      mat4ApplyToVec3DirArray(mat4CreateTranslationXYZ(5, 6, 7), array)
      expectArray(array, [1, 2, 3])
    })
    it('uses offset, stride and count', () => {
      const array = [9, 1, 0, 0, 9, 1, 0, 0, 9, 1, 0, 0]
      mat4ApplyToVec3DirArray(mat4CreateRotationZ(angle), array, 1, 4, 2)
      expectArray(array, [9, 0, 1, 0, 9, 0, 1, 0, 9, 1, 0, 0])
    })
    it('returns the array', () => {
      const array = [1, 0, 0]
      expect(mat4ApplyToVec3DirArray(sample(), array)).toBe(array)
    })
  })

  describe('mat4Format', () => {
    it('formats rows', () => {
      expect(mat4Format(sample())).toBe(
        [
          '1.00000,5.00000,9.00000,13.00000',
          '2.00000,6.00000,10.00000,14.00000',
          '3.00000,7.00000,11.00000,15.00000',
          '4.00000,8.00000,12.00000,16.00000',
        ].join(',\n'),
      )
    })
  })

  describe('mat4ToArray', () => {
    it('creates array', () => {
      expect(mat4ToArray(sample())).toEqual(sampleParts)
    })
    it('writes at offset', () => {
      expect(mat4ToArray(sample(), [], 4)).toEqual([undefined, undefined, undefined, undefined, ...sampleParts])
    })
  })
})
