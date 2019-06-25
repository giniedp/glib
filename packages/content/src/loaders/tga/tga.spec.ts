import { loaders, ContentManager, Pipeline } from '@gglib/content'
import { Device } from '@gglib/graphics'

describe('content/loaders/tga', () => {

  let device: Device
  let manager: ContentManager

  beforeEach(() => {
    device = new Device()
    manager = new ContentManager(device, {
      loader: new Pipeline(),
    })
  })

  describe('tgaToImageData', () => {
    beforeEach(() => {
      manager.loader.register(loaders.tgaToImageData)
    })

    it ('loads ImageData', (done) => {
      manager.load('/assets/textures/prototype/proto_gray.tga', ImageData).then((result) => {
        expect(result instanceof ImageData).toBe(true)
        expect(result.width).toBe(512)
        expect(result.height).toBe(512)
      })
      .catch(fail)
      .then(done)
    })
  })
})
