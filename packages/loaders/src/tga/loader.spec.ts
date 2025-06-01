import { ContentLoader } from '@gglib/content'
import { DeviceGL, TextureSource } from '@gglib/graphics'
import { beforeEach, describe, expect, it } from 'vitest'
import { Loader } from './loader'

describe('content/loaders/tga', () => {
  let device: DeviceGL
  let content: ContentLoader

  beforeEach(() => {
    device = new DeviceGL()
    content = new ContentLoader(device)
    content.registerLoader(Loader)
  })

  describe('tgaToImageData', () => {
    it('loads ImageData', async () => {
      const result = await content.loadAsset('/assets/testimages/tga/avatar.tga')
      expect(result.textures).toHaveLength(1)
      expect(result.textures[0].source).toBeInstanceOf(TextureSource)
    })
  })
})
