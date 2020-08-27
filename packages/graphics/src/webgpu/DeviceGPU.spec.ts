import { DeviceGPU } from './DeviceGPU'

describe('@gglib/graphics/DeviceGPU', () => {
  let device: DeviceGPU

  xit ('initializes', async () => {
    device = new DeviceGPU()
    await device.init()
  })
})
