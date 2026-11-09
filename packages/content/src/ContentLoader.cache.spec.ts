import { Device, WebglDevice } from '@gglib/graphics'
import { beforeEach, describe, expect, it } from 'vitest'
import { AssetContainer } from './AssetContainer'
import { AssetLoaderRegistry } from './AssetLoaderRegistry'
import { ContentLoader, ContentLoaderOptions } from './ContentLoader'

describe('@gglib/content/ContentLoader container cache', () => {
  let device: Device
  let fetches: number

  function createLoader(options?: ContentLoaderOptions) {
    const registry = new AssetLoaderRegistry()
    registry.register({
      match: (type) => type === '.test',
      create: () => ({
        load: async (): Promise<AssetContainer> => {
          fetches++
          return container()
        },
      }),
    })
    return new ContentLoader(device, { ...options, registry })
  }

  function container(): AssetContainer {
    return {
      count: () => 2,
      load: async (): Promise<any> => ({ width: 1, height: 1 }),
    }
  }

  beforeEach(() => {
    device = new WebglDevice({})
    fetches = 0
  })

  it('caches containers by default', async () => {
    const content = createLoader()
    await content.loadTexture('a.test', { index: 0 })
    await content.loadTexture('a.test', { index: 1 })
    expect(fetches).toBe(1)
    expect(content.cacheStats.containers).toBe(1)
  })

  it('shares pending containers only if containers are not cached', async () => {
    const content = createLoader({ cacheContainers: false })
    await Promise.all([content.loadTexture('a.test', { index: 0 }), content.loadTexture('a.test', { index: 1 })])
    expect(fetches).toBe(1)
    expect(content.cacheStats.containers).toBe(0)

    await content.loadTexture('b.test', { index: 0 })
    await content.loadTexture('b.test', { index: 1 })
    expect(fetches).toBe(3)
  })

  it('caches instances if containers are not cached', async () => {
    const content = createLoader({ cacheContainers: false })
    const t1 = await content.loadTexture('a.test')
    const t2 = await content.loadTexture('a.test')
    expect(t1).toBe(t2)
    expect(fetches).toBe(1)
    expect(content.cacheStats.assets).toBe(1)
  })

  it('caches the containers that the policy accepts', async () => {
    const content = createLoader({ cacheContainers: (_, url) => url.includes('keep') })
    await content.loadTexture('keep.test', { index: 0 })
    await content.loadTexture('keep.test', { index: 1 })
    expect(fetches).toBe(1)
    await content.loadTexture('drop.test', { index: 0 })
    await content.loadTexture('drop.test', { index: 1 })
    expect(fetches).toBe(3)
    expect(content.cacheStats.containers).toBe(1)
  })

  it('does not cache failed containers with a policy', async () => {
    const content = createLoader({ cacheContainers: () => true })
    await expect(content.loadContainer('a.unknown')).rejects.toThrow()
    expect(content.cacheStats.containers).toBe(0)
  })
})
