import { Device, WebglDevice, WebGpuDevice } from '@gglib/graphics'
import { beforeEach, describe, expect, it } from 'vitest'
import { UpsampleEffect } from './upsample'

describe('Upsample Effect', () => {
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
    const effect = new UpsampleEffect(device)
    await effect.compiled
    expect(effect.isValid).toBe(true)
  })
}
