import { describe, expect, it } from 'vitest'
import {
  IVec3,
  IVec4,
  mat3CreateAxisAngle,
  mat3CreateYawPitchRoll,
  mat4CreateAxisAngle,
  quat$conjugate,
  quat$divide,
  quat$initAxisAngle,
  quat$initFromMat3,
  quat$initFromMat4,
  quat$initIdentity,
  quat$initYawPitchRoll,
  quat$invert,
  quat$multiply,
  quat$premultiply,
  quatConjugate,
  quatCreateAxisAngle,
  quatCreateFromMat3,
  quatCreateFromMat4,
  quatCreateIdentity,
  quatCreateYawPitchRoll,
  quatDivide,
  quatInvert,
  quatMultiply,
  quatPremultiply,
  quatSlerp,
  vec3,
  vec3ApplyQuat,
  vec4,
  vec4Negate,
} from './index'

describe('quat', () => {
  function expectComponents(q: IVec4, x: number, y: number, z: number, w: number, precision: number = 5) {
    expect(q.x, 'x component').toBeCloseTo(x, precision)
    expect(q.y, 'y component').toBeCloseTo(y, precision)
    expect(q.z, 'z component').toBeCloseTo(z, precision)
    expect(q.w, 'w component').toBeCloseTo(w, precision)
  }

  function expectEquality(q1: IVec4, q2: IVec4, precision: number = 5) {
    expectComponents(q1, q2.x, q2.y, q2.z, q2.w, precision)
  }

  function expectVec3(v: IVec3, x: number, y: number, z: number) {
    expect(v.x, 'x component').toBeCloseTo(x, 5)
    expect(v.y, 'y component').toBeCloseTo(y, 5)
    expect(v.z, 'z component').toBeCloseTo(z, 5)
  }

  const unitX = { x: 1, y: 0, z: 0 }
  const unitY = { x: 0, y: 1, z: 0 }
  const unitZ = { x: 0, y: 0, z: 1 }
  // normalized axis that is not a base axis
  const axis = { x: 2 / 7, y: 3 / 7, z: 6 / 7 }
  const halfPi = Math.PI * 0.5

  describe('quat$initIdentity', () => {
    it('sets identity', () => {
      expectComponents(quat$initIdentity(vec4(1, 2, 3, 4)), 0, 0, 0, 1)
    })
    it('returns out', () => {
      const out = vec4()
      expect(quat$initIdentity(out)).toBe(out)
    })
  })

  describe('quatCreateIdentity', () => {
    it('creates identity', () => {
      expectComponents(quatCreateIdentity(), 0, 0, 0, 1)
    })
    it('creates new instance', () => {
      expect(quatCreateIdentity()).not.toBe(quatCreateIdentity())
    })
  })

  describe('quat$initAxisAngle', () => {
    it('sets rotation', () => {
      const s = Math.sin(0.35)
      expectComponents(quat$initAxisAngle(vec4(), axis, 0.7), axis.x * s, axis.y * s, axis.z * s, Math.cos(0.35))
    })
    it('returns out', () => {
      const out = vec4()
      expect(quat$initAxisAngle(out, axis, 0.7)).toBe(out)
    })
  })

  describe('quatCreateAxisAngle', () => {
    it('rotates around x axis', () => {
      const q = quatCreateAxisAngle(unitX, halfPi)
      expectVec3(vec3ApplyQuat(vec3(1, 0, 0), q), 1, 0, 0)
      expectVec3(vec3ApplyQuat(vec3(0, 1, 0), q), 0, 0, 1)
      expectVec3(vec3ApplyQuat(vec3(0, 0, 1), q), 0, -1, 0)
    })
    it('rotates around y axis', () => {
      const q = quatCreateAxisAngle(unitY, halfPi)
      expectVec3(vec3ApplyQuat(vec3(1, 0, 0), q), 0, 0, -1)
      expectVec3(vec3ApplyQuat(vec3(0, 1, 0), q), 0, 1, 0)
      expectVec3(vec3ApplyQuat(vec3(0, 0, 1), q), 1, 0, 0)
    })
    it('rotates around z axis', () => {
      const q = quatCreateAxisAngle(unitZ, halfPi)
      expectVec3(vec3ApplyQuat(vec3(1, 0, 0), q), 0, 1, 0)
      expectVec3(vec3ApplyQuat(vec3(0, 1, 0), q), -1, 0, 0)
      expectVec3(vec3ApplyQuat(vec3(0, 0, 1), q), 0, 0, 1)
    })
  })

  describe('quat$initYawPitchRoll', () => {
    it('yaw rotates around y axis', () => {
      expectEquality(quat$initYawPitchRoll(vec4(), halfPi, 0, 0), quatCreateAxisAngle(unitY, halfPi))
    })
    it('pitch rotates around x axis', () => {
      expectEquality(quat$initYawPitchRoll(vec4(), 0, halfPi, 0), quatCreateAxisAngle(unitX, halfPi))
    })
    it('roll rotates around z axis', () => {
      expectEquality(quat$initYawPitchRoll(vec4(), 0, 0, halfPi), quatCreateAxisAngle(unitZ, halfPi))
    })
    it('returns out', () => {
      const out = vec4()
      expect(quat$initYawPitchRoll(out, 1, 2, 3)).toBe(out)
    })
  })

  describe('quatCreateYawPitchRoll', () => {
    it('applies roll, then pitch, then yaw', () => {
      const expected = quatMultiply(
        quatCreateAxisAngle(unitY, 0.3),
        quatMultiply(quatCreateAxisAngle(unitX, 0.5), quatCreateAxisAngle(unitZ, 0.9)),
      )
      expectEquality(quatCreateYawPitchRoll(0.3, 0.5, 0.9), expected)
    })
  })

  describe('quat$initFromMat3', () => {
    // angle 3 rad makes the trace negative, so every branch of the conversion is used
    const cases: Array<[string, IVec3, number]> = [
      ['positive trace', axis, 0.7],
      ['x dominant', unitX, 3],
      ['y dominant', unitY, 3],
      ['z dominant', unitZ, 3],
    ]
    for (const [name, a, angle] of cases) {
      it(`extracts rotation (${name})`, () => {
        expectEquality(quat$initFromMat3(vec4(), mat3CreateAxisAngle(a, angle)), quatCreateAxisAngle(a, angle))
      })
    }
    it('matches yaw pitch roll', () => {
      expectEquality(
        quat$initFromMat3(vec4(), mat3CreateYawPitchRoll(0.3, 0.5, 0.9)),
        quatCreateYawPitchRoll(0.3, 0.5, 0.9),
      )
    })
    it('returns out', () => {
      const out = vec4()
      expect(quat$initFromMat3(out, mat3CreateAxisAngle(axis, 0.7))).toBe(out)
    })
  })

  describe('quatCreateFromMat3', () => {
    it('extracts rotation', () => {
      expectEquality(quatCreateFromMat3(mat3CreateAxisAngle(axis, 0.7)), quatCreateAxisAngle(axis, 0.7))
    })
  })

  describe('quat$initFromMat4', () => {
    const cases: Array<[string, IVec3, number]> = [
      ['positive trace', axis, 0.7],
      ['x dominant', unitX, 3],
      ['y dominant', unitY, 3],
      ['z dominant', unitZ, 3],
    ]
    for (const [name, a, angle] of cases) {
      it(`extracts rotation (${name})`, () => {
        expectEquality(quat$initFromMat4(vec4(), mat4CreateAxisAngle(a, angle)), quatCreateAxisAngle(a, angle))
      })
    }
    it('returns out', () => {
      const out = vec4()
      expect(quat$initFromMat4(out, mat4CreateAxisAngle(axis, 0.7))).toBe(out)
    })
  })

  describe('quatCreateFromMat4', () => {
    it('extracts rotation', () => {
      expectEquality(quatCreateFromMat4(mat4CreateAxisAngle(axis, 0.7)), quatCreateAxisAngle(axis, 0.7))
    })
  })

  describe('quat$conjugate', () => {
    it('conjugates in place', () => {
      expectComponents(quat$conjugate(vec4(2, 4, 8, 16)), -2, -4, -8, 16)
    })
    it('returns out', () => {
      const out = vec4(2, 4, 8, 16)
      expect(quat$conjugate(out)).toBe(out)
    })
  })

  describe('quatConjugate', () => {
    it('conjugates', () => {
      const q = vec4(2, 4, 8, 16)
      expectComponents(quatConjugate(q), -2, -4, -8, 16)
      expectComponents(q, 2, 4, 8, 16)
    })
    it('writes to out', () => {
      const out = vec4()
      expect(quatConjugate(vec4(2, 4, 8, 16), out)).toBe(out)
    })
  })

  describe('quat$invert', () => {
    it('inverts in place', () => {
      const q = vec4(1, 2, 3, 4)
      expectComponents(quatMultiply(q, quat$invert(vec4(1, 2, 3, 4))), 0, 0, 0, 1)
    })
    it('returns out', () => {
      const out = vec4(1, 2, 3, 4)
      expect(quat$invert(out)).toBe(out)
    })
  })

  describe('quatInvert', () => {
    it('q * inv(q) is identity', () => {
      const q = vec4(1, 2, 3, 4)
      expectComponents(quatMultiply(q, quatInvert(q)), 0, 0, 0, 1)
      expectComponents(quatMultiply(quatInvert(q), q), 0, 0, 0, 1)
    })
    it('equals conjugate for unit quaternion', () => {
      const q = quatCreateAxisAngle(axis, 0.7)
      expectEquality(quatInvert(q), quatConjugate(q))
    })
    it('writes to out', () => {
      const out = vec4()
      expect(quatInvert(vec4(1, 2, 3, 4), out)).toBe(out)
    })
  })

  describe('quatMultiply', () => {
    it('multiplies', () => {
      expectComponents(quatMultiply(vec4(1, 2, 3, 4), vec4(5, 6, 7, 8)), 24, 48, 48, -6)
    })
    it('a * b rotates by b first, then by a', () => {
      const a = quatCreateAxisAngle(unitX, halfPi)
      const b = quatCreateAxisAngle(unitZ, halfPi)
      const v = vec3ApplyQuat(vec3(1, 0, 0), quatMultiply(a, b))
      const expected = vec3ApplyQuat(vec3ApplyQuat(vec3(1, 0, 0), b), a)
      expectVec3(v, expected.x, expected.y, expected.z)
      expectVec3(v, 0, 0, 1)
    })
    it('writes to out', () => {
      const out = vec4()
      expect(quatMultiply(vec4(1, 2, 3, 4), vec4(5, 6, 7, 8), out)).toBe(out)
    })
  })

  describe('quat$multiply', () => {
    it('multiplies in place: a = a * b', () => {
      expectComponents(quat$multiply(vec4(1, 2, 3, 4), vec4(5, 6, 7, 8)), 24, 48, 48, -6)
    })
    it('returns out', () => {
      const out = vec4(1, 2, 3, 4)
      expect(quat$multiply(out, vec4(5, 6, 7, 8))).toBe(out)
    })
  })

  describe('quatPremultiply', () => {
    it('premultiply(a, b) is b * a', () => {
      expectComponents(quatPremultiply(vec4(5, 6, 7, 8), vec4(1, 2, 3, 4)), 24, 48, 48, -6)
    })
    it('writes to out', () => {
      const out = vec4()
      expect(quatPremultiply(vec4(5, 6, 7, 8), vec4(1, 2, 3, 4), out)).toBe(out)
    })
  })

  describe('quat$premultiply', () => {
    it('multiplies in place: a = b * a', () => {
      expectComponents(quat$premultiply(vec4(5, 6, 7, 8), vec4(1, 2, 3, 4)), 24, 48, 48, -6)
    })
    it('returns out', () => {
      const out = vec4(5, 6, 7, 8)
      expect(quat$premultiply(out, vec4(1, 2, 3, 4))).toBe(out)
    })
  })

  describe('quatDivide', () => {
    it('divide(a, b) is a * inv(b)', () => {
      const a = vec4(1, 2, 3, 4)
      const b = vec4(5, 6, 7, 8)
      expectEquality(quatDivide(a, b), quatMultiply(a, quatInvert(b)))
    })
    it('q / q is identity', () => {
      expectComponents(quatDivide(vec4(1, 2, 3, 4), vec4(1, 2, 3, 4)), 0, 0, 0, 1)
    })
    it('writes to out', () => {
      const out = vec4()
      expect(quatDivide(vec4(1, 2, 3, 4), vec4(5, 6, 7, 8), out)).toBe(out)
    })
  })

  describe('quat$divide', () => {
    it('divides in place: a = a * inv(b)', () => {
      const b = vec4(5, 6, 7, 8)
      expectEquality(quat$divide(vec4(1, 2, 3, 4), b), quatMultiply(vec4(1, 2, 3, 4), quatInvert(b)))
    })
    it('returns out', () => {
      const out = vec4(1, 2, 3, 4)
      expect(quat$divide(out, vec4(5, 6, 7, 8))).toBe(out)
    })
  })

  describe('quatSlerp', () => {
    const a = quatCreateAxisAngle(axis, 0)
    const b = quatCreateAxisAngle(axis, 1.2)
    it('returns start and end', () => {
      expectEquality(quatSlerp(a, b, 0), a)
      expectEquality(quatSlerp(a, b, 1), b)
    })
    it('interpolates the angle', () => {
      expectEquality(quatSlerp(a, b, 0.25), quatCreateAxisAngle(axis, 0.3))
      expectEquality(quatSlerp(a, b, 0.5), quatCreateAxisAngle(axis, 0.6))
    })
    it('takes the shortest path', () => {
      expectEquality(quatSlerp(a, vec4Negate(b), 0.5), quatCreateAxisAngle(axis, 0.6))
    })
    it('interpolates very close quaternions', () => {
      const c = quatCreateAxisAngle(axis, 0.001)
      expectEquality(quatSlerp(a, c, 0.5), quatCreateAxisAngle(axis, 0.0005))
    })
    it('writes to out', () => {
      const out = vec4()
      expect(quatSlerp(a, b, 0.5, out)).toBe(out)
    })
  })
})
