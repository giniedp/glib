/// <reference types="vite/client" />
import { describe, expect, it } from 'vitest'
import {
  abs,
  add,
  cell,
  clamp,
  constant,
  type EmitContext,
  type EvalContext,
  fbm,
  Field,
  hash,
  hash3,
  mix,
  mul,
  type Params,
  perlin,
  pipe,
  remap,
  ridged,
  scale,
  shift,
  simplex,
  toGlsl,
  toWgsl,
  uniform,
  unit,
  value,
  warp,
} from './index'

describe('noise', () => {
  describe('primitives', () => {
    it('hashes like lowbias32', () => {
      expect(hash(0)).toBe(0)
      expect(hash(1)).toBeGreaterThan(0)
      expect(hash(0xffffffff)).toBeLessThan(2 ** 32)
      expect(hash3(-1, 0, 1)).toBe(hash(0xffffffff ^ hash(0 ^ hash(1))))
    })

    it('maps hashes to [0, 1)', () => {
      expect(unit(0)).toBe(0)
      expect(unit(0xffffffff)).toBeLessThan(1)
    })

    it('perlin is zero at lattice points', () => {
      const field = perlin()
      expect(field.sample(0, 0, 0)).toBe(0)
      expect(field.sample(3, -2, 5)).toBeCloseTo(0, 12)
    })

    it('value noise interpolates the lattice values', () => {
      expect(value().sample(2, 3, 4)).toBeCloseTo(unit(hash3(2, 3, 4)) * 2 - 1, 12)
    })

    it('stays in about [-1, 1]', () => {
      for (const field of [perlin(), simplex(), value()]) {
        for (let i = 0; i < 2000; i++) {
          const v = field.sample(i * 0.137, i * 0.071, i * 0.031)
          expect(Math.abs(v)).toBeLessThanOrEqual(1.1)
        }
      }
    })

    it('cell noise f1 <= f2', () => {
      const f1 = cell({ output: 'f1' })
      const f2 = cell({ output: 'f2' })
      for (let i = 0; i < 200; i++) {
        expect(f1.sample(i * 0.3, i * 0.17)).toBeLessThanOrEqual(f2.sample(i * 0.3, i * 0.17))
      }
    })
  })

  describe('pipe', () => {
    it('builds the same graph with both assembly paths', () => {
      const a = pipe(perlin(), scale(4), fbm({ octaves: 3 }), clamp(0, 1))
      const b = perlin().pipe(scale(4), fbm({ octaves: 3 }), clamp(0, 1))
      expect(toWgsl(a).code).toBe(toWgsl(b).code)
      expect(a.sample(0.3, 0.7)).toBe(b.sample(0.3, 0.7))
    })

    it('accepts numbers and uniforms where fields are expected', () => {
      const field = perlin().pipe(add(0.5, uniform('bias', 0.25), simplex()))
      const p = [0.3, 0.6, 0.9] as const
      expect(field.sample(...p)).toBeCloseTo(perlin().sample(...p) + 0.75 + simplex().sample(...p), 12)
    })

    it('blends with mix', () => {
      const field = constant(1).pipe(mix(3, 0.25))
      expect(field.sample(0, 0)).toBe(1.5)
    })
  })

  describe('params', () => {
    it('collects uniforms by name and shares their value', () => {
      const field = perlin().pipe(
        shift(uniform('seed', [0, 0, 0])),
        fbm({ octaves: uniform('octaves', 4), gain: uniform('gain', 0.5) }),
        add(simplex().pipe(shift(uniform('seed', [0, 0, 0])))),
      )
      expect(Object.keys(field.params).sort()).toEqual(['gain', 'octaves', 'seed'])
      field.params.seed = [1, 2, 3]
      expect(field.uniformList.find((it) => it.name === 'seed').value).toEqual([1, 2, 3])
      const shifted = perlin().pipe(shift([1, 2, 3]), fbm({ octaves: 4, gain: 0.5 }))
      const detail = simplex().pipe(shift([1, 2, 3]))
      expect(field.sample(0.3, 0.4)).toBeCloseTo(shifted.sample(0.3, 0.4) + detail.sample(0.3, 0.4), 12)
    })

    it('throws on conflicting uniforms', () => {
      const field = perlin().pipe(add(uniform('a', 1)), mul(uniform('a', 2)))
      expect(() => field.params).toThrow(/declared twice/)
    })

    it('is typed', () => {
      const field = perlin().pipe(ridged({ gain: uniform('gain', 0.5), octaves: 4 }), clamp(0, uniform('top', 1)))
      field.params.gain = 0.6
      field.params.top = 0.9
      // @ts-expect-error octaves is a constant
      field.params.octaves = 3
      // @ts-expect-error maxOctaves changes the generated code and does not accept uniforms
      ridged({ maxOctaves: uniform('max', 4) })
      expect(field.params.gain).toBe(0.6)
    })
  })

  describe('fractals', () => {
    it('sums octaves with fbm', () => {
      const field = perlin().pipe(fbm({ octaves: 2, lacunarity: 2, gain: 0.5 }))
      const expected = perlin().sample(0.3, 0.4, 0.5) + perlin().sample(0.6, 0.8, 1.0) * 0.5
      expect(field.sample(0.3, 0.4, 0.5)).toBeCloseTo(expected, 12)
    })

    it('runs ceil(octaves) iterations for constant and uniform octaves', () => {
      const constantCount = perlin().pipe(fbm({ octaves: 2.5 }))
      const uniformCount = perlin().pipe(fbm({ octaves: uniform('octaves', 2.5) }))
      const three = perlin().pipe(fbm({ octaves: 3 }))
      expect(constantCount.sample(0.3, 0.4)).toBe(three.sample(0.3, 0.4))
      expect(uniformCount.sample(0.3, 0.4)).toBe(three.sample(0.3, 0.4))
    })
  })

  describe('emit', () => {
    const graph = () =>
      pipe(
        perlin(),
        scale(uniform('frequency', 2)),
        ridged({ octaves: uniform('octaves', 5), maxOctaves: 8, gain: 0.5 }),
        warp(simplex().pipe(scale(0.5)), uniform('warp', 0.3)),
        add(cell({ distance: 'manhattan', output: 'f2-f1' }).pipe(mul(0.1))),
        abs(),
        remap(0, 2, 0, 1),
      )

    it('emits a uniform block in both languages', () => {
      const wgsl = toWgsl(graph())
      const glsl = toGlsl(graph())
      expect(wgsl.code).toContain('struct NoiseParams {')
      expect(wgsl.code).toContain('@group(0) @binding(0) var<uniform> noise: NoiseParams;')
      expect(glsl.code).toContain('layout(std140) uniform NoiseParams {')
      expect(wgsl.uniforms.map((it) => [it.name, it.offset])).toEqual(glsl.uniforms.map((it) => [it.name, it.offset]))
      expect(wgsl.uniforms.map((it) => it.path)).toEqual(['noise.frequency', 'noise.octaves', 'noise.warp'])
      expect(wgsl.blockSize).toBe(16)
    })

    it('emits each primitive once', () => {
      const code = toWgsl(graph()).code
      expect(code.match(/fn noise_hash\(/g)).toHaveLength(1)
      expect(code.match(/fn noise_cell3_manhattan\(/g)).toHaveLength(1)
    })

    it('emits shared subgraphs once', () => {
      const shared = perlin().pipe(scale(3))
      const code = toWgsl(shared.pipe(add(shared))).code
      expect(code.match(/fn noise_scale_\d+\(/g)).toHaveLength(1)
    })

    it('inlines uniforms', () => {
      const field = graph()
      field.params.warp = 0.75
      const code = toWgsl(field, { inline: true })
      expect(code.uniforms).toEqual([])
      expect(code.code).not.toContain('NoiseParams')
      expect(code.code).toContain('0.75')
    })

    it('emits a fixed loop for constant octaves and a bounded loop for uniform octaves', () => {
      const fixed = toGlsl(perlin().pipe(fbm({ octaves: 4 }))).code
      const bounded = toGlsl(perlin().pipe(fbm({ octaves: uniform('octaves', 4), maxOctaves: 9 }))).code
      expect(fixed).toMatch(/< 4; /)
      expect(fixed).not.toContain('break')
      expect(bounded).toMatch(/< 9; /)
      expect(bounded).toContain('>= noise.octaves) { break; }')
    })

    it('supports custom nodes', () => {
      // a node defined outside the package works with pipe, both emitters and the CPU
      class TerraceField extends Field<any> {
        public readonly kind = 'terrace'
        public constructor(
          public readonly source: Field<any>,
          public readonly steps: number,
        ) {
          super([source])
        }
        public emit(ctx: EmitContext): string {
          const steps = ctx.float(this.steps)
          return `${ctx.call('floor', `${ctx.sample(this.source)} * ${steps}`)} / ${steps}`
        }
        public evaluate(ctx: EvalContext, x: number, y: number, z: number, out: Float64Array): void {
          this.source.evaluate(ctx, x, y, z, out)
          for (let l = 0; l < this.channels; l++) {
            out[l] = Math.floor(out[l] * this.steps) / this.steps
          }
        }
      }
      const terrace =
        (steps: number) =>
        <P extends Params>(source: Field<P>): Field<P> =>
          new TerraceField(source, steps)

      const field = perlin().pipe(terrace(4))
      expect(toWgsl(field).code).toContain('fn noise_terrace_0(p: vec3f) -> f32')
      expect(toGlsl(field).code).toContain('float noise_terrace_0(vec3 p)')
      expect(field.sample(0.3, 0.4) * 4).toBe(Math.floor(perlin().sample(0.3, 0.4) * 4))
    })

    it('keeps language differences out of the nodes', () => {
      const sources = import.meta.glob(['./sources/*.ts', './modifiers/*.ts', './fractals/*.ts', './math/*.ts', './combinators/*.ts', './color/*.ts'], {
        query: '?raw',
        import: 'default',
        eager: true,
      }) as Record<string, string>
      expect(Object.keys(sources).length).toBeGreaterThan(10)
      for (const [file, source] of Object.entries(sources)) {
        expect(source, file).not.toMatch(/\.language\b|'wgsl'|'glsl'|WgslSyntax|GlslSyntax/)
      }
    })
  })
})
