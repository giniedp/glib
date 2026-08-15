import { Device, WebglDevice, WebGpuDevice } from '@gglib/graphics'
import { beforeEach, describe, expect, it } from 'vitest'
import { PanoramaToCubemapEffect } from './cubemap'

describe('Cubemap Effect', () => {
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
    const effect = new PanoramaToCubemapEffect(device)
    await effect.program.module.compiled
    expect(effect.program.module.isValid).toBe(true)
  })
}
