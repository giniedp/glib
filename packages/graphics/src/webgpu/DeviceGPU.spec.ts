import { DeviceGPU } from './DeviceGPU'

describe('@gglib/graphics/DeviceGPU', () => {
  let device: DeviceGPU

  xit ('initializes', (done) => {
    device = new DeviceGPU()
    device.init().then(() => {
      done()
    })
    .catch(done.fail)
  })
})
