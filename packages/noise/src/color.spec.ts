import { describe, expect, it } from 'vitest'
import {
  abs,
  add,
  cell,
  channel,
  clamp,
  color,
  fbm,
  gradient,
  mix,
  mul,
  opaque,
  parseColor,
  perlin,
  remap,
  rgba,
  scale,
  simplex,
  toGlsl,
  toWgsl,
  uniform,
  warp,
} from './index'

const P = [0.31, 0.62, 0.17] as const

describe('noise color', () => {
  describe('channels', () => {
    it('keeps scalar graphs at 1 channel', () => {
      const field = perlin().pipe(fbm(), abs(), add(0.5, cell()), mix(simplex(), 0.3), warp(perlin()))
      expect(field.channels).toBe(1)
    })

    it('uses 4 channels as soon as a color is involved', () => {
      expect(color('#fff').channels).toBe(4)
      expect(perlin().pipe(gradient([[0, '#000']])).channels).toBe(4)
      expect(perlin().pipe(mul(color('#f80'))).channels).toBe(4)
      expect(perlin().pipe(add([1, 0, 0, 0]))).toHaveProperty('channels', 4)
      expect(perlin().pipe(mix(color('#f80'), 0.5), fbm(), abs()).channels).toBe(4)
      expect(rgba(perlin(), 0, 0).channels).toBe(4)
      expect(perlin().pipe(opaque()).channels).toBe(4)
    })

    it('goes back to 1 channel with channel()', () => {
      expect(rgba(perlin(), 0, 0).pipe(channel(0)).channels).toBe(1)
    })

    it('keeps the source channels when warping by a color field', () => {
      expect(perlin().pipe(warp(rgba(simplex(), 0, 0))).channels).toBe(1)
    })
  })

  describe('broadcast', () => {
    it('samples a scalar graph as (v, v, v, v)', () => {
      const field = perlin().pipe(fbm({ octaves: 3 }))
      const v = field.sample(...P)
      expect(field.sampleColor(...P)).toEqual([v, v, v, v])
    })

    it('computes the same values per channel as the scalar graph', () => {
      const scalar = perlin().pipe(fbm({ octaves: 4 }), abs())
      // multiplying by white turns the same graph into a color graph
      const colored = perlin().pipe(mul(color([1, 1, 1, 1])), fbm({ octaves: 4 }), abs())
      expect(colored.channels).toBe(4)
      const v = scalar.sample(...P)
      for (const it of colored.sampleColor(...P)) {
        expect(it).toBeCloseTo(v, 12)
      }
    })

    it('sets alpha with opaque', () => {
      const v = perlin().sample(...P)
      expect(perlin().pipe(opaque()).sampleColor(...P)).toEqual([v, v, v, 1])
    })
  })

  describe('color', () => {
    it('parses hex colors', () => {
      expect(parseColor('#ff0000')).toEqual([1, 0, 0, 1])
      expect(parseColor('#0f08')).toEqual([0, 1, 0, 0x88 / 255])
      expect(parseColor('#00000080')).toEqual([0, 0, 0, 0x80 / 255])
      expect(() => parseColor('red')).toThrow(/Invalid color/)
    })

    it('mixes colors by a mask', () => {
      const field = color('#000000').pipe(mix(color('#ffffff'), 0.25))
      expect(field.sampleColor(0, 0)).toEqual([0.25, 0.25, 0.25, 1])
    })

    it('composes and extracts channels', () => {
      const field = rgba(perlin(), simplex(), 0.5, uniform('alpha', 0.75))
      const [r, g, b, a] = field.sampleColor(...P)
      expect(r).toBe(perlin().sample(...P))
      expect(g).toBe(simplex().sample(...P))
      expect([b, a]).toEqual([0.5, 0.75])
      expect(field.pipe(channel(1)).sample(...P)).toBe(g)
      field.params.alpha = 0.25
      expect(field.sampleColor(...P)[3]).toBe(0.25)
    })
  })

  describe('gradient', () => {
    const stops = () =>
      gradient([
        [0.2, [1, 0, 0, 1]],
        [0.6, [0, 1, 0, 1]],
        [uniform('top', 0.8), uniform('peak', [0, 0, 1, 1])],
      ])

    it('clamps below the first and above the last stop', () => {
      expect(color([0, 0, 0, 0]).pipe(channel(0), add(0.1), stops()).sampleColor(0, 0)).toEqual([1, 0, 0, 1])
      expect(color([0, 0, 0, 0]).pipe(channel(0), add(0.95), stops()).sampleColor(0, 0)).toEqual([0, 0, 1, 1])
    })

    it('interpolates between stops', () => {
      const [r, g, b] = color([0.4, 0, 0, 0]).pipe(channel(0), stops()).sampleColor(0, 0)
      expect([r, g, b].map((it) => +it.toFixed(12))).toEqual([0.5, 0.5, 0])
    })

    it('hits the colors at the stops', () => {
      expect(color([0.6, 0, 0, 0]).pipe(channel(0), stops()).sampleColor(0, 0)).toEqual([0, 1, 0, 1])
    })

    it('updates uniform stops without rebuilding', () => {
      const field = color([0.9, 0, 0, 0]).pipe(channel(0), stops())
      field.params.peak = [1, 1, 1, 1]
      expect(field.sampleColor(0, 0)).toEqual([1, 1, 1, 1])
      field.params.top = 1
      // 0.9 is now at 75% between the stops at 0.6 (green) and 1 (white)
      expect(field.sampleColor(0, 0).map((it) => +it.toFixed(12))).toEqual([0.75, 1, 0.75, 1])
    })
  })

  describe('emit', () => {
    it('emits only float functions for scalar graphs', () => {
      const code = toWgsl(perlin().pipe(fbm(), remap(-1, 1, 0, 1))).code
      expect(code).not.toContain('-> vec4f')
      expect(toWgsl(perlin()).type).toBe('float')
    })

    it('emits vec4 functions and promotes scalar children', () => {
      const field = perlin().pipe(scale(2), fbm({ octaves: 3 }), gradient([[0, '#000'], [1, '#fff']]), mix(color(uniform('tint', [1, 0.5, 0, 1])), cell()))
      const wgsl = toWgsl(field)
      const glsl = toGlsl(field)
      expect(wgsl.type).toBe('vec4')
      expect(wgsl.code).toMatch(/fn noise_mix_\d+\(p: vec3f\) -> vec4f/)
      expect(wgsl.code).toMatch(/fn noise_fbm_\d+\(p: vec3f\) -> f32/)
      // the scalar cell field is promoted to the weight of mix
      expect(wgsl.code).toMatch(/mix\(noise_gradient_\d+\(p\), noise\.tint, vec4f\(noise_cell_\d+\(p\)\)\)/)
      expect(glsl.code).toMatch(/mix\(noise_gradient_\d+\(p\), noise\.tint, vec4\(noise_cell_\d+\(p\)\)\)/)
      expect(wgsl.uniforms.map((it) => [it.name, it.type, it.offset])).toEqual([['tint', 'vec4', 0]])
    })

    it('promotes scalar function arguments in vec4 functions', () => {
      const code = toWgsl(rgba(perlin(), 0, 0).pipe(clamp(0, 1))).code
      expect(code).toMatch(/clamp\(noise_rgba_\d+\(p\), vec4f\(0\.0\), vec4f\(1\.0\)\)/)
    })
  })
})
