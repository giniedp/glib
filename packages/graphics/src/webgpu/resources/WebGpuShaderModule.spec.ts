import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { WebGpuDevice } from '../WebGpuDevice'
import { WebGpuShaderModule } from './WebGpuShaderModule'

// one source with a forward entry (2 outputs), a gbuffer entry (3 outputs), a depth only entry (no outputs), an entry
// with gaps between its locations and a builtin output, and an entry that returns a single location
const SOURCE = /* wgsl */ `
  struct MaterialBlock {
    baseColor: vec4<f32>,
  }
  @group(0) @binding(0) var<uniform> material: MaterialBlock;

  @vertex
  fn vs_main(@location(0) a_position: vec3<f32>) -> @builtin(position) vec4<f32> {
    return vec4<f32>(a_position, 1.0);
  }

  struct ForwardOutput {
    @location(0) color: vec4<f32>,
    @location(1) depth: f32,
  }

  @fragment
  fn fs_main() -> ForwardOutput {
    return ForwardOutput(material.baseColor, 0.0);
  }

  struct GBufferOutput {
    @location(0) a: vec4<f32>,
    @location(1) b: vec4<f32>,
    @location(2) c: vec4<f32>,
  }

  @fragment
  fn fs_gbuffer() -> GBufferOutput {
    return GBufferOutput(material.baseColor, vec4f(0.0), vec4f(1.0));
  }

  @fragment
  fn fs_depth() {
    if (material.baseColor.a < 0.5) {
      discard;
    }
  }

  struct SparseOutput {
    @location(0) color: vec4<f32>,
    @builtin(frag_depth) depth: f32,
    @location(3) linearDepth: f32,
  }

  @fragment
  fn fs_sparse() -> SparseOutput {
    return SparseOutput(material.baseColor, 0.5, 1.0);
  }

  @fragment
  fn fs_single() -> @location(0) vec4<f32> {
    return material.baseColor;
  }
`

describe('WebGpuShaderModule entry points', () => {
  let device: WebGpuDevice
  beforeEach(async () => {
    device = await new WebGpuDevice({}).ready
  })

  afterEach(() => {
    device.dispose()
  })

  it('uses the first entry point of each stage by default', async () => {
    const shader = device.createShaderModule({ wgsl: { source: SOURCE } })
    await shader.compiled
    expect(shader.vertexFn).toBe('vs_main')
    expect(shader.fragmentFn).toBe('fs_main')
    expect(shader.getMaxOutputLocation()).toBe(1)
  })

  it('selects a fragment entry point by name', async () => {
    const shader = device.createShaderModule({ wgsl: { source: SOURCE, fragmentEntry: 'fs_gbuffer' } })
    await shader.compiled
    expect(shader.isValid).toBe(true)
    expect(shader.vertexFn).toBe('vs_main')
    expect(shader.fragmentFn).toBe('fs_gbuffer')
    expect(shader.getMaxOutputLocation()).toBe(2)
  })

  it('selects an entry point without outputs', async () => {
    const shader = device.createShaderModule({ wgsl: { source: SOURCE, fragmentEntry: 'fs_depth' } })
    await shader.compiled
    expect(shader.fragmentFn).toBe('fs_depth')
    expect(shader.getMaxOutputLocation()).toBe(-1)
  })

  describe('getOutputLocationMask', () => {
    it.each([
      ['fs_main', 0b11],
      ['fs_gbuffer', 0b111],
      ['fs_depth', 0],
      ['fs_sparse', 0b1001],
      ['fs_single', 0b1],
    ])('%s writes the locations %i', async (fragmentEntry, mask) => {
      const shader = device.createShaderModule({ wgsl: { source: SOURCE, fragmentEntry } })
      await shader.compiled
      expect(shader.isValid).toBe(true)
      expect(shader.getOutputLocationMask()).toBe(mask)
    })

    it('is zero without a fragment entry point', async () => {
      const shader = device.createShaderModule({
        wgsl: { source: /* wgsl */ `@compute @workgroup_size(1) fn cs_main() {}` },
      })
      await shader.compiled
      expect(shader.fragmentFn).toBeUndefined()
      expect(shader.getOutputLocationMask()).toBe(0)
    })
  })

  it('shares bindings between entry points', async () => {
    const forward = device.createShaderModule({ wgsl: { source: SOURCE } })
    const gbuffer = device.createShaderModule({ wgsl: { source: SOURCE, fragmentEntry: 'fs_gbuffer' } })
    expect(forward.program.get('material.baseColor')).not.toBeNull()
    expect(gbuffer.program.get('material.baseColor')).not.toBeNull()
  })

  it('throws for an unknown entry point', () => {
    expect(() => device.createShaderModule({ wgsl: { source: SOURCE, fragmentEntry: 'fs_missing' } })).toThrow(
      /fs_missing/,
    )
  })

  it('acquires one module per entry point', () => {
    const a = device.acquireShaderModule({ wgsl: { source: SOURCE } }) as WebGpuShaderModule
    const b = device.acquireShaderModule({ wgsl: { source: SOURCE, fragmentEntry: 'fs_gbuffer' } }) as WebGpuShaderModule
    const c = device.acquireShaderModule({ wgsl: { source: SOURCE, fragmentEntry: 'fs_gbuffer' } }) as WebGpuShaderModule
    expect(a).not.toBe(b)
    expect(b).toBe(c)
  })
})
