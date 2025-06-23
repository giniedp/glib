import { ContentLoader } from '@gglib/content'
import { DeviceGL } from '@gglib/graphics'
import { beforeAll, describe, expect, it } from 'vitest'
import { Loader } from './loader'

const MTL_DATA = `
# some comment
newmtl material name
Ka 1 2 3
d 0.1
Ns 16
`

describe('content loader mtl', () => {
  let device: DeviceGL
  let content: ContentLoader

  beforeAll(async () => {
    device = new DeviceGL()
    content = new ContentLoader(device)
    content.registerLoader(Loader)
    content.http.cacheName = 'test-cache'
    const cache = await caches.open(content.http.cacheName)
    await cache.put(new Request('https://example.com/mtl/material.mtl'), new Response(MTL_DATA))
  })

  describe('mtlMaterial', () => {
    it('loads .mtl to MaterialOptions', async () => {
      const result = await content.loadAsset('https://example.com/mtl/material.mtl')
      expect(result).toBeDefined()
      expect(result.materials).toHaveLength(1)
      const material = result.materials[0]
      expect(material.name).toBe('material name')
      expect(material.parameters.AmbientColor).toEqual([1, 2, 3])
      expect(material.parameters.Blend).toBe(true)
      expect(material.parameters.Alpha).toBe(0.1)
    })
  })
})
