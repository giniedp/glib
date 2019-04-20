import { loaders, Manager, Pipeline } from '@gglib/content'
import { Device } from '@gglib/graphics'

describe('content/loaders/tga', () => {

  let device: Device
  let manager: Manager

  beforeEach(() => {
    device = new Device()
    manager = new Manager(device, {
      loader: new Pipeline(),
    })
  })

  describe('tgaToImageData', () => {
    beforeEach(() => {
      manager.loader.register(loaders.tgaToImageData)
    })

    it ('loads ImageData', (done) => {
      manager.load('/assets/textures/proto_gray.tga', ImageData).then((result) => {
        expect(result instanceof ImageData).toBe(true)
        expect(result.width).toBe(512)
        expect(result.height).toBe(512)
      })
      .catch(fail)
      .then(done)
    })
  })
})
