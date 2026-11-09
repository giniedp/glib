import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { SurfaceFormat } from '../enums'
import { WebGpuDevice } from './WebGpuDevice'
import type { WebGpuRenderEncoder } from './WebGpuRenderEncoder'
import type { WebGpuTexture } from './resources'

// a fullscreen triangle without vertex buffers or bindings, fragment entries with different output locations
const SOURCE = /* wgsl */ `
  @vertex
  fn vs_main(@builtin(vertex_index) index: u32) -> @builtin(position) vec4<f32> {
    let uv = vec2<f32>(f32((index << 1u) & 2u), f32(index & 2u));
    return vec4<f32>(uv * 2.0 - 1.0, 0.0, 1.0);
  }

  @fragment
  fn fs_one() -> @location(0) vec4<f32> {
    return vec4<f32>(1.0);
  }

  struct TwoOutput {
    @location(0) a: vec4<f32>,
    @location(1) b: vec4<f32>,
  }

  @fragment
  fn fs_two() -> TwoOutput {
    return TwoOutput(vec4<f32>(1.0), vec4<f32>(0.5));
  }

  struct ThreeOutput {
    @location(0) a: vec4<f32>,
    @location(1) b: vec4<f32>,
    @location(2) c: vec4<f32>,
  }

  @fragment
  fn fs_three() -> ThreeOutput {
    return ThreeOutput(vec4<f32>(1.0), vec4<f32>(0.5), vec4<f32>(0.25));
  }

  struct SparseOutput {
    @location(0) a: vec4<f32>,
    @location(2) c: vec4<f32>,
  }

  @fragment
  fn fs_sparse() -> SparseOutput {
    return SparseOutput(vec4<f32>(1.0), vec4<f32>(0.25));
  }
`

describe('WebGpuRenderEncoder color targets', () => {
  let device: WebGpuDevice

  beforeEach(async () => {
    device = await new WebGpuDevice({}).ready
  })

  afterEach(() => {
    device.dispose()
  })

  function target(format: SurfaceFormat = 'rgba8unorm'): WebGpuTexture {
    return device.createRenderTarget({ width: 4, height: 4, format })
  }

  function program(fragmentEntry: string) {
    return device.createShaderModule({ wgsl: { source: SOURCE, fragmentEntry } }).program
  }

  /**
   * Renders with the encoder and resolves with the message of the first validation error, null without errors
   */
  async function validate(renderFn: (pass: WebGpuRenderEncoder) => void) {
    device.gpu.pushErrorScope('validation')
    device.render(renderFn)
    const error = await device.gpu.popErrorScope()
    return error?.message ?? null
  }

  it('matches the attachments when the shader writes fewer locations', async () => {
    const fs = program('fs_one')
    const error = await validate((pass) => {
      pass.setRenderTarget(0, target())
      pass.setRenderTarget(1, target())
      pass.setProgram(fs)
      pass.draw(3)
    })
    expect(error).toBeNull()
  })

  it('matches the attachments when the shader writes more locations', async () => {
    const fs = program('fs_three')
    const error = await validate((pass) => {
      pass.setRenderTarget(0, target())
      pass.setRenderTarget(1, target())
      pass.setProgram(fs)
      pass.draw(3)
    })
    expect(error).toBeNull()
  })

  it('matches the attachments when the shader skips a location', async () => {
    const fs = program('fs_sparse')
    const error = await validate((pass) => {
      pass.setRenderTarget(0, target())
      pass.setRenderTarget(1, target())
      pass.setRenderTarget(2, target())
      pass.setProgram(fs)
      pass.draw(3)
    })
    expect(error).toBeNull()
  })

  it('keeps unbound attachments in between as gaps', async () => {
    const fs = program('fs_three')
    const error = await validate((pass) => {
      pass.setRenderTarget(0, target())
      pass.setRenderTarget(2, target())
      pass.setProgram(fs)
      pass.draw(3)
    })
    expect(error).toBeNull()
  })

  it('draws shaders with different outputs into the same pass', async () => {
    const fs1 = program('fs_one')
    const fs3 = program('fs_three')
    const error = await validate((pass) => {
      pass.setRenderTarget(0, target())
      pass.setRenderTarget(1, target())
      pass.setProgram(fs3)
      pass.draw(3)
      pass.setProgram(fs1)
      pass.draw(3)
      pass.setProgram(fs3)
      pass.draw(3)
    })
    expect(error).toBeNull()
  })

  it('rebuilds the pipeline when an attachment is added', async () => {
    const fs = program('fs_two')
    const error = await validate((pass) => {
      pass.setRenderTarget(0, target())
      pass.setProgram(fs)
      pass.draw(3)
      pass.setRenderTarget(1, target())
      pass.draw(3)
    })
    expect(error).toBeNull()
  })

  it('rebuilds the pipeline when an attachment is removed', async () => {
    const fs = program('fs_two')
    const error = await validate((pass) => {
      pass.setRenderTarget(0, target())
      pass.setRenderTarget(1, target())
      pass.setProgram(fs)
      pass.draw(3)
      pass.setRenderTarget(1, null)
      pass.draw(3)
    })
    expect(error).toBeNull()
  })

  it('rebuilds the pipeline when the format of an attachment changes', async () => {
    const fs = program('fs_one')
    const error = await validate((pass) => {
      pass.setRenderTarget(0, target('rgba8unorm'))
      pass.setProgram(fs)
      pass.draw(3)
      pass.setRenderTarget(0, target('rgba16float'))
      pass.draw(3)
    })
    expect(error).toBeNull()
  })
})
