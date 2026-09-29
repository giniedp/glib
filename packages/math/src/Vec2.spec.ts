import { describe, expect, it } from 'vitest'
import {
  IVec2,
  mat2CreateRotationZ,
  mat3CreateRotationZ,
  Mat4,
  mat4CreateTranslationXYZ,
  vec2,
  vec2$add,
  vec2$addScalar,
  vec2$addScaled,
  vec2$clamp,
  vec2$clampScalar,
  vec2$divide,
  vec2$divideScalar,
  vec2$init,
  vec2$initFill,
  vec2$initRandom,
  vec2$invert,
  vec2$multiply,
  vec2$multiplyScalar,
  vec2$negate,
  vec2$normalize,
  vec2$saturate,
  vec2$subtract,
  vec2$subtractScalar,
  vec2$subtractScaled,
  vec2$transformByMat2,
  vec2$transformByMat3,
  vec2$transformByMat4,
  vec2Add,
  vec2AddScalar,
  vec2AddScaled,
  vec2Barycentric,
  vec2Clamp,
  vec2ClampScalar,
  vec2Copy,
  vec2Distance,
  vec2DistanceSquared,
  vec2Divide,
  vec2DivideScalar,
  vec2Dot,
  vec2Equals,
  vec2Format,
  vec2Invert,
  vec2Length,
  vec2LengthSquared,
  vec2Lerp,
  vec2Max,
  vec2MaxScalar,
  vec2Min,
  vec2MinScalar,
  vec2Multiply,
  vec2MultiplyScalar,
  vec2Negate,
  vec2Normalize,
  vec2Saturate,
  vec2Subtract,
  vec2SubtractScalar,
  vec2SubtractScaled,
  vec2ToArray,
  vec2TransformByMat2,
  vec2TransformByMat3,
  vec2TransformByMat4,
} from './index'

describe('vec2', () => {
  function expectComponents(v: IVec2, x: number, y: number) {
    expect(v.x, 'x component invalid').toBeCloseTo(x, 10)
    expect(v.y, 'y component invalid').toBeCloseTo(y, 10)
  }

  // column major matrices
  const mat2 = [1, 2, 3, 4]
  const mat3 = [1, 2, 0, 3, 4, 0, 5, 6, 1]
  const mat4 = [1, 2, 0, 0, 3, 4, 0, 0, 0, 0, 1, 0, 5, 6, 0, 1]

  describe('vec2', () => {
    it('creates zero vector', () => {
      expect(vec2()).toEqual({ x: 0, y: 0 })
    })

    it('creates from xy', () => {
      expect(vec2(1)).toEqual({ x: 1, y: 1 })
      expect(vec2({ x: 1, y: 2 })).toEqual({ x: 1, y: 2 })
      expect(vec2({ x: 1, y: 2, z: 3 })).toEqual({ x: 1, y: 2 })
      expect(vec2({} as any)).toEqual({ x: 0, y: 0 })
      expect(vec2([1])).toEqual({ x: 1, y: 0 })
      expect(vec2([1, 2, 3])).toEqual({ x: 1, y: 2 })
      expect(vec2([null, null])).toEqual({ x: 0, y: 0 })
    })

    it('creates from x, y', () => {
      expect(vec2(1, 2)).toEqual({ x: 1, y: 2 })
      expect(vec2({ x: 1, y: 2 }, 3)).toEqual({ x: 1, y: 3 })
      expect(vec2([1], 2)).toEqual({ x: 1, y: 2 })
      expect(vec2([1, 2], 3)).toEqual({ x: 1, y: 3 })
    })
  })

  describe('vec2$init', () => {
    it('sets components', () => {
      expectComponents(vec2$init(vec2(), 1, 2), 1, 2)
    })
    it('returns out', () => {
      const out = vec2()
      expect(vec2$init(out, 1, 2)).toBe(out)
    })
  })

  describe('vec2$initFill', () => {
    it('sets all components', () => {
      expectComponents(vec2$initFill(vec2(), 2), 2, 2)
    })
    it('returns out', () => {
      const out = vec2()
      expect(vec2$initFill(out, 2)).toBe(out)
    })
  })

  describe('vec2$initRandom', () => {
    it('sets components in range', () => {
      const out = vec2$initRandom(vec2(), 2, 3)
      for (const v of vec2ToArray(out)) {
        expect(v).toBeGreaterThanOrEqual(2)
        expect(v).toBeLessThanOrEqual(3)
      }
    })
    it('returns out', () => {
      const out = vec2()
      expect(vec2$initRandom(out)).toBe(out)
    })
  })

  describe('vec2Copy', () => {
    it('copies components', () => {
      expectComponents(vec2Copy(vec2(1, 2)), 1, 2)
    })
    it('returns new vector', () => {
      const a = vec2(1, 2)
      expect(vec2Copy(a)).not.toBe(a)
    })
    it('returns out', () => {
      const out = vec2()
      expect(vec2Copy(vec2(1, 2), out)).toBe(out)
    })
  })

  describe('vec2ToArray', () => {
    it('writes components', () => {
      expect(vec2ToArray(vec2(1, 2))).toEqual([1, 2])
    })
    it('writes at offset', () => {
      expect(vec2ToArray(vec2(1, 2), [0, 0, 0, 0, 0], 1)).toEqual([0, 1, 2, 0, 0])
    })
  })

  describe('vec2Equals', () => {
    it('compares components', () => {
      expect(vec2Equals(vec2(0, 0), vec2(0, 0))).toBe(true)
      expect(vec2Equals(vec2(1, 0), vec2(1, 0))).toBe(true)
      expect(vec2Equals(vec2(0, 1), vec2(0, 1))).toBe(true)
      expect(vec2Equals(vec2(0, 0), vec2(1, 0))).toBe(false)
      expect(vec2Equals(vec2(0, 0), vec2(0, 1))).toBe(false)
    })
  })

  describe('vec2Length', () => {
    it('computes length', () => {
      expect(vec2Length(vec2(2, 0))).toBe(2)
      expect(vec2Length(vec2(0, 3))).toBe(3)
    })
  })

  describe('vec2LengthSquared', () => {
    it('computes squared length', () => {
      expect(vec2LengthSquared(vec2(2, 0))).toBe(4)
      expect(vec2LengthSquared(vec2(0, 3))).toBe(9)
    })
  })

  describe('vec2Distance', () => {
    it('computes distance', () => {
      expect(vec2Distance(vec2(2, 0), vec2(4, 0))).toBe(2)
      expect(vec2Distance(vec2(0, 3), vec2(0, 6))).toBe(3)
    })
  })

  describe('vec2DistanceSquared', () => {
    it('computes squared distance', () => {
      expect(vec2DistanceSquared(vec2(2, 0), vec2(4, 0))).toBe(4)
      expect(vec2DistanceSquared(vec2(0, 3), vec2(0, 6))).toBe(9)
    })
  })

  describe('vec2Dot', () => {
    it('computes dot product', () => {
      expect(vec2Dot(vec2(2, 0), vec2(4, 0))).toBe(8)
      expect(vec2Dot(vec2(0, 3), vec2(0, 6))).toBe(18)
    })
  })

  describe('vec2Normalize', () => {
    it('normalizes', () => {
      expect(vec2Length(vec2Normalize(vec2(1, 2)))).toBeCloseTo(1)
    })
    it('returns out', () => {
      const out = vec2()
      expect(vec2Normalize(vec2(1, 2), out)).toBe(out)
    })
  })

  describe('vec2$normalize', () => {
    it('normalizes in place', () => {
      const out = vec2(1, 2)
      expect(vec2$normalize(out)).toBe(out)
      expect(vec2Length(out)).toBeCloseTo(1)
    })
  })

  describe('vec2Invert', () => {
    it('inverts', () => {
      expectComponents(vec2Invert(vec2(2, 4)), 0.5, 0.25)
    })
  })

  describe('vec2$invert', () => {
    it('inverts in place', () => {
      const out = vec2(2, 4)
      expect(vec2$invert(out)).toBe(out)
      expectComponents(out, 0.5, 0.25)
    })
  })

  describe('vec2Negate', () => {
    it('negates', () => {
      expectComponents(vec2Negate(vec2(2, 4)), -2, -4)
    })
  })

  describe('vec2$negate', () => {
    it('negates in place', () => {
      const out = vec2(2, 4)
      expect(vec2$negate(out)).toBe(out)
      expectComponents(out, -2, -4)
    })
  })

  describe('add', () => {
    describe('vec2Add', () => {
      it('adds', () => {
        expectComponents(vec2Add(vec2(1, 2), vec2(5, 6)), 6, 8)
      })
      it('returns new vector', () => {
        const a = vec2(1, 2)
        const b = vec2(5, 6)
        const res = vec2Add(a, b)
        expect(res).not.toBe(a)
        expect(res).not.toBe(b)
      })
      it('returns out', () => {
        const out = vec2()
        expect(vec2Add(vec2(1, 2), vec2(5, 6), out)).toBe(out)
      })
    })
    describe('vec2$add', () => {
      it('adds in place', () => {
        const out = vec2(1, 2)
        expect(vec2$add(out, vec2(5, 6))).toBe(out)
        expectComponents(out, 6, 8)
      })
    })
    describe('vec2AddScalar', () => {
      it('adds', () => {
        expectComponents(vec2AddScalar(vec2(1, 2), 0.5), 1.5, 2.5)
      })
    })
    describe('vec2$addScalar', () => {
      it('adds in place', () => {
        const out = vec2(1, 2)
        expect(vec2$addScalar(out, 0.5)).toBe(out)
        expectComponents(out, 1.5, 2.5)
      })
    })
    describe('vec2AddScaled', () => {
      it('adds', () => {
        expectComponents(vec2AddScaled(vec2(1, 2), vec2(5, 6), 0.5), 3.5, 5)
      })
    })
    describe('vec2$addScaled', () => {
      it('adds in place', () => {
        const out = vec2(1, 2)
        expect(vec2$addScaled(out, vec2(5, 6), 0.5)).toBe(out)
        expectComponents(out, 3.5, 5)
      })
    })
  })

  describe('subtract', () => {
    describe('vec2Subtract', () => {
      it('subtracts', () => {
        expectComponents(vec2Subtract(vec2(5, 6), vec2(4, 3)), 1, 3)
      })
      it('returns out', () => {
        const out = vec2()
        expect(vec2Subtract(vec2(5, 6), vec2(4, 3), out)).toBe(out)
      })
    })
    describe('vec2$subtract', () => {
      it('subtracts in place', () => {
        const out = vec2(5, 6)
        expect(vec2$subtract(out, vec2(4, 3))).toBe(out)
        expectComponents(out, 1, 3)
      })
    })
    describe('vec2SubtractScalar', () => {
      it('subtracts', () => {
        expectComponents(vec2SubtractScalar(vec2(1, 2), 0.5), 0.5, 1.5)
      })
    })
    describe('vec2$subtractScalar', () => {
      it('subtracts in place', () => {
        const out = vec2(1, 2)
        expect(vec2$subtractScalar(out, 0.5)).toBe(out)
        expectComponents(out, 0.5, 1.5)
      })
    })
    describe('vec2SubtractScaled', () => {
      it('subtracts', () => {
        expectComponents(vec2SubtractScaled(vec2(5, 6), vec2(1, 2), 0.5), 4.5, 5)
      })
    })
    describe('vec2$subtractScaled', () => {
      it('subtracts in place', () => {
        const out = vec2(5, 6)
        expect(vec2$subtractScaled(out, vec2(1, 2), 0.5)).toBe(out)
        expectComponents(out, 4.5, 5)
      })
    })
  })

  describe('multiply', () => {
    describe('vec2Multiply', () => {
      it('multiplies', () => {
        expectComponents(vec2Multiply(vec2(1, 2), vec2(5, 6)), 5, 12)
      })
      it('returns out', () => {
        const out = vec2()
        expect(vec2Multiply(vec2(1, 2), vec2(5, 6), out)).toBe(out)
      })
    })
    describe('vec2$multiply', () => {
      it('multiplies in place', () => {
        const out = vec2(1, 2)
        expect(vec2$multiply(out, vec2(5, 6))).toBe(out)
        expectComponents(out, 5, 12)
      })
    })
    describe('vec2MultiplyScalar', () => {
      it('multiplies', () => {
        expectComponents(vec2MultiplyScalar(vec2(1, 2), 0.5), 0.5, 1)
      })
    })
    describe('vec2$multiplyScalar', () => {
      it('multiplies in place', () => {
        const out = vec2(1, 2)
        expect(vec2$multiplyScalar(out, 0.5)).toBe(out)
        expectComponents(out, 0.5, 1)
      })
    })
  })

  describe('divide', () => {
    describe('vec2Divide', () => {
      it('divides', () => {
        expectComponents(vec2Divide(vec2(4, 16), vec2(2, 4)), 2, 4)
      })
      it('returns out', () => {
        const out = vec2()
        expect(vec2Divide(vec2(4, 16), vec2(2, 4), out)).toBe(out)
      })
    })
    describe('vec2$divide', () => {
      it('divides in place', () => {
        const out = vec2(4, 16)
        expect(vec2$divide(out, vec2(2, 4))).toBe(out)
        expectComponents(out, 2, 4)
      })
    })
    describe('vec2DivideScalar', () => {
      it('divides', () => {
        expectComponents(vec2DivideScalar(vec2(1, 2), 2), 0.5, 1)
      })
    })
    describe('vec2$divideScalar', () => {
      it('divides in place', () => {
        const out = vec2(1, 2)
        expect(vec2$divideScalar(out, 2)).toBe(out)
        expectComponents(out, 0.5, 1)
      })
    })
  })

  describe('vec2Saturate', () => {
    it('clamps to [0, 1]', () => {
      expectComponents(vec2Saturate(vec2(-1, 2)), 0, 1)
      expectComponents(vec2Saturate(vec2(0.5, 0.25)), 0.5, 0.25)
    })
  })

  describe('vec2$saturate', () => {
    it('clamps in place', () => {
      const out = vec2(-1, 2)
      expect(vec2$saturate(out)).toBe(out)
      expectComponents(out, 0, 1)
    })
  })

  describe('vec2Clamp', () => {
    const min = vec2(1, 2)
    const max = vec2(1.5, 2.5)
    it('clamps to min', () => {
      expectComponents(vec2Clamp(vec2(0.9, 1.9), min, max), 1, 2)
    })
    it('clamps to max', () => {
      expectComponents(vec2Clamp(vec2(1.6, 2.6), min, max), 1.5, 2.5)
    })
  })

  describe('vec2$clamp', () => {
    it('clamps in place', () => {
      const out = vec2(0.9, 2.6)
      expect(vec2$clamp(out, vec2(1, 2), vec2(1.5, 2.5))).toBe(out)
      expectComponents(out, 1, 2.5)
    })
  })

  describe('vec2ClampScalar', () => {
    it('clamps to min', () => {
      expectComponents(vec2ClampScalar(vec2(1, 2), 5, 10), 5, 5)
    })
    it('clamps to max', () => {
      expectComponents(vec2ClampScalar(vec2(3, 4), 1, 2), 2, 2)
    })
  })

  describe('vec2$clampScalar', () => {
    it('clamps in place', () => {
      const out = vec2(0, 3)
      expect(vec2$clampScalar(out, 1, 2)).toBe(out)
      expectComponents(out, 1, 2)
    })
  })

  describe('vec2Min', () => {
    it('takes component min', () => {
      expectComponents(vec2Min(vec2(1, 2), vec2(5, 6)), 1, 2)
      expectComponents(vec2Min(vec2(5, 6), vec2(1, 2)), 1, 2)
    })
  })

  describe('vec2MinScalar', () => {
    it('takes component min', () => {
      expectComponents(vec2MinScalar(vec2(1, 2), 0.5), 0.5, 0.5)
      expectComponents(vec2MinScalar(vec2(1, 2), 5), 1, 2)
    })
  })

  describe('vec2Max', () => {
    it('takes component max', () => {
      expectComponents(vec2Max(vec2(1, 2), vec2(5, 6)), 5, 6)
      expectComponents(vec2Max(vec2(5, 6), vec2(1, 2)), 5, 6)
    })
  })

  describe('vec2MaxScalar', () => {
    it('takes component max', () => {
      expectComponents(vec2MaxScalar(vec2(1, 2), 5), 5, 5)
      expectComponents(vec2MaxScalar(vec2(1, 2), 0.5), 1, 2)
    })
  })

  describe('vec2Lerp', () => {
    it('interpolates', () => {
      expectComponents(vec2Lerp(vec2(1, 2), vec2(5, 6), 0.5), 3, 4)
    })
  })

  describe('vec2Barycentric', () => {
    it('interpolates', () => {
      expectComponents(vec2Barycentric(vec2(1, 2), vec2(5, 6), vec2(9, 10), 0.5, 0.5), 7, 8)
    })
  })

  describe('vec2TransformByMat4', () => {
    it('transforms', () => {
      expectComponents(vec2TransformByMat4(vec2(1, 1), mat4), 9, 12)
    })
    it('accepts Mat4', () => {
      expectComponents(vec2TransformByMat4(vec2(1, 1), mat4CreateTranslationXYZ(1, 2, 3)), 2, 3)
    })
  })

  describe('vec2$transformByMat4', () => {
    it('transforms in place', () => {
      const out = vec2(1, 1)
      expect(vec2$transformByMat4(out, mat4)).toBe(out)
      expectComponents(out, 9, 12)
    })
  })

  describe('vec2TransformByMat3', () => {
    it('transforms', () => {
      expectComponents(vec2TransformByMat3(vec2(1, 1), mat3), 4, 6)
    })
    it('accepts Mat3', () => {
      expectComponents(vec2TransformByMat3(vec2(1, 1), mat3CreateRotationZ(Math.PI * 0.5)), -1, 1)
    })
  })

  describe('vec2$transformByMat3', () => {
    it('transforms in place', () => {
      const out = vec2(1, 1)
      expect(vec2$transformByMat3(out, mat3)).toBe(out)
      expectComponents(out, 4, 6)
    })
  })

  describe('vec2TransformByMat2', () => {
    it('transforms', () => {
      expectComponents(vec2TransformByMat2(vec2(1, 1), mat2), 4, 6)
    })
    it('accepts Mat2', () => {
      expectComponents(vec2TransformByMat2(vec2(1, 1), mat2CreateRotationZ(Math.PI * 0.5)), -1, 1)
    })
  })

  describe('vec2$transformByMat2', () => {
    it('transforms in place', () => {
      const out = vec2(1, 1)
      expect(vec2$transformByMat2(out, mat2)).toBe(out)
      expectComponents(out, 4, 6)
    })
  })

  describe('vec2Format', () => {
    it('formats components', () => {
      expect(vec2Format(vec2(1, 2))).toBe('x: 1.00000, y: 2.00000')
    })
  })
})
