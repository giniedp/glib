import {
  ContentManager,
  loadJpegToHTMLImageElement,
  loadJpegToImage,
  loadPngToHTMLImageElement,
  loadPngToImage,
  Pipeline,
} from '@gglib/content'
import { DeviceGL } from '@gglib/graphics'

describe('content/loaders/native', () => {

  let device: DeviceGL
  let manager: ContentManager

  beforeEach(() => {
    device = new DeviceGL()
    manager = new ContentManager(device, {
      loader: new Pipeline(),
    })
  })

  describe('jpegToHTMLImageElement', () => {
    beforeEach(() => {
      manager.loader.register(loadJpegToHTMLImageElement)
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
      manager.loader.register(loadJpegToImage)
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
      manager.loader.register(loadPngToHTMLImageElement)
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
      manager.loader.register(loadPngToImage)
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
