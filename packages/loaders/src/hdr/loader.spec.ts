import { ContentLoader } from '@gglib/content'
import { DeviceGL, TextureSource } from '@gglib/graphics'
import { beforeEach, describe, expect, it } from 'vitest'
import { Loader } from './loader'

import { server } from '@vitest/browser/context'

describe('HDR Loader', () => {
  let device: DeviceGL
  let content: ContentLoader

  beforeEach(async () => {
    device = new DeviceGL()
    content = new ContentLoader(device)
    content.registerLoader(Loader)
    content.http.cacheName = 'test-cache'
  })

  const tests = [
    { asset: '/assets/Cannon_Exterior.hdr' }
  ]
  describe.each(tests)('$asset', ({ asset }) => {
    it('loads', async () => {
      const cache = await caches.open(content.http.cacheName)
      const data = await server.commands.readFile(server.config.root + asset, {
        encoding: 'binary',
      })
      await cache.put(new Request(asset), new Response(data))

      const result = await content.loadAsset(asset)
      expect(result.textures).toHaveLength(1)
      expect(result.textures[0].source).toBeInstanceOf(TextureSource)
    })
  })
})
