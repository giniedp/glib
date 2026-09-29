import { describe, expect, it } from 'vitest'
import {
  IVec3,
  mat2CreateRotationX,
  mat2CreateRotationY,
  mat2CreateRotationZ,
  mat3CreateAxisAngle,
  mat4CreateAxisAngle,
  mat4CreateTranslationXYZ,
  quatCreateAxisAngle,
  vec3,
  vec3$add,
  vec3$addScalar,
  vec3$addScalars,
  vec3$addScaled,
  vec3$clamp,
  vec3$clampScalar,
  vec3$cross,
  vec3$divide,
  vec3$divideScalar,
  vec3$init,
  vec3$initFill,
  vec3$initFrom,
  vec3$initRandom,
  vec3$initSpherical,
  vec3$invert,
  vec3$multiply,
  vec3$multiplyScalar,
  vec3$negate,
  vec3$normalize,
  vec3$reflect,
  vec3$refract,
  vec3$saturate,
  vec3$subtract,
  vec3$subtractScalar,
  vec3$subtractScaled,
  vec3$applyMat2,
  vec3$applyMat3,
  vec3$applyMat4,
  vec3$applyQuat,
  vec3Add,
  vec3AddScalar,
  vec3AddScalars,
  vec3AddScaled,
  vec3Barycentric,
  vec3Clamp,
  vec3ClampScalar,
  vec3Copy,
  vec3Cross,
  vec3Distance,
  vec3DistanceSquared,
  vec3Divide,
  vec3DivideScalar,
  vec3Dot,
  vec3Equals,
  vec3Format,
  vec3Hermite,
  vec3Invert,
  vec3Length,
  vec3LengthSquared,
  vec3Lerp,
  vec3Max,
  vec3MaxScalar,
  vec3Min,
  vec3MinScalar,
  vec3Multiply,
  vec3MultiplyScalar,
  vec3Negate,
  vec3Normalize,
  vec3Reflect,
  vec3Refract,
  vec3Saturate,
  vec3Subtract,
  vec3SubtractScalar,
  vec3SubtractScaled,
  vec3ToArray,
  vec3ApplyMat2,
  vec3ApplyMat3,
  vec3ApplyMat4,
  vec3ApplyQuat,
} from './index'

describe('vec3', () => {
  function expectComponents(v: IVec3, x: number, y: number, z: number) {
    expect(v.x, 'x component invalid').toBeCloseTo(x, 10)
    expect(v.y, 'y component invalid').toBeCloseTo(y, 10)
    expect(v.z, 'z component invalid').toBeCloseTo(z, 10)
  }

  describe('vec3', () => {
    it('creates zero vector', () => {
      expect(vec3()).toEqual({ x: 0, y: 0, z: 0 })
    })

    it('creates from xyz', () => {
      expect(vec3(1)).toEqual({ x: 1, y: 1, z: 1 })
      expect(vec3({ x: 1, y: 2 })).toEqual({ x: 1, y: 2, z: 0 })
      expect(vec3({ x: 1, y: 2, z: 3 })).toEqual({ x: 1, y: 2, z: 3 })
      expect(vec3({} as any)).toEqual({ x: 0, y: 0, z: 0 })
      expect(vec3([1])).toEqual({ x: 1, y: 0, z: 0 })
      expect(vec3([1, 2])).toEqual({ x: 1, y: 2, z: 0 })
      expect(vec3([1, 2, 3])).toEqual({ x: 1, y: 2, z: 3 })
      expect(vec3([null, null, null])).toEqual({ x: 0, y: 0, z: 0 })
    })

    it('creates from xy, z', () => {
      expect(vec3(1, 2)).toEqual({ x: 1, y: 1, z: 2 })
      expect(vec3({ x: 1, y: 2 }, 3)).toEqual({ x: 1, y: 2, z: 3 })
      expect(vec3({ x: 1, y: 2, z: 3 }, 4)).toEqual({ x: 1, y: 2, z: 4 })
      expect(vec3([1], 2)).toEqual({ x: 1, y: 0, z: 2 })
      expect(vec3([1, 2], 3)).toEqual({ x: 1, y: 2, z: 3 })
      expect(vec3([1, 2, 3], 4)).toEqual({ x: 1, y: 2, z: 4 })
    })

    it('creates from x, y, z', () => {
      expect(vec3(1, 2, 3)).toEqual({ x: 1, y: 2, z: 3 })
      expect(vec3({ x: 1, y: 2 }, 3, 4)).toEqual({ x: 1, y: 3, z: 4 })
      expect(vec3({ x: 1, y: 2, z: 3 }, 4, 5)).toEqual({ x: 1, y: 4, z: 5 })
      expect(vec3([1], 2, 3)).toEqual({ x: 1, y: 2, z: 3 })
      expect(vec3([1, 2], 3, 4)).toEqual({ x: 1, y: 3, z: 4 })
      expect(vec3([1, 2, 3], 4, 5)).toEqual({ x: 1, y: 4, z: 5 })
    })
  })

  describe('vec3$init', () => {
    it('sets components', () => {
      expectComponents(vec3$init(vec3(), 1, 2, 3), 1, 2, 3)
    })
    it('returns out', () => {
      const out = vec3()
      expect(vec3$init(out, 1, 2, 3)).toBe(out)
    })
  })

  describe('vec3$initFrom', () => {
    it('copies components', () => {
      expectComponents(vec3$initFrom(vec3(), vec3(1, 2, 3)), 1, 2, 3)
    })
    it('returns out', () => {
      const out = vec3()
      expect(vec3$initFrom(out, vec3(1, 2, 3))).toBe(out)
    })
  })

  describe('vec3$initFill', () => {
    it('sets all components', () => {
      expectComponents(vec3$initFill(vec3(), 2), 2, 2, 2)
    })
    it('returns out', () => {
      const out = vec3()
      expect(vec3$initFill(out, 2)).toBe(out)
    })
  })

  describe('vec3$initRandom', () => {
    it('sets components in range', () => {
      const out = vec3$initRandom(vec3(), 2, 3)
      for (const v of vec3ToArray(out)) {
        expect(v).toBeGreaterThanOrEqual(2)
        expect(v).toBeLessThanOrEqual(3)
      }
    })
    it('returns out', () => {
      const out = vec3()
      expect(vec3$initRandom(out)).toBe(out)
    })
  })

  describe('vec3$initSpherical', () => {
    it('sets components', () => {
      expectComponents(vec3$initSpherical(vec3(), 0, 0, 2), 0, 2, 0)
      expectComponents(vec3$initSpherical(vec3(), Math.PI * 0.5, 0), 0, 0, 1)
      expectComponents(vec3$initSpherical(vec3(), Math.PI * 0.5, Math.PI * 0.5), 1, 0, 0)
    })
    it('returns out', () => {
      const out = vec3()
      expect(vec3$initSpherical(out, 0, 0)).toBe(out)
    })
  })

  describe('vec3Copy', () => {
    it('copies components', () => {
      expectComponents(vec3Copy(vec3(1, 2, 3)), 1, 2, 3)
    })
    it('returns new vector', () => {
      const a = vec3(1, 2, 3)
      expect(vec3Copy(a)).not.toBe(a)
    })
    it('returns out', () => {
      const out = vec3()
      expect(vec3Copy(vec3(1, 2, 3), out)).toBe(out)
    })
  })

  describe('vec3ToArray', () => {
    it('writes components', () => {
      expect(vec3ToArray(vec3(1, 2, 3))).toEqual([1, 2, 3])
    })
    it('writes at offset', () => {
      expect(vec3ToArray(vec3(1, 2, 3), [0, 0, 0, 0, 0], 1)).toEqual([0, 1, 2, 3, 0])
    })
  })

  describe('vec3Equals', () => {
    it('compares components', () => {
      expect(vec3Equals(vec3(0, 0, 0), vec3(0, 0, 0))).toBe(true)
      expect(vec3Equals(vec3(1, 0, 0), vec3(1, 0, 0))).toBe(true)
      expect(vec3Equals(vec3(0, 1, 0), vec3(0, 1, 0))).toBe(true)
      expect(vec3Equals(vec3(0, 0, 1), vec3(0, 0, 1))).toBe(true)
      expect(vec3Equals(vec3(0, 0, 0), vec3(1, 0, 0))).toBe(false)
      expect(vec3Equals(vec3(0, 0, 0), vec3(0, 1, 0))).toBe(false)
      expect(vec3Equals(vec3(0, 0, 0), vec3(0, 0, 1))).toBe(false)
    })
  })

  describe('vec3Length', () => {
    it('computes length', () => {
      expect(vec3Length(vec3(2, 0, 0))).toBe(2)
      expect(vec3Length(vec3(0, 3, 0))).toBe(3)
      expect(vec3Length(vec3(0, 0, 4))).toBe(4)
    })
  })

  describe('vec3LengthSquared', () => {
    it('computes squared length', () => {
      expect(vec3LengthSquared(vec3(2, 0, 0))).toBe(4)
      expect(vec3LengthSquared(vec3(0, 3, 0))).toBe(9)
      expect(vec3LengthSquared(vec3(0, 0, 4))).toBe(16)
    })
  })

  describe('vec3Distance', () => {
    it('computes distance', () => {
      expect(vec3Distance(vec3(2, 0, 0), vec3(4, 0, 0))).toBe(2)
      expect(vec3Distance(vec3(0, 3, 0), vec3(0, 6, 0))).toBe(3)
      expect(vec3Distance(vec3(0, 0, 4), vec3(0, 0, 8))).toBe(4)
    })
  })

  describe('vec3DistanceSquared', () => {
    it('computes squared distance', () => {
      expect(vec3DistanceSquared(vec3(2, 0, 0), vec3(4, 0, 0))).toBe(4)
      expect(vec3DistanceSquared(vec3(0, 3, 0), vec3(0, 6, 0))).toBe(9)
      expect(vec3DistanceSquared(vec3(0, 0, 4), vec3(0, 0, 8))).toBe(16)
    })
  })

  describe('vec3Dot', () => {
    it('computes dot product', () => {
      expect(vec3Dot(vec3(2, 0, 0), vec3(4, 0, 0))).toBe(8)
      expect(vec3Dot(vec3(0, 3, 0), vec3(0, 6, 0))).toBe(18)
      expect(vec3Dot(vec3(0, 0, 4), vec3(0, 0, 8))).toBe(32)
    })
  })

  describe('vec3Cross', () => {
    it('computes cross product', () => {
      expectComponents(vec3Cross(vec3(1, 0, 0), vec3(0, 1, 0)), 0, 0, 1)
      expectComponents(vec3Cross(vec3(0, 1, 0), vec3(0, 0, 1)), 1, 0, 0)
      expectComponents(vec3Cross(vec3(0, 0, 1), vec3(1, 0, 0)), 0, 1, 0)
    })
    it('returns out', () => {
      const out = vec3()
      expect(vec3Cross(vec3(1, 0, 0), vec3(0, 1, 0), out)).toBe(out)
    })
  })

  describe('vec3$cross', () => {
    it('computes cross product in place', () => {
      const out = vec3(1, 0, 0)
      expect(vec3$cross(out, vec3(0, 1, 0))).toBe(out)
      expectComponents(out, 0, 0, 1)
    })
  })

  describe('vec3Normalize', () => {
    it('normalizes', () => {
      expect(vec3Length(vec3Normalize(vec3(1, 2, 3)))).toBeCloseTo(1)
    })
    it('returns out', () => {
      const out = vec3()
      expect(vec3Normalize(vec3(1, 2, 3), out)).toBe(out)
    })
  })

  describe('vec3$normalize', () => {
    it('normalizes in place', () => {
      const out = vec3(1, 2, 3)
      expect(vec3$normalize(out)).toBe(out)
      expect(vec3Length(out)).toBeCloseTo(1)
    })
  })

  describe('vec3Invert', () => {
    it('inverts', () => {
      expectComponents(vec3Invert(vec3(2, 4, 8)), 0.5, 0.25, 0.125)
    })
  })

  describe('vec3$invert', () => {
    it('inverts in place', () => {
      const out = vec3(2, 4, 8)
      expect(vec3$invert(out)).toBe(out)
      expectComponents(out, 0.5, 0.25, 0.125)
    })
  })

  describe('vec3Negate', () => {
    it('negates', () => {
      expectComponents(vec3Negate(vec3(2, 4, 8)), -2, -4, -8)
    })
  })

  describe('vec3$negate', () => {
    it('negates in place', () => {
      const out = vec3(2, 4, 8)
      expect(vec3$negate(out)).toBe(out)
      expectComponents(out, -2, -4, -8)
    })
  })

  describe('add', () => {
    describe('vec3Add', () => {
      it('adds', () => {
        expectComponents(vec3Add(vec3(1, 2, 3), vec3(5, 6, 7)), 6, 8, 10)
      })
      it('returns new vector', () => {
        const a = vec3(1, 2, 3)
        const b = vec3(5, 6, 7)
        const res = vec3Add(a, b)
        expect(res).not.toBe(a)
        expect(res).not.toBe(b)
      })
      it('returns out', () => {
        const out = vec3()
        expect(vec3Add(vec3(1, 2, 3), vec3(5, 6, 7), out)).toBe(out)
      })
    })
    describe('vec3$add', () => {
      it('adds in place', () => {
        const out = vec3(1, 2, 3)
        expect(vec3$add(out, vec3(5, 6, 7))).toBe(out)
        expectComponents(out, 6, 8, 10)
      })
    })
    describe('vec3AddScalar', () => {
      it('adds', () => {
        expectComponents(vec3AddScalar(vec3(1, 2, 3), 0.5), 1.5, 2.5, 3.5)
      })
    })
    describe('vec3$addScalar', () => {
      it('adds in place', () => {
        const out = vec3(1, 2, 3)
        expect(vec3$addScalar(out, 0.5)).toBe(out)
        expectComponents(out, 1.5, 2.5, 3.5)
      })
    })
    describe('vec3AddScalars', () => {
      it('adds', () => {
        expectComponents(vec3AddScalars(vec3(1, 2, 3), 1, 2, 3), 2, 4, 6)
      })
    })
    describe('vec3$addScalars', () => {
      it('adds in place', () => {
        const out = vec3(1, 2, 3)
        expect(vec3$addScalars(out, 1, 2, 3)).toBe(out)
        expectComponents(out, 2, 4, 6)
      })
    })
    describe('vec3AddScaled', () => {
      it('adds', () => {
        expectComponents(vec3AddScaled(vec3(1, 2, 3), vec3(5, 6, 7), 0.5), 3.5, 5, 6.5)
      })
    })
    describe('vec3$addScaled', () => {
      it('adds in place', () => {
        const out = vec3(1, 2, 3)
        expect(vec3$addScaled(out, vec3(5, 6, 7), 0.5)).toBe(out)
        expectComponents(out, 3.5, 5, 6.5)
      })
    })
  })

  describe('subtract', () => {
    describe('vec3Subtract', () => {
      it('subtracts', () => {
        expectComponents(vec3Subtract(vec3(5, 6, 7), vec3(4, 3, 2)), 1, 3, 5)
      })
      it('returns out', () => {
        const out = vec3()
        expect(vec3Subtract(vec3(5, 6, 7), vec3(4, 3, 2), out)).toBe(out)
      })
    })
    describe('vec3$subtract', () => {
      it('subtracts in place', () => {
        const out = vec3(5, 6, 7)
        expect(vec3$subtract(out, vec3(4, 3, 2))).toBe(out)
        expectComponents(out, 1, 3, 5)
      })
    })
    describe('vec3SubtractScalar', () => {
      it('subtracts', () => {
        expectComponents(vec3SubtractScalar(vec3(1, 2, 3), 0.5), 0.5, 1.5, 2.5)
      })
    })
    describe('vec3$subtractScalar', () => {
      it('subtracts in place', () => {
        const out = vec3(1, 2, 3)
        expect(vec3$subtractScalar(out, 0.5)).toBe(out)
        expectComponents(out, 0.5, 1.5, 2.5)
      })
    })
    describe('vec3SubtractScaled', () => {
      it('subtracts', () => {
        expectComponents(vec3SubtractScaled(vec3(5, 6, 7), vec3(1, 2, 3), 0.5), 4.5, 5, 5.5)
      })
    })
    describe('vec3$subtractScaled', () => {
      it('subtracts in place', () => {
        const out = vec3(5, 6, 7)
        expect(vec3$subtractScaled(out, vec3(1, 2, 3), 0.5)).toBe(out)
        expectComponents(out, 4.5, 5, 5.5)
      })
    })
  })

  describe('multiply', () => {
    describe('vec3Multiply', () => {
      it('multiplies', () => {
        expectComponents(vec3Multiply(vec3(1, 2, 3), vec3(5, 6, 7)), 5, 12, 21)
      })
      it('returns out', () => {
        const out = vec3()
        expect(vec3Multiply(vec3(1, 2, 3), vec3(5, 6, 7), out)).toBe(out)
      })
    })
    describe('vec3$multiply', () => {
      it('multiplies in place', () => {
        const out = vec3(1, 2, 3)
        expect(vec3$multiply(out, vec3(5, 6, 7))).toBe(out)
        expectComponents(out, 5, 12, 21)
      })
    })
    describe('vec3MultiplyScalar', () => {
      it('multiplies', () => {
        expectComponents(vec3MultiplyScalar(vec3(1, 2, 3), 0.5), 0.5, 1, 1.5)
      })
    })
    describe('vec3$multiplyScalar', () => {
      it('multiplies in place', () => {
        const out = vec3(1, 2, 3)
        expect(vec3$multiplyScalar(out, 0.5)).toBe(out)
        expectComponents(out, 0.5, 1, 1.5)
      })
    })
  })

  describe('divide', () => {
    describe('vec3Divide', () => {
      it('divides', () => {
        expectComponents(vec3Divide(vec3(4, 16, 64), vec3(2, 4, 8)), 2, 4, 8)
      })
      it('returns out', () => {
        const out = vec3()
        expect(vec3Divide(vec3(4, 16, 64), vec3(2, 4, 8), out)).toBe(out)
      })
    })
    describe('vec3$divide', () => {
      it('divides in place', () => {
        const out = vec3(4, 16, 64)
        expect(vec3$divide(out, vec3(2, 4, 8))).toBe(out)
        expectComponents(out, 2, 4, 8)
      })
    })
    describe('vec3DivideScalar', () => {
      it('divides', () => {
        expectComponents(vec3DivideScalar(vec3(1, 2, 3), 2), 0.5, 1, 1.5)
      })
    })
    describe('vec3$divideScalar', () => {
      it('divides in place', () => {
        const out = vec3(1, 2, 3)
        expect(vec3$divideScalar(out, 2)).toBe(out)
        expectComponents(out, 0.5, 1, 1.5)
      })
    })
  })

  describe('vec3Reflect', () => {
    it('reflects', () => {
      expectComponents(vec3Reflect(vec3(1, -1, 0), vec3(0, 1, 0)), 1, 1, 0)
    })
  })

  describe('vec3$reflect', () => {
    it('reflects in place', () => {
      const out = vec3(1, -1, 0)
      expect(vec3$reflect(out, vec3(0, 1, 0))).toBe(out)
      expectComponents(out, 1, 1, 0)
    })
  })

  describe('vec3Refract', () => {
    it('passes through with eta 1', () => {
      expectComponents(vec3Refract(vec3(0, -1, 0), vec3(0, 1, 0), 1), 0, -1, 0)
    })
    it('returns zero on total internal reflection', () => {
      expectComponents(vec3Refract(vec3(Math.SQRT1_2, -Math.SQRT1_2, 0), vec3(0, 1, 0), 1.5), 0, 0, 0)
    })
  })

  describe('vec3$refract', () => {
    it('refracts in place', () => {
      const out = vec3(0, -1, 0)
      expect(vec3$refract(out, vec3(0, 1, 0), 1)).toBe(out)
      expectComponents(out, 0, -1, 0)
    })
  })

  describe('vec3Saturate', () => {
    it('clamps to [0, 1]', () => {
      expectComponents(vec3Saturate(vec3(-1, 0.5, 2)), 0, 0.5, 1)
    })
  })

  describe('vec3$saturate', () => {
    it('clamps in place', () => {
      const out = vec3(-1, 0.5, 2)
      expect(vec3$saturate(out)).toBe(out)
      expectComponents(out, 0, 0.5, 1)
    })
  })

  describe('vec3Clamp', () => {
    const min = vec3(1, 2, 3)
    const max = vec3(1.5, 2.5, 3.5)
    it('clamps to min', () => {
      expectComponents(vec3Clamp(vec3(0.9, 1.9, 2.9), min, max), 1, 2, 3)
    })
    it('clamps to max', () => {
      expectComponents(vec3Clamp(vec3(1.6, 2.6, 3.6), min, max), 1.5, 2.5, 3.5)
    })
  })

  describe('vec3$clamp', () => {
    it('clamps in place', () => {
      const out = vec3(0.9, 2.6, 3.2)
      expect(vec3$clamp(out, vec3(1, 2, 3), vec3(1.5, 2.5, 3.5))).toBe(out)
      expectComponents(out, 1, 2.5, 3.2)
    })
  })

  describe('vec3ClampScalar', () => {
    it('clamps to min', () => {
      expectComponents(vec3ClampScalar(vec3(1, 2, 3), 5, 10), 5, 5, 5)
    })
    it('clamps to max', () => {
      expectComponents(vec3ClampScalar(vec3(3, 4, 5), 1, 2), 2, 2, 2)
    })
  })

  describe('vec3$clampScalar', () => {
    it('clamps in place', () => {
      const out = vec3(0, 1.5, 3)
      expect(vec3$clampScalar(out, 1, 2)).toBe(out)
      expectComponents(out, 1, 1.5, 2)
    })
  })

  describe('vec3Min', () => {
    it('takes component min', () => {
      expectComponents(vec3Min(vec3(1, 2, 3), vec3(5, 6, 7)), 1, 2, 3)
      expectComponents(vec3Min(vec3(5, 6, 7), vec3(1, 2, 3)), 1, 2, 3)
    })
  })

  describe('vec3MinScalar', () => {
    it('takes component min', () => {
      expectComponents(vec3MinScalar(vec3(1, 2, 3), 0.5), 0.5, 0.5, 0.5)
      expectComponents(vec3MinScalar(vec3(1, 2, 3), 5), 1, 2, 3)
    })
  })

  describe('vec3Max', () => {
    it('takes component max', () => {
      expectComponents(vec3Max(vec3(1, 2, 3), vec3(5, 6, 7)), 5, 6, 7)
      expectComponents(vec3Max(vec3(5, 6, 7), vec3(1, 2, 3)), 5, 6, 7)
    })
  })

  describe('vec3MaxScalar', () => {
    it('takes component max', () => {
      expectComponents(vec3MaxScalar(vec3(1, 2, 3), 5), 5, 5, 5)
      expectComponents(vec3MaxScalar(vec3(1, 2, 3), 0.5), 1, 2, 3)
    })
  })

  describe('vec3Lerp', () => {
    it('interpolates', () => {
      expectComponents(vec3Lerp(vec3(1, 2, 3), vec3(5, 6, 7), 0.5), 3, 4, 5)
    })
  })

  describe('vec3Hermite', () => {
    it('hits end points', () => {
      const a = vec3(1, 2, 3)
      const b = vec3(5, 6, 7)
      const t = vec3(1, 1, 1)
      expectComponents(vec3Hermite(a, t, b, t, 0), 1, 2, 3)
      expectComponents(vec3Hermite(a, t, b, t, 1), 5, 6, 7)
    })
  })

  describe('vec3Barycentric', () => {
    it('interpolates', () => {
      expectComponents(vec3Barycentric(vec3(1, 2, 3), vec3(5, 6, 7), vec3(9, 10, 11), 0.5, 0.5), 7, 8, 9)
    })
  })

  describe('vec3ApplyQuat', () => {
    it('rotates around x', () => {
      expectComponents(vec3ApplyQuat(vec3(1), quatCreateAxisAngle({ x: 1, y: 0, z: 0 }, Math.PI * 0.5)), 1, -1, 1)
    })
    it('rotates around y', () => {
      expectComponents(vec3ApplyQuat(vec3(1), quatCreateAxisAngle({ x: 0, y: 1, z: 0 }, Math.PI * 0.5)), 1, 1, -1)
    })
    it('rotates around z', () => {
      expectComponents(vec3ApplyQuat(vec3(1), quatCreateAxisAngle({ x: 0, y: 0, z: 1 }, Math.PI * 0.5)), -1, 1, 1)
    })
  })

  describe('vec3$applyQuat', () => {
    it('rotates in place', () => {
      const out = vec3(1)
      expect(vec3$applyQuat(out, quatCreateAxisAngle({ x: 1, y: 0, z: 0 }, Math.PI * 0.5))).toBe(out)
      expectComponents(out, 1, -1, 1)
    })
  })

  describe('vec3ApplyMat4', () => {
    it('rotates around x', () => {
      expectComponents(vec3ApplyMat4(vec3(1), mat4CreateAxisAngle({ x: 1, y: 0, z: 0 }, Math.PI * 0.5)), 1, -1, 1)
    })
    it('rotates around y', () => {
      expectComponents(vec3ApplyMat4(vec3(1), mat4CreateAxisAngle({ x: 0, y: 1, z: 0 }, Math.PI * 0.5)), 1, 1, -1)
    })
    it('rotates around z', () => {
      expectComponents(vec3ApplyMat4(vec3(1), mat4CreateAxisAngle({ x: 0, y: 0, z: 1 }, Math.PI * 0.5)), -1, 1, 1)
    })
    it('translates', () => {
      expectComponents(vec3ApplyMat4(vec3(1), mat4CreateTranslationXYZ(1, 2, 3)), 2, 3, 4)
    })
  })

  describe('vec3$applyMat4', () => {
    it('transforms in place', () => {
      const out = vec3(1)
      expect(vec3$applyMat4(out, mat4CreateTranslationXYZ(1, 2, 3))).toBe(out)
      expectComponents(out, 2, 3, 4)
    })
  })

  describe('vec3ApplyMat3', () => {
    it('rotates around x', () => {
      expectComponents(vec3ApplyMat3(vec3(1), mat3CreateAxisAngle({ x: 1, y: 0, z: 0 }, Math.PI * 0.5)), 1, -1, 1)
    })
    it('rotates around y', () => {
      expectComponents(vec3ApplyMat3(vec3(1), mat3CreateAxisAngle({ x: 0, y: 1, z: 0 }, Math.PI * 0.5)), 1, 1, -1)
    })
    it('rotates around z', () => {
      expectComponents(vec3ApplyMat3(vec3(1), mat3CreateAxisAngle({ x: 0, y: 0, z: 1 }, Math.PI * 0.5)), -1, 1, 1)
    })
  })

  describe('vec3$applyMat3', () => {
    it('transforms in place', () => {
      const out = vec3(1)
      expect(vec3$applyMat3(out, mat3CreateAxisAngle({ x: 1, y: 0, z: 0 }, Math.PI * 0.5))).toBe(out)
      expectComponents(out, 1, -1, 1)
    })
  })

  describe('vec3ApplyMat2', () => {
    it('rotates around x', () => {
      expectComponents(vec3ApplyMat2(vec3(1), mat2CreateRotationX(Math.PI * 0.5)), 1, 0, 1)
    })
    it('rotates around y', () => {
      expectComponents(vec3ApplyMat2(vec3(1), mat2CreateRotationY(Math.PI * 0.5)), 0, 1, 1)
    })
    it('rotates around z', () => {
      expectComponents(vec3ApplyMat2(vec3(1), mat2CreateRotationZ(Math.PI * 0.5)), -1, 1, 1)
    })
  })

  describe('vec3$applyMat2', () => {
    it('transforms in place', () => {
      const out = vec3(1)
      expect(vec3$applyMat2(out, mat2CreateRotationZ(Math.PI * 0.5))).toBe(out)
      expectComponents(out, -1, 1, 1)
    })
  })

  describe('vec3Format', () => {
    it('formats components', () => {
      expect(vec3Format(vec3(1, 2, 3))).toBe('x: 1.00000, y: 2.00000, z: 3.00000')
    })
  })
})
