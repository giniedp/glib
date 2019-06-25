import { loaders, ContentManager, Pipeline } from '@gglib/content'
import { Device } from '@gglib/graphics'

describe('content/loaders/native', () => {

  let device: Device
  let manager: ContentManager

  beforeEach(() => {
    device = new Device()
    manager = new ContentManager(device, {
      loader: new Pipeline(),
    })
  })

  describe('jpegToHTMLImageElement', () => {
    beforeEach(() => {
      manager.loader.register(loaders.jpegToHTMLImageElement)
    })

    it ('loads HTMLImageElement', (done) => {
      manager.load('/assets/textures/prototype/proto_gray.jpg', HTMLImageElement).then((result) => {
        expect(result instanceof Image).toBe(true)
        expect(result.src).toContain('proto_gray.jpg')
      })
      .catch(fail)
      .then(done)
    })
  })

  describe('jpegToImage', () => {
    beforeEach(() => {
      manager.loader.register(loaders.jpegToImage)
    })

    it ('loads HTMLImageElement', (done) => {
      manager.load('/assets/textures/prototype/proto_gray.jpg', Image).then((result) => {
        expect(result instanceof Image).toBe(true)
        expect(result.src).toContain('proto_gray.jpg')
      })
      .catch(fail)
      .then(done)
    })
  })

  describe('pngToHTMLImageElement', () => {
    beforeEach(() => {
      manager.loader.register(loaders.pngToHTMLImageElement)
    })

    it ('loads HTMLImageElement', (done) => {
      manager.load('/assets/textures/prototype/proto_gray.png', HTMLImageElement).then((result) => {
        expect(result instanceof Image).toBe(true)
        expect(result.src).toContain('proto_gray.png')
      })
      .catch(fail)
      .then(done)
    })
  })

  describe('pngToImage', () => {
    beforeEach(() => {
      manager.loader.register(loaders.pngToImage)
    })

    it ('loads HTMLImageElement', (done) => {
      manager.load('/assets/textures/prototype/proto_gray.png', Image).then((result) => {
        expect(result instanceof Image).toBe(true)
        expect(result.src).toContain('proto_gray.png')
      })
      .catch(fail)
      .then(done)
    })
  })
})
