import { ContentManager, Pipeline } from '@gglib/content'
import { loadTgaToImageData } from '@gglib/content-loaders'
import { DeviceGL } from '@gglib/graphics'

describe('content/loaders/tga', () => {

  let device: DeviceGL
  let manager: ContentManager

  beforeEach(() => {
    device = new DeviceGL()
    manager = new ContentManager(device, {
      loader: new Pipeline(),
    })
  })

  describe('tgaToImageData', () => {
    beforeEach(() => {
      manager.loader.register(loadTgaToImageData)
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
