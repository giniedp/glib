import { Device, WebglDevice, WebGpuDevice } from '@gglib/graphics'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { PixelateShader, PixelateShaderSchema } from './pixelate'

describe('Pixelate', () => {
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

function runContract(createDevice: () => Device) {
  let device: Device
  beforeAll(async () => {
    device = await createDevice().ready
  })
  afterAll(() => device.dispose())

  describe('PixelateShader', () => {
    let shader: PixelateShader
    beforeAll(async () => {
      shader = new PixelateShader(device)
      await shader.combiled
    })

    for (const slot of Object.values(PixelateShaderSchema)) {
      it(`has ${slot.key} input`, async () => {
        expect(!!shader.program.get(slot.key)).toBe(true)
      })
    }
  })
}
