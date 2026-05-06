import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { WebGpuDevice } from '../WebGpuDevice'
import type { WebGpuShaderModule } from './WebGpuShaderModule'

const VERTEX_SHADER = /* wgsl */ `
  @vertex
  fn vs(@builtin(vertex_index) vertexIndex : u32) -> @builtin(position) vec4f {
    var pos = array<vec2f, 3>(
      vec2f(-1.0, -1.0),
      vec2f(-1.0,  3.0),
      vec2f( 3.0, -1.0),
    );
    return vec4f(pos[vertexIndex], 0.0, 1.0);
  }
`

async function renderPixel(
  device: WebGpuDevice,
  program: WebGpuShaderModule,
  width: number,
  height: number,
): Promise<number[]> {
  const target = device.createRenderTarget({
    width,
    height,
    format: 'RGBA32_FLOAT',
  })
  const pass = device.renderPass
  pass.setRenderTarget(0, target)
  pass.setViewportState(0, 0, 1, 4)
  pass.setProgram(program.program)
  pass.draw(3)
  pass.submit()
  await device.gpu.queue.onSubmittedWorkDone()
  const data = await target.readPixels()
  return Array.from(data)
}

describe('WebGpuProgramParameter', () => {
  let device: WebGpuDevice
  beforeEach(async () => {
    device = await new WebGpuDevice({}).ready
    device.resize()
  })

  afterEach(() => {
    device.dispose()
  })

  describe('scalar', () => {
    const code = /* wgsl */ `
      ${VERTEX_SHADER}

      @group(0)
      @binding(0)
      var<uniform> value: f32;

      @fragment
      fn fs() -> @location(0) vec4f {
        return vec4f(value, 0.0, 0.0, 1.0);
      }
    `
    it('setScalar', async () => {
      const program = device.createWgslModule({ code: code })
      program.program.setScalar('value', 0.25)
      program.program.commit()
      const pixel = await renderPixel(device, program, 1, 1)
      // prettier-ignore
      expect(pixel).toEqual([
        0.25, 0, 0, 1,
      ])
    })

    it('setArray', async () => {
      const program = device.createWgslModule({ code: code })
      program.program.setArray('value', [0.25])
      program.program.commit()
      const pixel = await renderPixel(device, program, 1, 1)
      // prettier-ignore
      expect(pixel).toEqual([
        0.25, 0, 0, 1,
      ])
    })
  })

  describe('vec2', () => {
    const code = /* wgsl */ `
      ${VERTEX_SHADER}

      @group(0)
      @binding(0)
      var<uniform> value: vec2f;

      @fragment
      fn fs() -> @location(0) vec4f {
        return vec4f(value.x, value.y, 0.0, 1.0);
      }
    `

    it('set', async () => {
      const shader = device.createWgslModule({ code: code })
      shader.program.mustSet('value', { x: 0.25, y: 0.5 })
      shader.program.commit()
      const pixel = await renderPixel(device, shader, 1, 1)
      // prettier-ignore
      expect(pixel).toEqual([
        0.25, 0.5, 0, 1,
      ])
    })

    it('setVec2', async () => {
      const shader = device.createWgslModule({ code: code })
      shader.program.setVec2('value', { x: 0.25, y: 0.5 })
      shader.program.commit()
      const pixel = await renderPixel(device, shader, 1, 1)
      // prettier-ignore
      expect(pixel).toEqual([
        0.25, 0.5, 0, 1,
      ])
    })

    it('setArray', async () => {
      const shader = device.createWgslModule({ code: code })
      shader.program.setVec2('value', [0.25, 0.5])
      shader.program.commit()
      const pixel = await renderPixel(device, shader, 1, 1)
      // prettier-ignore
      expect(pixel).toEqual([
        0.25, 0.5, 0, 1,
      ])
    })
  })

  describe('vec3', () => {
    const code = /* wgsl */ `
      ${VERTEX_SHADER}

      @group(0)
      @binding(0)
      var<uniform> value: vec3f;

      @fragment
      fn fs() -> @location(0) vec4f {
        return vec4f(value.x, value.y, value.z, 1.0);
      }
    `

    it('set', async () => {
      const shader = device.createWgslModule({ code: code })
      shader.program.mustSet('value', { x: 0.25, y: 0.5, z: 0.75 })
      shader.program.commit()
      const pixel = await renderPixel(device, shader, 1, 1)
      // prettier-ignore
      expect(pixel).toEqual([
        0.25, 0.5, 0.75, 1,
      ])
    })

    it('setVec2', async () => {
      const shader = device.createWgslModule({ code: code })
      shader.program.setVec2('value', { x: 0.25, y: 0.5 })
      shader.program.commit()
      const pixel = await renderPixel(device, shader, 1, 1)
      // prettier-ignore
      expect(pixel).toEqual([
        0.25, 0.5, 0, 1,
      ])
    })

    it('setVec3', async () => {
      const shader = device.createWgslModule({ code: code })
      shader.program.setVec3('value', { x: 0.25, y: 0.5, z: 0.75 })
      shader.program.commit()
      const pixel = await renderPixel(device, shader, 1, 1)
      // prettier-ignore
      expect(pixel).toEqual([
        0.25, 0.5, 0.75, 1,
      ])
    })

    it('setArray', async () => {
      const shader = device.createWgslModule({ code: code })
      shader.program.setArray('value', [0.25, 0.5, 0.75])
      shader.program.commit()
      const pixel = await renderPixel(device, shader, 1, 1)
      // prettier-ignore
      expect(pixel).toEqual([
        0.25, 0.5, 0.75, 1,
      ])
    })
  })

  describe('vec4', () => {
    const code = /* wgsl */ `
      ${VERTEX_SHADER}

      @group(0)
      @binding(0)
      var<uniform> value: vec4f;

      @fragment
      fn fs() -> @location(0) vec4f {
        return vec4f(value.x, value.y, value.z, value.w);
      }
    `

    it('set', async () => {
      const shader = device.createWgslModule({ code: code })
      shader.program.mustSet('value', { x: 0.25, y: 0.5, z: 0.75, w: 1.0 })
      shader.program.commit()
      const pixel = await renderPixel(device, shader, 1, 1)
      // prettier-ignore
      expect(pixel).toEqual([
        0.25, 0.5, 0.75, 1,
      ])
    })

    it('setVec2', async () => {
      const shader = device.createWgslModule({ code: code })
      shader.program.setVec2('value', { x: 0.25, y: 0.5 })
      shader.program.commit()
      const pixel = await renderPixel(device, shader, 1, 1)
      // prettier-ignore
      expect(pixel).toEqual([
        0.25, 0.5, 0, 0,
      ])
    })

    it('setVec3', async () => {
      const shader = device.createWgslModule({ code: code })
      shader.program.setVec3('value', { x: 0.25, y: 0.5, z: 0.75 })
      shader.program.commit()
      const pixel = await renderPixel(device, shader, 1, 1)
      // prettier-ignore
      expect(pixel).toEqual([
        0.25, 0.5, 0.75, 0,
      ])
    })

    it('setVec4', async () => {
      const shader = device.createWgslModule({ code: code })
      shader.program.setVec4('value', { x: 0.25, y: 0.5, z: 0.75, w: 1.0 })
      shader.program.commit()
      const pixel = await renderPixel(device, shader, 1, 1)
      // prettier-ignore
      expect(pixel).toEqual([
        0.25, 0.5, 0.75, 1,
      ])
    })

    it('setArray', async () => {
      const shader = device.createWgslModule({ code: code })
      shader.program.setArray('value', [0.25, 0.5, 0.75, 1.0])
      shader.program.commit()
      const pixel = await renderPixel(device, shader, 1, 1)
      // prettier-ignore
      expect(pixel).toEqual([
        0.25, 0.5, 0.75, 1,
      ])
    })
  })

  describe('mat2x2', () => {
    const code = /* wgsl */ `
      ${VERTEX_SHADER}

      @group(0)
      @binding(0)
      var<uniform> value: mat2x2f;

      @fragment
      fn fs(@builtin(position) pos: vec4f) -> @location(0) vec4f {
        let col: u32 = u32(pos.y);
        switch (col) {
          case 0u: {
            return vec4f(value[0].x, value[0].y, 0, 0);
          }
          case 1u: {
            return vec4f(value[1].x, value[1].y, 0, 0);
          }
          case 2u: {
            return vec4f(0, 0, 0, 0);
          }
          case 3u: {
            return vec4f(0, 0, 0, 0);
          }
          default: {
            return vec4f(0);
          }
        }
      }
    `

    it('setVec2', async () => {
      const shader = device.createWgslModule({ code: code })
      // prettier-ignore
      shader.program.setVec2('value', { x: 0.25, y: 0.5 })
      shader.program.commit()
      const pixel = await renderPixel(device, shader, 1, 4)
      // prettier-ignore
      expect(pixel).toEqual([
        0.25, 0.5, 0, 0,
        0,    0,   0, 0,
        0,    0,   0, 0,
        0,    0,   0, 0,
      ])
    })

    it('setVec3', async () => {
      const shader = device.createWgslModule({ code: code })
      // prettier-ignore
      shader.program.setVec3('value', { x: 0.25, y: 0.5, z: 0.75 })
      shader.program.commit()
      const pixel = await renderPixel(device, shader, 1, 4)
      // prettier-ignore
      expect(pixel).toEqual([
        0.25, 0.5, 0, 0,
        0.75, 0,   0, 0,
        0,    0,   0, 0,
        0,    0,   0, 0,
      ])
    })

    it('setVec4', async () => {
      const shader = device.createWgslModule({ code: code })
      // prettier-ignore
      shader.program.setVec4('value', { x: 0.25, y: 0.5, z: 0.75, w: 1.0 })
      shader.program.commit()
      const pixel = await renderPixel(device, shader, 1, 4)
      // prettier-ignore
      expect(pixel).toEqual([
        0.25, 0.5, 0, 0,
        0.75, 1.0, 0, 0,
        0,    0,   0, 0,
        0,    0,   0, 0,
      ])
    })

    it('setArray', async () => {
      const shader = device.createWgslModule({ code: code })
      // prettier-ignore
      shader.program.setArray('value', [
        0.25, 0.5,
        0.75, 1.0,
      ])
      shader.program.commit()
      const pixel = await renderPixel(device, shader, 1, 4)
      // prettier-ignore
      expect(pixel).toEqual([
        0.25, 0.5, 0, 0,
        0.75, 1.0, 0, 0,
        0,    0,   0, 0,
        0,    0,   0, 0,
      ])
    })

    it('setMat2x2', async () => {
      const shader = device.createWgslModule({ code: code })
      // prettier-ignore
      shader.program.setMat2x2('value', [
        0.25, 0.5,
        0.75, 1.0,
      ])
      shader.program.commit()
      const pixel = await renderPixel(device, shader, 1, 4)
      // prettier-ignore
      expect(pixel).toEqual([
        0.25, 0.5, 0, 0,
        0.75, 1.0, 0, 0,
        0,    0,   0, 0,
        0,    0,   0, 0,
      ])
    })
  })

  describe('mat3x3', () => {
    const code = /* wgsl */ `
      ${VERTEX_SHADER}

      @group(0)
      @binding(0)
      var<uniform> value: mat3x3f;

      @fragment
      fn fs(@builtin(position) pos: vec4f) -> @location(0) vec4f {
        let col: u32 = u32(pos.y);
        switch (col) {
          case 0u: {
            return vec4f(value[0].x, value[0].y, value[0].z, 0);
          }
          case 1u: {
            return vec4f(value[1].x, value[1].y, value[1].z, 0);
          }
          case 2u: {
            return vec4f(value[2].x, value[2].y, value[2].z, 0);
          }
          case 3u: {
            return vec4f(0, 0, 0, 0);
          }
          default: {
            return vec4f(0);
          }
        }
      }
    `
    it('setMat3x3', async () => {
      const shader = device.createWgslModule({ code: code })
      // prettier-ignore
      shader.program.setMat3x3('value', [
        1, 2, 3,
        4, 5, 6,
        7, 8, 9,
      ])
      shader.program.commit()
      const pixel = await renderPixel(device, shader, 1, 4)
      // prettier-ignore
      expect(pixel).toEqual([
        1, 2, 3, 0,
        4, 5, 6, 0,
        7, 8, 9, 0,
        0, 0, 0, 0,
      ])
    })
  })

  describe('structs', () => {
    it('vec3 + float32', async () => {
      const code = /* wgsl */ `
        ${VERTEX_SHADER}

        struct Data {
          a: vec3f,
          b: f32,
        }

        @group(0)
        @binding(0)
        var<uniform> value: Data;

        @fragment
        fn fs(@builtin(position) pos: vec4f) -> @location(0) vec4f {
          switch (u32(pos.y)) {
            case 0u: {
              return vec4f(value.a.x, value.a.y, value.a.z, 0);
            }
            case 1u: {
              return vec4f(value.b, 0, 0, 0);
            }
            default: {
              return vec4f(0);
            }
          }
        }
      `

      const shader = await device.createWgslModule({ code: code }).ready
      // prettier-ignore
      shader.program.mustSet('value.a', { x: 2, y: 3, z: 4 })
      shader.program.mustSet('value.b', 1)
      shader.program.commit()
      const pixel = await renderPixel(device, shader, 1, 4)
      // prettier-ignore
      expect(pixel).toEqual([
        2, 3, 4, 0,
        1, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
      ])
    })

    it('float32 + vec3', async () => {
      const code = /* wgsl */ `
        ${VERTEX_SHADER}

        struct Data {
          a: f32,
          b: vec3f,
        }
        @group(0)
        @binding(0)
        var<uniform> value: Data;

        @fragment
        fn fs(@builtin(position) pos: vec4f) -> @location(0) vec4f {
          switch (u32(pos.y)) {
            case 0u: {
              return vec4f(value.a, 0, 0, 0);
            }
            case 1u: {
              return vec4f(value.b.x, value.b.y, value.b.z, 0);
            }
            default: {
              return vec4f(0);
            }
          }
        }
      `

      const shader = await device.createWgslModule({ code: code }).ready
      // prettier-ignore
      shader.program.mustSet('value.a', 1)
      shader.program.mustSet('value.b', { x: 2, y: 3, z: 4 })
      shader.program.commit()
      const pixel = await renderPixel(device, shader, 1, 2)
      // prettier-ignore
      expect(pixel).toEqual([
        1, 0, 0, 0,
        2, 3, 4, 0,
      ])
    })
  })
})
