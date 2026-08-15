import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { Color } from './Color'
import type { Device } from './Device'
import type { RenderEncoder } from './RenderEncoder'
import type { DeviceOutput, ShaderModule, ShaderModuleOptions, Texture } from './resources'
import { DepthState } from './states'
import { WebglDevice } from './webgl/WebglDevice'
import { WebGpuDevice } from './webgpu'

describe('RenderEncoder', () => {
  describe('WebGPU', () => {
    runContract(() => {
      return new WebGpuDevice({
        surfaceFormat: 'RGBA8_UNORM',
      })
    })
  })

  describe('WebGL', () => {
    runContract(() => {
      return new WebglDevice({})
    })
  })
})

const SHADER: ShaderModuleOptions = {
  wgsl: {
    source: /* wgsl */ `

    @group(0) @binding(0)
    var<uniform> uDepth: f32;

    struct VSOutput {
      @builtin(position) position: vec4<f32>,
    };

    @vertex
    fn vs(@builtin(vertex_index) vertexIndex: u32) -> VSOutput {
      var pos: vec2<f32>;

      if (vertexIndex == 0u) {
        pos = vec2<f32>(-1.0, -1.0);
      } else if (vertexIndex == 1u) {
        pos = vec2<f32>(3.0, -1.0);
      } else {
        pos = vec2<f32>(-1.0, 3.0);
      }

      // WebGPU NDC Z range is [0, 1], so no remap needed
      let ndcZ = uDepth;

      var out: VSOutput;
      out.position = vec4<f32>(pos, ndcZ, 1.0);
      return out;
    }

    @group(0) @binding(1)
    var<uniform> uColor: vec4<f32>;

    struct FSOutput {
      @location(0) color: vec4<f32>,
    };

    @fragment
    fn fs() -> FSOutput {
      var out: FSOutput;
      out.color = uColor;
      return out;
    }
  `,
  },
  glsl: {
    vertex: /*glsl */ `
      #version 300 es
      precision highp float;

      uniform float uDepth;

      void main() {
        // Fullscreen triangle using gl_VertexID
        vec2 pos;
        if (gl_VertexID == 0) {
          pos = vec2(-1.0, -1.0);
        } else if (gl_VertexID == 1) {
          pos = vec2(3.0, -1.0);
        } else {
          pos = vec2(-1.0, 3.0);
        }

        // WebGL NDC depth range is [-1, 1]
        float ndcZ = uDepth * 2.0 - 1.0;

        gl_Position = vec4(pos, ndcZ, 1.0);
      }
    `,
    fragment: /*glsl */ `
      #version 300 es
      precision highp float;

      uniform vec4 uColor;

      out vec4 outColor;
      void main() {
        outColor = uColor;
      }
    `,
  },
}

export function runContract(createDevice: () => Device) {
  let device: Device
  let shader: ShaderModule
  let pass: RenderEncoder
  let isWebgpu: boolean
  beforeEach(async () => {
    device = await createDevice().ready
    isWebgpu = device instanceof WebGpuDevice
  })

  afterEach(() => {
    device.dispose()
    device = null
  })

  beforeEach(async () => {
    shader = device.createShaderModule(SHADER)
    await shader.compiled
    pass = device.renderPass
  })

  async function expectPixelColor(rt: Texture | DeviceOutput, color: Color, x = 0, y = 0) {
    const pixel = await rt.readPixels(x, y, 1, 1)
    expect(Array.from(pixel)).toEqual(Color.toBytes(color))
  }

  describe('clear', () => {
    it('clears backbuffer when no render target is set', async () => {
      await expectPixelColor(device.output, Color.TransparentBlack)

      pass.setClearColor(0, Color.Red)
      pass.clear()
      pass.submit()

      await expectPixelColor(device.output, Color.Red)

      pass.setRenderTarget(0, device.output)
      pass.setClearColor(0, Color.Green)
      pass.clear()
      pass.submit()

      await expectPixelColor(device.output, Color.Green)
    })

    it('clears render targets', async () => {
      const rt1 = device.createRenderTarget({ width: 4, height: 4, format: 'RGBA8_UNORM', name: 'rt1' })

      pass.setRenderTarget(0, rt1)
      pass.setClearColor(0, Color.Red)
      pass.clear()
      pass.submit()

      await expectPixelColor(rt1, Color.Red)

      pass.setClearColor(0, Color.Green)
      pass.clear()
      pass.submit()

      await expectPixelColor(rt1, Color.Green)
    })

    it('clears multiple render targets', async () => {
      const rt1 = device.createRenderTarget({ width: 4, height: 4, format: 'RGBA8_UNORM', name: 'rt1' })
      const rt2 = device.createRenderTarget({ width: 4, height: 4, format: 'RGBA8_UNORM', name: 'rt2' })

      // clear backbuffer
      pass.setClearColor(0, Color.White)
      pass.clear()
      pass.submit()
      await expectPixelColor(device.output, Color.White)

      // clear multiple render targets
      pass.setRenderTarget(0, rt1)
      pass.setClearColor(0, Color.Red)
      pass.setRenderTarget(2, rt2)
      pass.setClearColor(2, Color.Green)
      pass.clear()
      pass.submit()

      await expectPixelColor(rt1, Color.Red)
      await expectPixelColor(rt2, Color.Green)

      // clear multiple render targets with different colors
      pass.setClearColor(0, Color.Green)
      pass.setClearColor(2, Color.Blue)
      pass.clear()
      pass.submit()

      await expectPixelColor(rt1, Color.Green)
      await expectPixelColor(rt2, Color.Blue)
    })
  })

  describe('resolve', () => {
    it('resolves a render target to backbuffer', async () => {
      device.output.resize(4, 4)
      const rt1 = device.createRenderTarget({
        name: 'rt1',
        format: 'RGBA8_UNORM',
        width: 4,
        height: 4,
        sampleCount: 4, // webgpu requires sampleCount > 1 for resolve to work
      })

      pass.setRenderTarget(0, rt1, 0, 0, null)
      pass.setClearColor(0, Color.Red)
      pass.clear()
      pass.submit()

      // - can not read subimage from multisampled texture
      //await expectPixelColor(rt1, Color.Red)
      await expectPixelColor(device.output, Color.TransparentBlack)

      pass.setRenderTarget(0, rt1, 0, 0, device.output)
      pass.resolve()
      pass.submit()

      // await expectPixelColor(rt1, Color.Red)
      await expectPixelColor(device.output, Color.Red)
    })

    it.skipIf(() => isWebgpu)('resolves backbuffer to a render target', async () => {
      // in webgl resolve is implemented as a blit operation which supports
      // - different sample count between source and destination
      // - different size between source and destination
      // webgpu requires sample count of source to be greater than 1
      // TODO: either restrict webgl to same behavior as webgpu or implement blit operation in webgpu
      device.output.resize(4, 4)
      const rt1 = device.createRenderTarget({
        width: device.output.width,
        height: device.output.height,
        format: device.output.format,
        name: 'rt1',
        sampleCount: 4,
      })

      pass.setRenderTarget(0, null, 0, 0, rt1)
      pass.setClearColor(0, Color.Red)
      pass.clear()
      pass.submit()

      await expectPixelColor(rt1, Color.TransparentBlack)
      await expectPixelColor(device.output, Color.Red)

      pass.resolve()
      pass.submit()

      await expectPixelColor(rt1, Color.Red)
      await expectPixelColor(device.output, Color.Red)
    })

    it('resolves a render target to another', async () => {
      const rt1 = device.createRenderTarget({ width: 4, height: 4, format: 'RGBA8_UNORM', name: 'rt1', sampleCount: 4 })
      const rt2 = device.createRenderTarget({ width: 4, height: 4, format: 'RGBA8_UNORM', name: 'rt2' })

      pass.setRenderTarget(0, rt1, 0, 0, null)
      pass.setClearColor(0, Color.Red)
      pass.clear()
      pass.submit()

      // await expectPixelColor(rt1, Color.Red)
      await expectPixelColor(rt2, Color.TransparentBlack)

      pass.setRenderTarget(0, rt1, 0, 0, rt2)
      pass.resolve()
      pass.submit()

      // await expectPixelColor(rt1, Color.Red)
      await expectPixelColor(rt2, Color.Red)
    })

    it('resolves an msaa render target to backbuffer', async () => {
      device.output.resize(4, 4)
      const msaaRT = device.createRenderTarget({
        width: 4,
        height: 4,
        format: 'RGBA8_UNORM',
        name: 'msaa',
        sampleCount: 4,
      })

      pass.setRenderTarget(0, msaaRT, 0, 0, device.output)
      pass.setClearColor(0, Color.Red)
      pass.clear()
      pass.submit()

      pass.resolve()
      pass.submit()

      await expectPixelColor(device.output, Color.Red)
    })
  })

  it('handles depth state change', async () => {
    device.output.resize(4, 4)
    const rt1 = device.createRenderTarget({ width: 4, height: 4, format: 'RGBA8_UNORM', name: 'rt1' })
    const depth = device.createDepthTarget({ width: 4, height: 4, format: 'DEPTH24_PLUS_STENCIL8', name: 'depth' })

    pass.setRenderTarget(0, rt1)
    pass.setDepthTarget(depth)

    pass.setClearColor(0, Color.Black)
    pass.setClearDepth(1)
    pass.clear()
    pass.submit()

    await expectPixelColor(rt1, Color.Black)

    pass.setDepthState(DepthState.Less)
    pass.setProgram(shader.program)

    // FAR (red)
    shader.program.set('uColor', Color.Red)
    expect(shader.program.set('uColor', Color.Red)).toBe(true)
    expect(shader.program.set('uDepth', 0.8)).toBe(true)
    shader.program.commit()
    pass.draw(3)
    pass.submit()

    await expectPixelColor(rt1, Color.Red)

    // NEAR (green)
    expect(shader.program.set('uColor', Color.Green)).toBe(true)
    expect(shader.program.set('uDepth', 0.2)).toBe(true)
    shader.program.commit()
    pass.draw(3)
    pass.submit()

    await expectPixelColor(rt1, Color.Green)

    // Disable depth write
    pass.setDepthState(DepthState.LessNoWrite)

    // FAR again (blue)
    expect(shader.program.set('uColor', Color.Blue)).toBe(true)
    expect(shader.program.set('uDepth', 0.8)).toBe(true)
    shader.program.commit()

    pass.draw(3)
    pass.submit()

    await expectPixelColor(rt1, Color.Green)
  })

  describe('Scissor State', () => {
    let rt: Texture
    beforeEach(async () => {
      device.output.resize(4, 4)
      rt = device.createRenderTarget({
        width: 4,
        height: 4,
        format: 'RGBA8_UNORM',
        name: 'rt',
      })
      const depth = device.createDepthTarget({
        width: 4,
        height: 4,
        format: 'DEPTH24_PLUS_STENCIL8',
        name: 'depth',
      })

      pass.setProgram(shader.program)
      pass.setRenderTarget(0, rt)
      pass.setDepthTarget(depth)

      pass.setClearColor(0, Color.Black)
      pass.clear()
      pass.submit()

      await expectPixelColor(rt, Color.Black)
    })

    it('is ignored for clear operations', async () => {
      pass.setScissorState(0, 0, 1, 1)
      pass.setClearColor(0, Color.Red)
      pass.clear()
      pass.submit()

      await expectPixelColor(rt, Color.Red, 0, 0)
      await expectPixelColor(rt, Color.Red, 1, 0)

      pass.setScissorState(1, 0, 1, 1)
      pass.setClearColor(0, Color.Green)
      pass.clear()
      pass.submit()

      await expectPixelColor(rt, Color.Green, 0, 0)
      await expectPixelColor(rt, Color.Green, 1, 0)
    })

    it('is applied for draw operations', async () => {
      pass.setScissorState(0, 0, 1, 1)
      shader.program.applyInputs({
        uColor: Color.Red,
        uDepth: 0.5,
      })
      shader.program.commit()
      pass.draw(3)
      pass.submit()

      pass.setScissorState(1, 0, 1, 1)
      shader.program.applyInputs({
        uColor: Color.Green,
        uDepth: 0.5,
      })
      shader.program.commit()
      pass.draw(3)
      pass.submit()

      pass.setScissorState(0, 1, 1, 1)
      shader.program.applyInputs({
        uColor: Color.Blue,
        uDepth: 0.5,
      })
      shader.program.commit()
      pass.draw(3)
      pass.submit()

      pass.setScissorState(1, 1, 1, 1)
      shader.program.applyInputs({
        uColor: Color.White,
        uDepth: 0.5,
      })
      shader.program.commit()
      pass.draw(3)
      pass.submit()

      await expectPixelColor(rt, Color.Red, 0, 0)
      await expectPixelColor(rt, Color.Green, 1, 0)
      await expectPixelColor(rt, Color.Blue, 0, 1)
      await expectPixelColor(rt, Color.White, 1, 1)
    })
  })

  describe('Viewport State', () => {
    let rt: Texture
    beforeEach(async () => {
      device.output.resize(4, 4)
      rt = device.createRenderTarget({
        width: 4,
        height: 4,
        format: 'RGBA8_UNORM',
        name: 'rt',
      })
      const depth = device.createDepthTarget({
        width: 4,
        height: 4,
        format: 'DEPTH24_PLUS_STENCIL8',
        name: 'depth',
      })

      pass.setProgram(shader.program)
      pass.setRenderTarget(0, rt)
      pass.setDepthTarget(depth)

      pass.setClearColor(0, Color.Black)
      pass.clear()
      pass.submit()

      await expectPixelColor(rt, Color.Black)
    })

    it('is ignored for clear operations', async () => {
      pass.setViewportState(0, 0, 1, 1)
      pass.setClearColor(0, Color.Red)
      pass.clear()
      pass.submit()

      await expectPixelColor(rt, Color.Red, 0, 0)
      await expectPixelColor(rt, Color.Red, 1, 0)

      pass.setViewportState(1, 0, 1, 1)
      pass.setClearColor(0, Color.Green)
      pass.clear()
      pass.submit()

      await expectPixelColor(rt, Color.Green, 0, 0)
      await expectPixelColor(rt, Color.Green, 1, 0)
    })

    it('is applied for draw operations', async () => {
      pass.setViewportState(0, 0, 1, 1)
      shader.program.applyInputs({
        uColor: Color.Red,
        uDepth: 0.5,
      })
      shader.program.commit()
      pass.draw(3)
      pass.submit()

      pass.setViewportState(1, 0, 1, 1)
      shader.program.applyInputs({
        uColor: Color.Green,
        uDepth: 0.5,
      })
      shader.program.commit()
      pass.draw(3)
      pass.submit()

      pass.setViewportState(0, 1, 1, 1)
      shader.program.applyInputs({
        uColor: Color.Blue,
        uDepth: 0.5,
      })
      shader.program.commit()
      pass.draw(3)
      pass.submit()

      pass.setViewportState(1, 1, 1, 1)
      shader.program.applyInputs({
        uColor: Color.White,
        uDepth: 0.5,
      })
      shader.program.commit()
      pass.draw(3)
      pass.submit()

      await expectPixelColor(rt, Color.Red, 0, 0)
      await expectPixelColor(rt, Color.Green, 1, 0)
      await expectPixelColor(rt, Color.Blue, 0, 1)
      await expectPixelColor(rt, Color.White, 1, 1)
    })
  })
}
