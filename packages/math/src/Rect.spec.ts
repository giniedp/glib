import { describe, expect, it } from 'vitest'
import {
  rect,
  rect$ceil,
  rect$floor,
  rect$inflate,
  rect$init,
  rect$initFrom,
  rect$round,
  rect$setCenter,
  rectCeil,
  rectContains,
  rectContainsRect,
  rectContainsXY,
  rectCopy,
  rectEquals,
  rectFloor,
  rectGetPoint,
  rectGetX,
  rectGetY,
  rectInflate,
  rectIntersection,
  rectIntersects,
  rectRound,
  rectUnion,
} from './Rect'
import { IRect } from './Types'
import { vec2 } from './Vec2'

describe('rect', () => {
  function expectComponents(r: IRect, x: number, y: number, width: number, height: number) {
    expect(r.x, 'x component').toBeCloseTo(x, 5)
    expect(r.y, 'y component').toBeCloseTo(y, 5)
    expect(r.width, 'width component').toBeCloseTo(width, 5)
    expect(r.height, 'height component').toBeCloseTo(height, 5)
  }

  describe('rect', () => {
    it('creates zero rectangle', () => {
      expectComponents(rect(), 0, 0, 0, 0)
    })
    it('creates rectangle', () => {
      expectComponents(rect(1, 2, 3, 4), 1, 2, 3, 4)
    })
  })

  describe('rect$init', () => {
    it('sets components', () => {
      expectComponents(rect$init(rect(), 1, 2, 3, 4), 1, 2, 3, 4)
    })
    it('returns out', () => {
      const out = rect()
      expect(rect$init(out, 1, 2, 3, 4)).toBe(out)
    })
  })

  describe('rect$initFrom', () => {
    it('copies components', () => {
      expectComponents(rect$initFrom(rect(), { x: 1, y: 2, width: 3, height: 4 }), 1, 2, 3, 4)
    })
    it('returns out', () => {
      const out = rect()
      expect(rect$initFrom(out, rect(1, 2, 3, 4))).toBe(out)
    })
  })

  describe('rectCopy', () => {
    it('creates copy', () => {
      const r = rect(1, 2, 3, 4)
      const result = rectCopy(r)
      expectComponents(result, 1, 2, 3, 4)
      expect(result).not.toBe(r)
    })
    it('writes to out', () => {
      const out = rect()
      expect(rectCopy(rect(1, 2, 3, 4), out)).toBe(out)
      expectComponents(out, 1, 2, 3, 4)
    })
  })

  describe('rectEquals', () => {
    it('compares components', () => {
      expect(rectEquals(rect(1, 2, 3, 4), rect(1, 2, 3, 4))).toBe(true)
      expect(rectEquals(rect(1, 2, 3, 4), rect(0, 2, 3, 4))).toBe(false)
      expect(rectEquals(rect(1, 2, 3, 4), rect(1, 0, 3, 4))).toBe(false)
      expect(rectEquals(rect(1, 2, 3, 4), rect(1, 2, 0, 4))).toBe(false)
      expect(rectEquals(rect(1, 2, 3, 4), rect(1, 2, 3, 0))).toBe(false)
    })
  })

  describe('rectGetX', () => {
    it('gets x at relative position', () => {
      const r = rect(10, 20, 100, 200)
      expect(rectGetX(r, 0)).toBe(10)
      expect(rectGetX(r, 0.5)).toBe(60)
      expect(rectGetX(r, 1)).toBe(110)
    })
  })

  describe('rectGetY', () => {
    it('gets y at relative position', () => {
      const r = rect(10, 20, 100, 200)
      expect(rectGetY(r, 0)).toBe(20)
      expect(rectGetY(r, 0.5)).toBe(120)
      expect(rectGetY(r, 1)).toBe(220)
    })
  })

  describe('rectGetPoint', () => {
    it('gets point at relative position', () => {
      const r = rect(10, 20, 100, 200)
      expect(rectGetPoint(r, 0, 0)).toEqual({ x: 10, y: 20 })
      expect(rectGetPoint(r, 1, 1)).toEqual({ x: 110, y: 220 })
      expect(rectGetPoint(r, 0.5, 0.5)).toEqual({ x: 60, y: 120 })
    })
    it('writes to out', () => {
      const out = vec2()
      expect(rectGetPoint(rect(10, 20, 100, 200), 1, 0, out)).toBe(out)
      expect(out).toEqual({ x: 110, y: 20 })
    })
  })

  describe('rect$setCenter', () => {
    it('moves center to point', () => {
      expectComponents(rect$setCenter(rect(0, 0, 10, 20), vec2(5, 5)), 0, -5, 10, 20)
    })
    it('returns out', () => {
      const out = rect()
      expect(rect$setCenter(out, vec2(5, 5))).toBe(out)
    })
  })

  // [name, mutable function, pure function, expected result for rect(1.5, -1.5, 2.2, 3.7)]
  const roundings: Array<[string, (r: IRect) => IRect, (r: IRect, out?: IRect) => IRect, number[]]> = [
    ['Floor', rect$floor, rectFloor, [1, -2, 2, 3]],
    ['Ceil', rect$ceil, rectCeil, [2, -1, 3, 4]],
    ['Round', rect$round, rectRound, [2, -1, 2, 4]],
  ]
  for (const [name, mutable, pure, [x, y, width, height]] of roundings) {
    const input = () => rect(1.5, -1.5, 2.2, 3.7)

    describe(`rect$${name.toLowerCase()}`, () => {
      it('changes each component', () => {
        expectComponents(mutable(input()), x, y, width, height)
      })
      it('returns out', () => {
        const out = input()
        expect(mutable(out)).toBe(out)
      })
    })

    describe(`rect${name}`, () => {
      it('changes each component', () => {
        const r = input()
        expectComponents(pure(r), x, y, width, height)
        expectComponents(r, 1.5, -1.5, 2.2, 3.7)
      })
      it('writes to out', () => {
        const out = rect()
        expect(pure(input(), out)).toBe(out)
      })
    })
  }

  describe('rect$inflate', () => {
    it('grows on each side', () => {
      expectComponents(rect$inflate(rect(10, 20, 100, 200), 1, 2), 9, 18, 102, 204)
    })
    it('returns out', () => {
      const out = rect()
      expect(rect$inflate(out, 1, 2)).toBe(out)
    })
  })

  describe('rectInflate', () => {
    it('grows on each side', () => {
      const r = rect(10, 20, 100, 200)
      expectComponents(rectInflate(r, 1, 2), 9, 18, 102, 204)
      expectComponents(r, 10, 20, 100, 200)
    })
    it('writes to out', () => {
      const out = rect()
      expect(rectInflate(rect(), 1, 2, out)).toBe(out)
    })
  })

  describe('rectContains', () => {
    const r = rect(0, 0, 10, 10)
    it('contains point inside', () => {
      expect(rectContains(r, vec2(5, 5))).toBe(true)
    })
    it('contains left and top edge', () => {
      expect(rectContains(r, vec2(0, 0))).toBe(true)
    })
    it('does not contain right and bottom edge', () => {
      expect(rectContains(r, vec2(10, 5))).toBe(false)
      expect(rectContains(r, vec2(5, 10))).toBe(false)
    })
    it('does not contain point outside', () => {
      expect(rectContains(r, vec2(-1, 5))).toBe(false)
      expect(rectContains(r, vec2(5, -1))).toBe(false)
    })
  })

  describe('rectContainsXY', () => {
    it('checks coordinates', () => {
      expect(rectContainsXY(rect(0, 0, 10, 10), 5, 5)).toBe(true)
      expect(rectContainsXY(rect(0, 0, 10, 10), 10, 5)).toBe(false)
    })
  })

  describe('rectContainsRect', () => {
    const r = rect(0, 0, 10, 10)
    it('contains rectangle inside', () => {
      expect(rectContainsRect(r, rect(2, 2, 5, 5))).toBe(true)
      expect(rectContainsRect(r, rect(0, 0, 10, 10))).toBe(true)
    })
    it('does not contain overlapping rectangle', () => {
      expect(rectContainsRect(r, rect(5, 5, 10, 10))).toBe(false)
    })
  })

  describe('rectIntersects', () => {
    const r = rect(0, 0, 10, 10)
    it('detects overlap', () => {
      expect(rectIntersects(r, rect(5, 5, 10, 10))).toBe(true)
      expect(rectIntersects(r, rect(2, 2, 5, 5))).toBe(true)
    })
    it('ignores touching edges', () => {
      expect(rectIntersects(r, rect(10, 0, 10, 10))).toBe(false)
    })
    it('detects no overlap', () => {
      expect(rectIntersects(r, rect(20, 20, 5, 5))).toBe(false)
    })
  })

  describe('rectIntersection', () => {
    it('gets overlapping area', () => {
      expectComponents(rectIntersection(rect(0, 0, 10, 10), rect(5, 2, 10, 10)), 5, 2, 5, 8)
    })
    it('gets empty rectangle without overlap', () => {
      expectComponents(rectIntersection(rect(0, 0, 10, 10), rect(20, 20, 5, 5)), 0, 0, 0, 0)
    })
    it('writes to out', () => {
      const out = rect()
      expect(rectIntersection(rect(0, 0, 10, 10), rect(5, 2, 10, 10), out)).toBe(out)
    })
  })

  describe('rectUnion', () => {
    it('gets bounding rectangle', () => {
      expectComponents(rectUnion(rect(0, 0, 10, 10), rect(5, -2, 10, 10)), 0, -2, 15, 12)
    })
    it('writes to out', () => {
      const out = rect()
      expect(rectUnion(rect(0, 0, 10, 10), rect(5, -2, 10, 10), out)).toBe(out)
    })
  })
})
