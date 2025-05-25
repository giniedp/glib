import { DeviceGPU } from './DeviceGPU'
import { describe, expect, it, beforeEach } from 'vitest'

describe('@gglib/graphics/DeviceGPU', () => {
  let device: DeviceGPU

  it.skip('initializes', async () => {
    device = new DeviceGPU()
    await device.init()
  })
})
