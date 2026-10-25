import { type Device, WebglDevice, WebGpuDevice } from '@gglib/graphics'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import {
  abs,
  add,
  cell,
  clamp,
  color,
  fbm,
  fract,
  gradient,
  type Field,
  hybrid,
  mix,
  multifractal,
  mul,
  normals,
  opaque,
  perlin,
  pow,
  ProceduralTexture,
  remap,
  rgba,
  ridged,
  scale,
  seamless,
  shift,
  simplex,
  smoothstep,
  tiles,
  UnaryField,
  type UnaryOpName,
  uniform,
  value,
  warp,
} from './index'

const SIZE = 32
const REGION: [number, number, number, number] = [-1.3, 2.1, 3.7, 6.4]

const GRAPHS: Record<string, () => Field<any>> = {
  perlin: () => perlin().pipe(scale(2)),
  simplex: () => simplex().pipe(shift([0.5, 0.25, 0.125])),
  value: () => value().pipe(fbm({ octaves: uniform('octaves', 3.5) })),
  'cell euclidean': () => cell(),
  'cell manhattan f2-f1': () => cell({ distance: 'manhattan', output: 'f2-f1' }),
  ridged: () => perlin().pipe(ridged({ octaves: 5, gain: uniform('gain', 0.5) }), clamp(0, 1)),
  hybrid: () => simplex().pipe(hybrid({ octaves: 4 }), pow(1.5)),
  multifractal: () => perlin().pipe(multifractal({ octaves: 3 }), remap(0, 2, -1, 1)),
  warp: () => perlin().pipe(warp(simplex().pipe(scale(0.5)), uniform('warp', 0.4)), abs(), smoothstep(0, 1)),
  combine: () => perlin().pipe(add(cell().pipe(mul(0.5))), mul(uniform('height', 2))),
  seamless: () => perlin().pipe(fbm({ octaves: 3 }), seamless([2, uniform('period', 1.5)])),
  'seamless mean': () => simplex().pipe(seamless(1.7, { mean: uniform('mean', 0.1) })),
  'tiles checker': () => tiles().pipe(scale(1.3)),
  'tiles edge': () => tiles({ output: 'edge' }).pipe(scale(2.2), fract()),
  'tiles random': () => tiles({ output: 'random' }).pipe(scale(3.1)),
}

// every unary operator with an input range inside its domain
const UNARY_DOMAINS: Record<UnaryOpName, [number, number]> = {
  abs: [-2, 2],
  negate: [-2, 2],
  sign: [-2, 2],
  floor: [-2.5, 2.5],
  ceil: [-2.5, 2.5],
  trunc: [-2.5, 2.5],
  round: [-2.5, 2.5],
  fract: [-2.5, 2.5],
  saturate: [-0.5, 1.5],
  sqrt: [0, 4],
  inverseSqrt: [0.5, 4],
  exp: [-2, 2],
  exp2: [-2, 2],
  log: [0.5, 4],
  log2: [0.5, 4],
  sin: [-3, 3],
  cos: [-3, 3],
  tan: [-1, 1],
  asin: [-0.9, 0.9],
  acos: [-0.9, 0.9],
  atan: [-3, 3],
  sinh: [-2, 2],
  cosh: [-2, 2],
  tanh: [-2, 2],
  asinh: [-3, 3],
  acosh: [1.1, 4],
  atanh: [-0.9, 0.9],
  degrees: [-1, 1],
  radians: [-90, 90],
}
for (const [name, [lo, hi]] of Object.entries(UNARY_DOMAINS)) {
  GRAPHS[`unary ${name}`] = () =>
    perlin().pipe(remap(-1, 1, lo, hi), clamp(lo, hi), (source) => new UnaryField(name as UnaryOpName, source))
}

const COLOR_GRAPHS: Record<string, () => Field<any>> = {
  gradient: () =>
    perlin().pipe(
      fbm({ octaves: 4 }),
      remap(-0.7, 0.7, 0, 1),
      gradient([
        [0, '#0b1d51'],
        [uniform('mid', 0.5), [0.4, 0.65, 1, 0.8]],
        [1, uniform('top', [1, 1, 1, 1])],
      ]),
    ),
  'mix by mask': () => color('#335').pipe(mix(color(uniform('tint', [1, 0.5, 0, 1])), cell()), fbm({ octaves: 3 })),
  rgba: () => rgba(perlin(), simplex().pipe(abs()), cell(), 0.5).pipe(ridged({ octaves: 3 }), clamp(0, 1)),
  'opaque warp': () => perlin().pipe(opaque(), warp(rgba(simplex(), 0, 0), 0.5), mul([1, 0.5, 0.25, 1])),
  normals: () => perlin().pipe(fbm({ octaves: 3 }), seamless(2), normals({ strength: uniform('strength', 0.5) })),
  'seamless color': () => rgba(perlin(), cell(), simplex()).pipe(seamless(1.5)),
}

describe('ProceduralTexture', () => {
  describe('WebGPU', () => {
    runParity(() => new WebGpuDevice({ surfaceFormat: 'rgba8unorm' }))
  })
  describe('WebGL', () => {
    runParity(() => new WebglDevice({}))
  })
})

function runParity(createDevice: () => Device) {
  let device: Device

  beforeAll(async () => {
    device = await createDevice().ready
  })

  afterAll(() => {
    device?.dispose()
  })

  async function bake(texture: ProceduralTexture): Promise<Float32Array> {
    // graphs that sample their sources many times, e.g. normals of a seamless fbm, take over a second to compile in GL
    for (let i = 0; i < 500 && !texture.isReady; i++) {
      await new Promise((resolve) => setTimeout(resolve, 10))
    }
    expect(texture.update()).toBe(true)
    device.renderPass.flush()
    return (await texture.texture.readPixels()) as Float32Array
  }

  function expectParity(field: Field<any>, pixels: Float32Array, z = 0) {
    const [x0, y0, x1, y1] = REGION
    // WebGL reads back RGBA for single channel targets
    const stride = pixels.length / (SIZE * SIZE)
    let maxError = 0
    for (let j = 0; j < SIZE; j++) {
      for (let i = 0; i < SIZE; i++) {
        const x = x0 + ((i + 0.5) / SIZE) * (x1 - x0)
        const y = y0 + ((j + 0.5) / SIZE) * (y1 - y0)
        const error = Math.abs(pixels[(j * SIZE + i) * stride] - field.sample(x, y, z))
        maxError = Math.max(maxError, error)
      }
    }
    expect(maxError).toBeLessThan(1e-4)
  }

  for (const [name, create] of Object.entries(GRAPHS)) {
    it(`matches the CPU: ${name}`, async () => {
      const field = create()
      const texture = new ProceduralTexture(device, field, { width: SIZE, height: SIZE, region: REGION, z: 0.3 })
      expectParity(field, await bake(texture), 0.3)
      texture.dispose()
    })
  }

  for (const [name, create] of Object.entries(COLOR_GRAPHS)) {
    it(`matches the CPU in all channels: ${name}`, async () => {
      const field = create()
      expect(field.channels).toBe(4)
      const texture = new ProceduralTexture(device, field, {
        width: SIZE,
        height: SIZE,
        region: REGION,
        z: 0.3,
        format: 'rgba32float',
      })
      const pixels = await bake(texture)
      const [x0, y0, x1, y1] = REGION
      const color: [number, number, number, number] = [0, 0, 0, 0]
      let maxError = 0
      for (let j = 0; j < SIZE; j++) {
        for (let i = 0; i < SIZE; i++) {
          field.sampleColor(x0 + ((i + 0.5) / SIZE) * (x1 - x0), y0 + ((j + 0.5) / SIZE) * (y1 - y0), 0.3, color)
          for (let c = 0; c < 4; c++) {
            maxError = Math.max(maxError, Math.abs(pixels[(j * SIZE + i) * 4 + c] - color[c]))
          }
        }
      }
      expect(maxError).toBeLessThan(1e-4)
      texture.dispose()
    })
  }

  it('updates uniforms without recompiling', async () => {
    const field = GRAPHS.ridged()
    const texture = new ProceduralTexture(device, field, { width: SIZE, height: SIZE, region: REGION })
    expectParity(field, await bake(texture))
    const shader = texture['shader']
    field.params.gain = 0.8
    expectParity(field, await bake(texture))
    expect(texture['shader']).toBe(shader)
    texture.dispose()
  })
}
