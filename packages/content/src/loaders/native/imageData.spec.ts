import { loaders, Manager, Pipeline } from '@gglib/content'
import { Device } from '@gglib/graphics'

describe('content/loaders/native', () => {

  let device: Device
  let manager: Manager

  beforeEach(() => {
    device = new Device()
    manager = new Manager(device, {
      loader: new Pipeline(),
    })
  })

  describe('jpegToImageData', () => {
    beforeEach(() => {
      manager.loader.register(loaders.jpegToHTMLImageElement)
      manager.loader.register(loaders.jpegToImage)
      manager.loader.register(loaders.jpegToImageData)
    })

    it ('loads ImageData', (done) => {
      manager.load('/assets/textures/proto_gray.jpg', ImageData).then((result) => {
        expect(result instanceof ImageData).toBe(true)
        expect(result.width).toBe(512)
        expect(result.height).toBe(512)
      })
      .catch(fail)
      .then(done)
    })
  })

  describe('pngToImageData', () => {
    beforeEach(() => {
      manager.loader.register(loaders.pngToHTMLImageElement)
      manager.loader.register(loaders.pngToImage)
      manager.loader.register(loaders.pngToImageData)
    })

    it ('loads ImageData', (done) => {
      manager.load('/assets/textures/proto_gray.png', ImageData).then((result) => {
        expect(result instanceof ImageData).toBe(true)
        expect(result.width).toBe(512)
        expect(result.height).toBe(512)
      })
      .catch(fail)
      .then(done)
    })
  })
})
