import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { Device } from '../Device'
import { WebglDevice } from '../webgl/WebglDevice'
import { WebGpuDevice } from '../webgpu/WebGpuDevice'
import type { Program } from './Program'
import { TextureUsage, TextureView, type Texture } from './Texture'

const WGSL = /* wgsl */ `
@group(0) @binding(0) var source: texture_2d<f32>;

@vertex
fn vs(@builtin(vertex_index) i: u32) -> @builtin(position) vec4f {
  return vec4f(select(-1.0, 3.0, i == 2u), select(-1.0, 3.0, i == 1u), 0.0, 1.0);
}

@fragment
fn fs() -> @location(0) vec4f {
  return textureLoad(source, vec2i(0), 0);
}
`

const GLSL_VS = /* glsl */ `#version 300 es
void main() {
  gl_Position = vec4(gl_VertexID == 2 ? 3.0 : -1.0, gl_VertexID == 1 ? 3.0 : -1.0, 0.0, 1.0);
}
`

const GLSL_FS = /* glsl */ `#version 300 es
precision highp float;
uniform highp sampler2D source;
out vec4 color;
void main() {
  color = texelFetch(source, ivec2(0), 0);
}
`

// distinct value per mip level, exactly representable in rgba8unorm
const LEVEL_COLORS = [
  [1, 0, 0, 1],
  [0, 1, 0, 1],
  [0, 0, 1, 1],
]

describe('TextureView', () => {
  describe('WebGPU', () => {
    runContract(() => new WebGpuDevice({}), (device) => device.createShaderModule({ wgsl: { source: WGSL } }).program)
  })
  describe('WebGL', () => {
    runContract(
      () => new WebglDevice({}),
      (device) => device.createShaderModule({ glsl: { vertex: GLSL_VS, fragment: GLSL_FS } }).program,
    )
  })
})

function runContract(createDevice: () => Device, createProgram: (device: Device) => Program) {
  let device: Device
  let texture: Texture
  let output: Texture
  let program: Program

  beforeEach(async () => {
    device = await createDevice().ready
    texture = device.createTexture({
      width: 4,
      height: 4,
      mipLevelCount: 3,
      format: 'rgba8unorm',
      usage: TextureUsage.TextureBinding | TextureUsage.RenderTarget,
    })
    output = device.createTexture({
      width: 1,
      height: 1,
      mipLevelCount: 1,
      format: 'rgba8unorm',
      usage: TextureUsage.TextureBinding | TextureUsage.RenderTarget,
    })
    program = createProgram(device)
    await program.module.compiled
    expect(program.module.isValid).toBe(true)

    // fill each mip level with its own color
    const pass = device.renderPass
    for (let level = 0; level < LEVEL_COLORS.length; level++) {
      pass.setRenderTarget(0, texture, level)
      pass.setClearColor(0, LEVEL_COLORS[level])
      pass.clear()
    }
    pass.flush()
  })

  afterEach(() => {
    texture.dispose()
    output.dispose()
    device.dispose()
  })

  function draw(source: Texture | TextureView, target: Texture, targetLevel = 0) {
    const pass = device.renderPass
    program.set('source', source)
    program.commit()
    pass.setRenderTarget(0, target, targetLevel)
    pass.setViewportState(0, 0, Math.max(1, target.width >> targetLevel), Math.max(1, target.height >> targetLevel))
    pass.setProgram(program)
    pass.draw(3)
    pass.flush()
  }

  async function readOutput() {
    return Array.from(await output.readPixels(0, 0, 1, 1)).map((it) => Math.round(Number(it) / 255))
  }

  it('caches views by range', () => {
    expect(texture.subresource({ baseMipLevel: 1, mipLevelCount: 1 })).toBe(
      texture.subresource({ baseMipLevel: 1, mipLevelCount: 1 }),
    )
    expect(texture.subresource({ baseMipLevel: 1 }).mipLevelCount).toBe(2)
    expect(texture.subresource({}).isFullRange).toBe(true)
    expect(() => texture.subresource({ baseMipLevel: 2, mipLevelCount: 2 })).toThrow()
  })

  it('samples the base level of the view', async () => {
    for (let level = 0; level < LEVEL_COLORS.length; level++) {
      draw(texture.subresource({ baseMipLevel: level, mipLevelCount: 1 }), output)
      expect(await readOutput()).toEqual(LEVEL_COLORS[level])
    }
  })

  it('restores the full range when bound as texture', async () => {
    draw(texture.subresource({ baseMipLevel: 2, mipLevelCount: 1 }), output)
    draw(texture, output)
    expect(await readOutput()).toEqual(LEVEL_COLORS[0])
  })

  it('samples one mip level while rendering into another mip level of the same texture', async () => {
    // copy level 1 into level 2
    draw(texture.subresource({ baseMipLevel: 1, mipLevelCount: 1 }), texture, 2)
    draw(texture.subresource({ baseMipLevel: 2, mipLevelCount: 1 }), output)
    expect(await readOutput()).toEqual(LEVEL_COLORS[1])
  })
}
