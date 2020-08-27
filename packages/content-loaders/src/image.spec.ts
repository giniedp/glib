import { ContentManager, Pipeline } from '@gglib/content'
import { loadJpegToHTMLImageElement, loadJpegToImage, loadPngToHTMLImageElement, loadPngToImage } from './index'

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

  describe('jpegToHTMLImageElement', () => {
    beforeEach(() => {
      manager.pipeline.register(loadJpegToHTMLImageElement)
    })

    it('loads HTMLImageElement', async () => {
      const result = await manager.load('/assets/textures/prototype/proto_gray.jpg', HTMLImageElement)
      expect(result instanceof Image).toBe(true)
      expect(result.src).toContain('proto_gray.jpg')
    })
  })

  describe('jpegToImage', () => {
    beforeEach(() => {
      manager.pipeline.register(loadJpegToImage)
    })

    it('loads HTMLImageElement', async () => {
      const result = await manager.load('/assets/textures/prototype/proto_gray.jpg', Image)
      expect(result instanceof Image).toBe(true)
      expect(result.src).toContain('proto_gray.jpg')
    })
  })

  describe('pngToHTMLImageElement', () => {
    beforeEach(() => {
      manager.pipeline.register(loadPngToHTMLImageElement)
    })

    it('loads HTMLImageElement', async () => {
      const result = await manager.load('/assets/textures/prototype/proto_gray.png', HTMLImageElement)
      expect(result instanceof Image).toBe(true)
      expect(result.src).toContain('proto_gray.png')
    })
  })

  describe('pngToImage', () => {
    beforeEach(() => {
      manager.pipeline.register(loadPngToImage)
    })

    it('loads HTMLImageElement', async () => {
      const result = await manager.load('/assets/textures/prototype/proto_gray.png', Image)
      expect(result instanceof Image).toBe(true)
      expect(result.src).toContain('proto_gray.png')
    })
  })
})
