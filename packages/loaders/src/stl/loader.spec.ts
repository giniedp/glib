import { ContentLoader } from '@gglib/content'
import { CommonMaterial, WebglDevice } from '@gglib/graphics'
import { beforeEach, describe, it } from 'vitest'

import { server } from '@vitest/browser/context'

import { Loader } from './loader'

describe('STL Loader', () => {
  let device: WebglDevice
  let content: ContentLoader

  beforeEach(async () => {
    device = new WebglDevice({})
    content = new ContentLoader(device)
    content.registerLoader(Loader)
    content.registerMaterial(CommonMaterial, () => true)

    const cache = await caches.open(content.http.cacheName)
    const data = await server.commands.readFile(server.config.root + '/assets/logo/gglib.stl', {
      encoding: 'binary',
    })
    await cache.put(new Request('/assets/logo/gglib.stl'), new Response(data))
  })

  it('loads logo model', async () => {
    await content.loadModel('/assets/logo/gglib.stl')
  })
})
