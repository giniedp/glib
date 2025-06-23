import { ContentLoader } from '@gglib/content'
import { DeviceGL } from '@gglib/graphics'
import { beforeEach, describe, it } from 'vitest'

import { server } from '@vitest/browser/context'

import { Loader } from './loader'

describe('STL Loader', () => {
  let device: DeviceGL
  let content: ContentLoader

  beforeEach(async () => {
    device = new DeviceGL()
    content = new ContentLoader(device)
    content.registerLoader(Loader)

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
