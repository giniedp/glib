import { ContentLoader } from '@gglib/content'
import { WebglDevice, TextureSource, Texture } from '@gglib/graphics'
import { beforeEach, describe, expect, it } from 'vitest'
import { Loader } from './loader'

describe('DDS Loader', () => {
  let device: WebglDevice
  let content: ContentLoader

  beforeEach(async () => {
    device = new WebglDevice({})
    content = new ContentLoader(device)
    content.registerLoader(Loader)
    content.http.cacheName = 'test-cache'
  })

  it('/assets/textures/formats/ice_normals.dds?.url', async () => {
    // @ts-ignore

    const url = await import('/assets/textures/formats/ice_normals.dds?url').then((it) => it.default)
    const result = await content.loadTexture(url)
    expect(result).instanceOf(Texture)
  })

  it('/assets/textures/formats/ice_base.dds?.url', async () => {
    // @ts-ignore
    const url = await import('/assets/textures/formats/ice_base.dds?url').then((it) => it.default)
    const result = await content.loadTexture(url)
    expect(result).instanceOf(Texture)
  })

  it('/assets/textures/formats/ice_orm.dds?.url', async () => {
    // @ts-ignore
    const url = await import('/assets/textures/formats/ice_orm.dds?url').then((it) => it.default)
    const result = await content.loadTexture(url)
    expect(result).instanceOf(Texture)
  })
})
