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

  it('/assets/textures/dds/bobcat_diff.dds?.url', async () => {
    // @ts-ignore
    const url = await import('/assets/textures/dds/bobcat_diff.dds?url').then((it) => it.default)
    const result = await content.loadAsset(url)
    expect(result.textures).toHaveLength(1)
    expect(result.textures[0].source).toBeInstanceOf(TextureSource)
    const texture = device.createTexture(result.textures[0])
    expect(texture).instanceOf(Texture)
  })

  it('/assets/textures/dds/bobcat_ddna.a.dds?.url', async () => {
    // @ts-ignore
    const url = await import('/assets/textures/dds/bobcat_ddna.a.dds?url').then((it) => it.default)
    const result = await content.loadAsset(url)
    expect(result.textures).toHaveLength(1)
    expect(result.textures[0].source).toBeInstanceOf(TextureSource)
    const texture = device.createTexture(result.textures[0])
    expect(texture).instanceOf(Texture)
  })

  it('/assets/textures/dds/bobcat_ddna.dds?.url', async () => {
    // @ts-ignore
    const url = await import('/assets/textures/dds/bobcat_ddna.dds?url').then((it) => it.default)
    const result = await content.loadAsset(url)
    expect(result.textures).toHaveLength(1)
    expect(result.textures[0].source).toBeInstanceOf(TextureSource)
    const texture = device.createTexture(result.textures[0])
    expect(texture).instanceOf(Texture)
  })
})
