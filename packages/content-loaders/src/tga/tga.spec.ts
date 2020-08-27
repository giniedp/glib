import { ContentManager, Pipeline } from '@gglib/content'
import { loadTgaToImageData, loadTgaToTGA } from '../index'
import { DeviceGL } from '@gglib/graphics'

describe('content/loaders/tga', () => {

  let device: DeviceGL
  let manager: ContentManager

  beforeEach(() => {
    device = new DeviceGL()
    manager = new ContentManager(device, {
      pipeline: new Pipeline(),
    })
  })

  describe('tgaToImageData', () => {
    beforeEach(() => {
      manager.pipeline.register(loadTgaToTGA)
      manager.pipeline.register(loadTgaToImageData)
    })

    it ('loads ImageData', async () => {
      const result = await manager.load('/assets/textures/prototype/proto_gray.tga', ImageData)
      expect(result instanceof ImageData).toBe(true)
      expect(result.width).toBe(512)
      expect(result.height).toBe(512)
    })
  })
})

