import { Device, WebglDevice, WebGpuDevice } from '@gglib/graphics'
import { beforeEach, describe, expect, it } from 'vitest'
import { IblBRDFLutEffect } from './ibl-brdf-lut'

describe('IblBrdfLut', () => {
  describe('WebGPU', () => {
    runContract(() => new WebGpuDevice({}))
  })

  describe('WebGL', () => {
    runContract(() => new WebglDevice({}))
  })
})

function runContract(createDevice: () => Device) {
  let device: Device
  beforeEach(async () => {
    device = await createDevice().ready
  })

  it('compiles', async () => {
    const effect = await new IblBRDFLutEffect(device).compiled
    expect(effect.isValid).toBe(true)
  })

  it('renders', async () => {
    const effect = await new IblBRDFLutEffect(device).compiled

    const rt = device.createRenderTarget({})
    effect.textureOut = rt
    effect.render(device.renderPass)
  })
}
