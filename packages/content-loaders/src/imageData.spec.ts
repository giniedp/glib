import {
  ContentManager,
  Pipeline,
} from '@gglib/content'

import {
  loadJpegToHTMLImageElement,
  loadJpegToImage,
  loadJpegToImageData,
  loadPngToHTMLImageElement,
  loadPngToImage,
  loadPngToImageData,
} from './index'

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

  describe('jpegToImageData', () => {
    beforeEach(() => {
      manager.loader.register(loadJpegToHTMLImageElement)
      manager.loader.register(loadJpegToImage)
      manager.loader.register(loadJpegToImageData)
    })

    it ('loads ImageData', (done) => {
      manager.load('/assets/textures/prototype/proto_gray.jpg', ImageData).then((result) => {
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
      manager.loader.register(loadPngToHTMLImageElement)
      manager.loader.register(loadPngToImage)
      manager.loader.register(loadPngToImageData)
    })

    it ('loads ImageData', (done) => {
      manager.load('/assets/textures/prototype/proto_gray.png', ImageData).then((result) => {
        expect(result instanceof ImageData).toBe(true)
        expect(result.width).toBe(512)
        expect(result.height).toBe(512)
      })
      .catch(fail)
      .then(done)
    })
  })
})
