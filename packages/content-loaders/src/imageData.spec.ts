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
      pipeline: new Pipeline(),
    })
  })

  describe('jpegToImageData', () => {
    beforeEach(() => {
      manager.pipeline.register(loadJpegToHTMLImageElement)
      manager.pipeline.register(loadJpegToImage)
      manager.pipeline.register(loadJpegToImageData)
    })

    it ('loads ImageData', async () => {
      const result = await manager.load('/assets/textures/prototype/proto_gray.jpg', ImageData)
      expect(result instanceof ImageData).toBe(true)
      expect(result.width).toBe(512)
      expect(result.height).toBe(512)
    })
  })

  describe('pngToImageData', () => {
    beforeEach(() => {
      manager.pipeline.register(loadPngToHTMLImageElement)
      manager.pipeline.register(loadPngToImage)
      manager.pipeline.register(loadPngToImageData)
    })

    it ('loads ImageData', async () => {
      const result = await manager.load('/assets/textures/prototype/proto_gray.png', ImageData)
      expect(result instanceof ImageData).toBe(true)
      expect(result.width).toBe(512)
      expect(result.height).toBe(512)
    })
  })
})
