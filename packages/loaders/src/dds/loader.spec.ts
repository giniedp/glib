import { ContentLoader } from '@gglib/content'
import { DeviceGL, TextureSource } from '@gglib/graphics'
import { beforeEach, describe, expect, it } from 'vitest'
import { Loader } from './loader'

describe('DDS Loader', () => {
  let device: DeviceGL
  let content: ContentLoader

  beforeEach(async () => {
    device = new DeviceGL()
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
    expect(texture.ready).toBe(true)
  })

  it('/assets/textures/dds/bobcat_ddna.a.dds?.url', async () => {
    // @ts-ignore
    const url = await import('/assets/textures/dds/bobcat_ddna.a.dds?url').then((it) => it.default)
    const result = await content.loadAsset(url)
    expect(result.textures).toHaveLength(1)
    expect(result.textures[0].source).toBeInstanceOf(TextureSource)
    const texture = device.createTexture(result.textures[0])
    expect(texture.ready).toBe(true)
  })

  it('/assets/textures/dds/bobcat_ddna.dds?.url', async () => {
    // @ts-ignore
    const url = await import('/assets/textures/dds/bobcat_ddna.dds?url').then((it) => it.default)
    const result = await content.loadAsset(url)
    expect(result.textures).toHaveLength(1)
    expect(result.textures[0].source).toBeInstanceOf(TextureSource)
    const texture = device.createTexture(result.textures[0])
    expect(texture.ready).toBe(true)
  })
})
