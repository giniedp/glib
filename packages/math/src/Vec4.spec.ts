import { describe, expect, it } from 'vitest'
import {
  IVec4,
  mat2CreateRotationX,
  mat2CreateRotationY,
  mat2CreateRotationZ,
  mat3CreateAxisAngle,
  mat4CreateAxisAngle,
  mat4CreateTranslationXYZ,
  quatCreateAxisAngle,
  vec4,
  vec4$add,
  vec4$addScalar,
  vec4$addScaled,
  vec4$clamp,
  vec4$clampScalar,
  vec4$divide,
  vec4$divideScalar,
  vec4$init,
  vec4$initFill,
  vec4$initFrom,
  vec4$initRandom,
  vec4$invert,
  vec4$multiply,
  vec4$multiplyScalar,
  vec4$negate,
  vec4$normalize,
  vec4$saturate,
  vec4$subtract,
  vec4$subtractScalar,
  vec4$subtractScaled,
  vec4$applyMat2,
  vec4$applyMat3,
  vec4$applyMat4,
  vec4$applyQuat,
  vec4Add,
  vec4AddScalar,
  vec4AddScaled,
  vec4Barycentric,
  vec4Clamp,
  vec4ClampScalar,
  vec4Copy,
  vec4Distance,
  vec4DistanceSquared,
  vec4Divide,
  vec4DivideScalar,
  vec4Dot,
  vec4Equals,
  vec4Format,
  vec4FromArray,
  vec4Invert,
  vec4Length,
  vec4LengthSquared,
  vec4Lerp,
  vec4Max,
  vec4MaxScalar,
  vec4Min,
  vec4MinScalar,
  vec4Multiply,
  vec4MultiplyScalar,
  vec4Negate,
  vec4Normalize,
  vec4Saturate,
  vec4Subtract,
  vec4SubtractScalar,
  vec4SubtractScaled,
  vec4ToArray,
  vec4ApplyMat2,
  vec4ApplyMat3,
  vec4ApplyMat4,
  vec4ApplyQuat,
} from './index'

describe('vec4', () => {
  function expectComponents(v: IVec4, x: number, y: number, z: number, w: number) {
    expect(v.x, 'x component invalid').toBeCloseTo(x, 10)
    expect(v.y, 'y component invalid').toBeCloseTo(y, 10)
    expect(v.z, 'z component invalid').toBeCloseTo(z, 10)
    expect(v.w, 'w component invalid').toBeCloseTo(w, 10)
  }

  describe('vec4', () => {
    it('creates zero vector', () => {
      expect(vec4()).toEqual({ x: 0, y: 0, z: 0, w: 0 })
    })

    it('creates from xyzw', () => {
      expect(vec4(1)).toEqual({ x: 1, y: 1, z: 1, w: 1 })
      expect(vec4({ x: 1, y: 2 })).toEqual({ x: 1, y: 2, z: 0, w: 0 })
      expect(vec4({ x: 1, y: 2, z: 3 })).toEqual({ x: 1, y: 2, z: 3, w: 0 })
      expect(vec4({ x: 1, y: 2, z: 3, w: 4 })).toEqual({ x: 1, y: 2, z: 3, w: 4 })
      expect(vec4({} as any)).toEqual({ x: 0, y: 0, z: 0, w: 0 })
      expect(vec4([1])).toEqual({ x: 1, y: 0, z: 0, w: 0 })
      expect(vec4([1, 2])).toEqual({ x: 1, y: 2, z: 0, w: 0 })
      expect(vec4([1, 2, 3])).toEqual({ x: 1, y: 2, z: 3, w: 0 })
      expect(vec4([null, null, null, null])).toEqual({ x: 0, y: 0, z: 0, w: 0 })
    })

    it('creates from xyz, w', () => {
      expect(vec4(1, 2)).toEqual({ x: 1, y: 1, z: 1, w: 2 })
      expect(vec4({ x: 1, y: 2 }, 3)).toEqual({ x: 1, y: 2, z: 0, w: 3 })
      expect(vec4({ x: 1, y: 2, z: 3 }, 4)).toEqual({ x: 1, y: 2, z: 3, w: 4 })
      expect(vec4([1], 2)).toEqual({ x: 1, y: 0, z: 0, w: 2 })
      expect(vec4([1, 2], 3)).toEqual({ x: 1, y: 2, z: 0, w: 3 })
      expect(vec4([1, 2, 3], 4)).toEqual({ x: 1, y: 2, z: 3, w: 4 })
    })

    it('creates from xy, z, w', () => {
      expect(vec4(1, 2, 3)).toEqual({ x: 1, y: 1, z: 2, w: 3 })
      expect(vec4({ x: 1, y: 2 }, 3, 4)).toEqual({ x: 1, y: 2, z: 3, w: 4 })
      expect(vec4({ x: 1, y: 2, z: 3 }, 4, 5)).toEqual({ x: 1, y: 2, z: 4, w: 5 })
      expect(vec4([1], 2, 3)).toEqual({ x: 1, y: 0, z: 2, w: 3 })
      expect(vec4([1, 2], 3, 4)).toEqual({ x: 1, y: 2, z: 3, w: 4 })
      expect(vec4([1, 2, 3], 4, 5)).toEqual({ x: 1, y: 2, z: 4, w: 5 })
    })

    it('creates from x, y, z, w', () => {
      expect(vec4(1, 2, 3, 4)).toEqual({ x: 1, y: 2, z: 3, w: 4 })
    })
  })

  describe('vec4FromArray', () => {
    it('reads components', () => {
      expectComponents(vec4FromArray([1, 2, 3, 4]), 1, 2, 3, 4)
    })
    it('reads at offset', () => {
      expectComponents(vec4FromArray([1, 2, 3, 4, 5], 1), 2, 3, 4, 5)
    })
    it('reads with stride', () => {
      expectComponents(vec4FromArray([1, 2, 3, 4, 5, 6, 7, 8], 0, 2), 1, 3, 5, 7)
    })
  })

  describe('vec4$init', () => {
    it('sets components', () => {
      expectComponents(vec4$init(vec4(), 1, 2, 3, 4), 1, 2, 3, 4)
    })
    it('returns out', () => {
      const out = vec4()
      expect(vec4$init(out, 1, 2, 3, 4)).toBe(out)
    })
  })

  describe('vec4$initFrom', () => {
    it('copies components', () => {
      expectComponents(vec4$initFrom(vec4(), vec4(1, 2, 3, 4)), 1, 2, 3, 4)
    })
    it('returns out', () => {
      const out = vec4()
      expect(vec4$initFrom(out, vec4(1, 2, 3, 4))).toBe(out)
    })
  })

  describe('vec4$initFill', () => {
    it('sets all components', () => {
      expectComponents(vec4$initFill(vec4(), 2), 2, 2, 2, 2)
    })
    it('returns out', () => {
      const out = vec4()
      expect(vec4$initFill(out, 2)).toBe(out)
    })
  })

  describe('vec4$initRandom', () => {
    it('sets components in range', () => {
      const out = vec4$initRandom(vec4(), 2, 3)
      for (const v of vec4ToArray(out)) {
        expect(v).toBeGreaterThanOrEqual(2)
        expect(v).toBeLessThanOrEqual(3)
      }
    })
    it('returns out', () => {
      const out = vec4()
      expect(vec4$initRandom(out)).toBe(out)
    })
  })

  describe('vec4Copy', () => {
    it('copies components', () => {
      expectComponents(vec4Copy(vec4(1, 2, 3, 4)), 1, 2, 3, 4)
    })
    it('returns new vector', () => {
      const a = vec4(1, 2, 3, 4)
      expect(vec4Copy(a)).not.toBe(a)
    })
    it('returns out', () => {
      const out = vec4()
      expect(vec4Copy(vec4(1, 2, 3, 4), out)).toBe(out)
    })
  })

  describe('vec4ToArray', () => {
    it('writes components', () => {
      expect(vec4ToArray(vec4(1, 2, 3, 4))).toEqual([1, 2, 3, 4])
    })
    it('writes at offset', () => {
      expect(vec4ToArray(vec4(1, 2, 3, 4), [0, 0, 0, 0, 0], 1)).toEqual([0, 1, 2, 3, 4])
    })
  })

  describe('vec4Equals', () => {
    it('compares components', () => {
      expect(vec4Equals(vec4(0, 0, 0, 0), vec4(0, 0, 0, 0))).toBe(true)
      expect(vec4Equals(vec4(1, 0, 0, 0), vec4(1, 0, 0, 0))).toBe(true)
      expect(vec4Equals(vec4(0, 1, 0, 0), vec4(0, 1, 0, 0))).toBe(true)
      expect(vec4Equals(vec4(0, 0, 1, 0), vec4(0, 0, 1, 0))).toBe(true)
      expect(vec4Equals(vec4(0, 0, 0, 1), vec4(0, 0, 0, 1))).toBe(true)
      expect(vec4Equals(vec4(0, 0, 0, 0), vec4(1, 0, 0, 0))).toBe(false)
      expect(vec4Equals(vec4(0, 0, 0, 0), vec4(0, 1, 0, 0))).toBe(false)
      expect(vec4Equals(vec4(0, 0, 0, 0), vec4(0, 0, 1, 0))).toBe(false)
      expect(vec4Equals(vec4(0, 0, 0, 0), vec4(0, 0, 0, 1))).toBe(false)
    })
  })

  describe('vec4Length', () => {
    it('computes length', () => {
      expect(vec4Length(vec4(2, 0, 0, 0))).toBe(2)
      expect(vec4Length(vec4(0, 3, 0, 0))).toBe(3)
      expect(vec4Length(vec4(0, 0, 4, 0))).toBe(4)
      expect(vec4Length(vec4(0, 0, 0, 5))).toBe(5)
    })
  })

  describe('vec4LengthSquared', () => {
    it('computes squared length', () => {
      expect(vec4LengthSquared(vec4(2, 0, 0, 0))).toBe(4)
      expect(vec4LengthSquared(vec4(0, 3, 0, 0))).toBe(9)
      expect(vec4LengthSquared(vec4(0, 0, 4, 0))).toBe(16)
      expect(vec4LengthSquared(vec4(0, 0, 0, 5))).toBe(25)
    })
  })

  describe('vec4Distance', () => {
    it('computes distance', () => {
      expect(vec4Distance(vec4(2, 0, 0, 0), vec4(4, 0, 0, 0))).toBe(2)
      expect(vec4Distance(vec4(0, 3, 0, 0), vec4(0, 6, 0, 0))).toBe(3)
      expect(vec4Distance(vec4(0, 0, 4, 0), vec4(0, 0, 8, 0))).toBe(4)
      expect(vec4Distance(vec4(0, 0, 0, 5), vec4(0, 0, 0, 10))).toBe(5)
    })
  })

  describe('vec4DistanceSquared', () => {
    it('computes squared distance', () => {
      expect(vec4DistanceSquared(vec4(2, 0, 0, 0), vec4(4, 0, 0, 0))).toBe(4)
      expect(vec4DistanceSquared(vec4(0, 3, 0, 0), vec4(0, 6, 0, 0))).toBe(9)
      expect(vec4DistanceSquared(vec4(0, 0, 4, 0), vec4(0, 0, 8, 0))).toBe(16)
      expect(vec4DistanceSquared(vec4(0, 0, 0, 5), vec4(0, 0, 0, 10))).toBe(25)
    })
  })

  describe('vec4Dot', () => {
    it('computes dot product', () => {
      expect(vec4Dot(vec4(2, 0, 0, 0), vec4(4, 0, 0, 0))).toBe(8)
      expect(vec4Dot(vec4(0, 3, 0, 0), vec4(0, 6, 0, 0))).toBe(18)
      expect(vec4Dot(vec4(0, 0, 4, 0), vec4(0, 0, 8, 0))).toBe(32)
      expect(vec4Dot(vec4(0, 0, 0, 5), vec4(0, 0, 0, 10))).toBe(50)
    })
  })

  describe('vec4Normalize', () => {
    it('normalizes', () => {
      expect(vec4Length(vec4Normalize(vec4(1, 2, 3, 4)))).toBeCloseTo(1)
    })
    it('writes to out', () => {
      const out = vec4()
      expect(vec4Normalize(vec4(1, 2, 3, 4), out)).toBe(out)
    })
  })

  describe('vec4$normalize', () => {
    it('normalizes in place', () => {
      const out = vec4(1, 2, 3, 4)
      expect(vec4$normalize(out)).toBe(out)
      expect(vec4Length(out)).toBeCloseTo(1)
    })
  })

  describe('vec4Invert', () => {
    it('inverts', () => {
      expectComponents(vec4Invert(vec4(2, 4, 8, 16)), 0.5, 0.25, 0.125, 0.0625)
    })
  })

  describe('vec4$invert', () => {
    it('inverts in place', () => {
      const out = vec4(2, 4, 8, 16)
      expect(vec4$invert(out)).toBe(out)
      expectComponents(out, 0.5, 0.25, 0.125, 0.0625)
    })
  })

  describe('vec4Negate', () => {
    it('negates', () => {
      expectComponents(vec4Negate(vec4(2, 4, 8, 16)), -2, -4, -8, -16)
    })
  })

  describe('vec4$negate', () => {
    it('negates in place', () => {
      const out = vec4(2, 4, 8, 16)
      expect(vec4$negate(out)).toBe(out)
      expectComponents(out, -2, -4, -8, -16)
    })
  })

  describe('add', () => {
    describe('vec4Add', () => {
      it('adds', () => {
        expectComponents(vec4Add(vec4(1, 2, 3, 4), vec4(5, 6, 7, 8)), 6, 8, 10, 12)
      })
      it('returns new vector', () => {
        const a = vec4(1, 2, 3, 4)
        const b = vec4(5, 6, 7, 8)
        const res = vec4Add(a, b)
        expect(res).not.toBe(a)
        expect(res).not.toBe(b)
      })
      it('returns out', () => {
        const out = vec4()
        expect(vec4Add(vec4(1, 2, 3, 4), vec4(5, 6, 7, 8), out)).toBe(out)
      })
    })
    describe('vec4$add', () => {
      it('adds in place', () => {
        const out = vec4(1, 2, 3, 4)
        expect(vec4$add(out, vec4(5, 6, 7, 8))).toBe(out)
        expectComponents(out, 6, 8, 10, 12)
      })
    })
    describe('vec4AddScalar', () => {
      it('adds', () => {
        expectComponents(vec4AddScalar(vec4(1, 2, 3, 4), 0.5), 1.5, 2.5, 3.5, 4.5)
      })
    })
    describe('vec4$addScalar', () => {
      it('adds in place', () => {
        const out = vec4(1, 2, 3, 4)
        expect(vec4$addScalar(out, 0.5)).toBe(out)
        expectComponents(out, 1.5, 2.5, 3.5, 4.5)
      })
    })
    describe('vec4AddScaled', () => {
      it('adds', () => {
        expectComponents(vec4AddScaled(vec4(1, 2, 3, 4), vec4(5, 6, 7, 8), 0.5), 3.5, 5, 6.5, 8)
      })
    })
    describe('vec4$addScaled', () => {
      it('adds in place', () => {
        const out = vec4(1, 2, 3, 4)
        expect(vec4$addScaled(out, vec4(5, 6, 7, 8), 0.5)).toBe(out)
        expectComponents(out, 3.5, 5, 6.5, 8)
      })
    })
  })

  describe('subtract', () => {
    describe('vec4Subtract', () => {
      it('subtracts', () => {
        expectComponents(vec4Subtract(vec4(5, 6, 7, 8), vec4(4, 3, 2, 1)), 1, 3, 5, 7)
      })
      it('returns out', () => {
        const out = vec4()
        expect(vec4Subtract(vec4(5, 6, 7, 8), vec4(4, 3, 2, 1), out)).toBe(out)
      })
    })
    describe('vec4$subtract', () => {
      it('subtracts in place', () => {
        const out = vec4(5, 6, 7, 8)
        expect(vec4$subtract(out, vec4(4, 3, 2, 1))).toBe(out)
        expectComponents(out, 1, 3, 5, 7)
      })
    })
    describe('vec4SubtractScalar', () => {
      it('subtracts', () => {
        expectComponents(vec4SubtractScalar(vec4(1, 2, 3, 4), 0.5), 0.5, 1.5, 2.5, 3.5)
      })
    })
    describe('vec4$subtractScalar', () => {
      it('subtracts in place', () => {
        const out = vec4(1, 2, 3, 4)
        expect(vec4$subtractScalar(out, 0.5)).toBe(out)
        expectComponents(out, 0.5, 1.5, 2.5, 3.5)
      })
    })
    describe('vec4SubtractScaled', () => {
      it('subtracts', () => {
        expectComponents(vec4SubtractScaled(vec4(5, 6, 7, 8), vec4(1, 2, 3, 4), 0.5), 4.5, 5, 5.5, 6)
      })
    })
    describe('vec4$subtractScaled', () => {
      it('subtracts in place', () => {
        const out = vec4(5, 6, 7, 8)
        expect(vec4$subtractScaled(out, vec4(1, 2, 3, 4), 0.5)).toBe(out)
        expectComponents(out, 4.5, 5, 5.5, 6)
      })
    })
  })

  describe('multiply', () => {
    describe('vec4Multiply', () => {
      it('multiplies', () => {
        expectComponents(vec4Multiply(vec4(1, 2, 3, 4), vec4(5, 6, 7, 8)), 5, 12, 21, 32)
      })
      it('returns out', () => {
        const out = vec4()
        expect(vec4Multiply(vec4(1, 2, 3, 4), vec4(5, 6, 7, 8), out)).toBe(out)
      })
    })
    describe('vec4$multiply', () => {
      it('multiplies in place', () => {
        const out = vec4(1, 2, 3, 4)
        expect(vec4$multiply(out, vec4(5, 6, 7, 8))).toBe(out)
        expectComponents(out, 5, 12, 21, 32)
      })
    })
    describe('vec4MultiplyScalar', () => {
      it('multiplies', () => {
        expectComponents(vec4MultiplyScalar(vec4(1, 2, 3, 4), 0.5), 0.5, 1, 1.5, 2)
      })
    })
    describe('vec4$multiplyScalar', () => {
      it('multiplies in place', () => {
        const out = vec4(1, 2, 3, 4)
        expect(vec4$multiplyScalar(out, 0.5)).toBe(out)
        expectComponents(out, 0.5, 1, 1.5, 2)
      })
    })
  })

  describe('divide', () => {
    describe('vec4Divide', () => {
      it('divides', () => {
        expectComponents(vec4Divide(vec4(4, 16, 64, 256), vec4(2, 4, 8, 16)), 2, 4, 8, 16)
      })
      it('returns out', () => {
        const out = vec4()
        expect(vec4Divide(vec4(4, 16, 64, 256), vec4(2, 4, 8, 16), out)).toBe(out)
      })
    })
    describe('vec4$divide', () => {
      it('divides in place', () => {
        const out = vec4(4, 16, 64, 256)
        expect(vec4$divide(out, vec4(2, 4, 8, 16))).toBe(out)
        expectComponents(out, 2, 4, 8, 16)
      })
    })
    describe('vec4DivideScalar', () => {
      it('divides', () => {
        expectComponents(vec4DivideScalar(vec4(1, 2, 3, 4), 2), 0.5, 1, 1.5, 2)
      })
    })
    describe('vec4$divideScalar', () => {
      it('divides in place', () => {
        const out = vec4(1, 2, 3, 4)
        expect(vec4$divideScalar(out, 2)).toBe(out)
        expectComponents(out, 0.5, 1, 1.5, 2)
      })
    })
  })

  describe('vec4Saturate', () => {
    it('clamps to [0, 1]', () => {
      expectComponents(vec4Saturate(vec4(-1, 0.5, 2, 1)), 0, 0.5, 1, 1)
    })
  })

  describe('vec4$saturate', () => {
    it('clamps in place', () => {
      const out = vec4(-1, 0.5, 2, 1)
      expect(vec4$saturate(out)).toBe(out)
      expectComponents(out, 0, 0.5, 1, 1)
    })
  })

  describe('vec4Clamp', () => {
    const min = vec4(1, 2, 3, 4)
    const max = vec4(1.5, 2.5, 3.5, 4.5)
    it('clamps to min', () => {
      expectComponents(vec4Clamp(vec4(0.9, 1.9, 2.9, 3.9), min, max), 1, 2, 3, 4)
    })
    it('clamps to max', () => {
      expectComponents(vec4Clamp(vec4(1.6, 2.6, 3.6, 4.6), min, max), 1.5, 2.5, 3.5, 4.5)
    })
  })

  describe('vec4$clamp', () => {
    it('clamps in place', () => {
      const out = vec4(0.9, 2.6, 3.2, 4.6)
      expect(vec4$clamp(out, vec4(1, 2, 3, 4), vec4(1.5, 2.5, 3.5, 4.5))).toBe(out)
      expectComponents(out, 1, 2.5, 3.2, 4.5)
    })
  })

  describe('vec4ClampScalar', () => {
    it('clamps to min', () => {
      expectComponents(vec4ClampScalar(vec4(1, 2, 3, 4), 5, 10), 5, 5, 5, 5)
    })
    it('clamps to max', () => {
      expectComponents(vec4ClampScalar(vec4(3, 4, 5, 6), 1, 2), 2, 2, 2, 2)
    })
  })

  describe('vec4$clampScalar', () => {
    it('clamps in place', () => {
      const out = vec4(0, 1.5, 3, 4)
      expect(vec4$clampScalar(out, 1, 2)).toBe(out)
      expectComponents(out, 1, 1.5, 2, 2)
    })
  })

  describe('vec4Min', () => {
    it('takes component min', () => {
      expectComponents(vec4Min(vec4(1, 2, 3, 4), vec4(5, 6, 7, 8)), 1, 2, 3, 4)
      expectComponents(vec4Min(vec4(5, 6, 7, 8), vec4(1, 2, 3, 4)), 1, 2, 3, 4)
    })
  })

  describe('vec4MinScalar', () => {
    it('takes component min', () => {
      expectComponents(vec4MinScalar(vec4(1, 2, 3, 4), 0.5), 0.5, 0.5, 0.5, 0.5)
      expectComponents(vec4MinScalar(vec4(1, 2, 3, 4), 5), 1, 2, 3, 4)
    })
  })

  describe('vec4Max', () => {
    it('takes component max', () => {
      expectComponents(vec4Max(vec4(1, 2, 3, 4), vec4(5, 6, 7, 8)), 5, 6, 7, 8)
      expectComponents(vec4Max(vec4(5, 6, 7, 8), vec4(1, 2, 3, 4)), 5, 6, 7, 8)
    })
  })

  describe('vec4MaxScalar', () => {
    it('takes component max', () => {
      expectComponents(vec4MaxScalar(vec4(1, 2, 3, 4), 5), 5, 5, 5, 5)
      expectComponents(vec4MaxScalar(vec4(1, 2, 3, 4), 0.5), 1, 2, 3, 4)
    })
  })

  describe('vec4Lerp', () => {
    it('interpolates', () => {
      expectComponents(vec4Lerp(vec4(1, 2, 3, 4), vec4(5, 6, 7, 8), 0.5), 3, 4, 5, 6)
    })
  })

  describe('vec4Barycentric', () => {
    it('interpolates', () => {
      expectComponents(vec4Barycentric(vec4(1, 2, 3, 4), vec4(5, 6, 7, 8), vec4(9, 10, 11, 12), 0.5, 0.5), 7, 8, 9, 10)
    })
  })

  describe('vec4ApplyQuat', () => {
    it('rotates around x', () => {
      expectComponents(vec4ApplyQuat(vec4(1), quatCreateAxisAngle({ x: 1, y: 0, z: 0 }, Math.PI * 0.5)), 1, -1, 1, 1)
    })
    it('rotates around y', () => {
      expectComponents(vec4ApplyQuat(vec4(1), quatCreateAxisAngle({ x: 0, y: 1, z: 0 }, Math.PI * 0.5)), 1, 1, -1, 1)
    })
    it('rotates around z', () => {
      expectComponents(vec4ApplyQuat(vec4(1), quatCreateAxisAngle({ x: 0, y: 0, z: 1 }, Math.PI * 0.5)), -1, 1, 1, 1)
    })
  })

  describe('vec4$applyQuat', () => {
    it('rotates in place', () => {
      const out = vec4(1)
      expect(vec4$applyQuat(out, quatCreateAxisAngle({ x: 1, y: 0, z: 0 }, Math.PI * 0.5))).toBe(out)
      expectComponents(out, 1, -1, 1, 1)
    })
  })

  describe('vec4ApplyMat4', () => {
    it('rotates around x', () => {
      expectComponents(vec4ApplyMat4(vec4(1), mat4CreateAxisAngle({ x: 1, y: 0, z: 0 }, Math.PI * 0.5)), 1, -1, 1, 1)
    })
    it('rotates around y', () => {
      expectComponents(vec4ApplyMat4(vec4(1), mat4CreateAxisAngle({ x: 0, y: 1, z: 0 }, Math.PI * 0.5)), 1, 1, -1, 1)
    })
    it('rotates around z', () => {
      expectComponents(vec4ApplyMat4(vec4(1), mat4CreateAxisAngle({ x: 0, y: 0, z: 1 }, Math.PI * 0.5)), -1, 1, 1, 1)
    })
    it('translates', () => {
      expectComponents(vec4ApplyMat4(vec4(1), mat4CreateTranslationXYZ(1, 2, 3)), 2, 3, 4, 1)
    })
  })

  describe('vec4$applyMat4', () => {
    it('transforms in place', () => {
      const out = vec4(1)
      expect(vec4$applyMat4(out, mat4CreateTranslationXYZ(1, 2, 3))).toBe(out)
      expectComponents(out, 2, 3, 4, 1)
    })
  })

  describe('vec4ApplyMat3', () => {
    it('rotates around x', () => {
      expectComponents(vec4ApplyMat3(vec4(1), mat3CreateAxisAngle({ x: 1, y: 0, z: 0 }, Math.PI * 0.5)), 1, -1, 1, 1)
    })
    it('rotates around y', () => {
      expectComponents(vec4ApplyMat3(vec4(1), mat3CreateAxisAngle({ x: 0, y: 1, z: 0 }, Math.PI * 0.5)), 1, 1, -1, 1)
    })
    it('rotates around z', () => {
      expectComponents(vec4ApplyMat3(vec4(1), mat3CreateAxisAngle({ x: 0, y: 0, z: 1 }, Math.PI * 0.5)), -1, 1, 1, 1)
    })
  })

  describe('vec4$applyMat3', () => {
    it('transforms in place', () => {
      const out = vec4(1)
      expect(vec4$applyMat3(out, mat3CreateAxisAngle({ x: 1, y: 0, z: 0 }, Math.PI * 0.5))).toBe(out)
      expectComponents(out, 1, -1, 1, 1)
    })
  })

  describe('vec4ApplyMat2', () => {
    it('rotates around x', () => {
      expectComponents(vec4ApplyMat2(vec4(1), mat2CreateRotationX(Math.PI * 0.5)), 1, 0, 1, 1)
    })
    it('rotates around y', () => {
      expectComponents(vec4ApplyMat2(vec4(1), mat2CreateRotationY(Math.PI * 0.5)), 0, 1, 1, 1)
    })
    it('rotates around z', () => {
      expectComponents(vec4ApplyMat2(vec4(1), mat2CreateRotationZ(Math.PI * 0.5)), -1, 1, 1, 1)
    })
  })

  describe('vec4$applyMat2', () => {
    it('transforms in place', () => {
      const out = vec4(1)
      expect(vec4$applyMat2(out, mat2CreateRotationZ(Math.PI * 0.5))).toBe(out)
      expectComponents(out, -1, 1, 1, 1)
    })
  })

  describe('vec4Format', () => {
    it('formats components', () => {
      expect(vec4Format(vec4(1, 2, 3, 4))).toBe('x: 1.00000, y: 2.00000, z: 3.00000, w: 4.00000')
    })
  })
})
