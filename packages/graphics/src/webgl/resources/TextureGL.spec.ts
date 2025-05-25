import { beforeEach, describe, expect, it } from 'vitest'
import { createTextureSource } from '../../resources/TextureSource'
import { DeviceGL } from '../DeviceGL'

const RED10x20 =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAUCAYAAAC07qxWAAAAGElEQVR42mP8z8AARIQB46jCUYWjCkEAAMXUJ+1sUc+CAAAAAElFTkSuQmCC'
describe('TextureGL', () => {
  let device: DeviceGL
  beforeEach(() => {
    device = new DeviceGL({})
  })

  it('counts references for same source', () => {
    const source = createTextureSource(RED10x20)
    const t1 = device.createTexture({
      type: 'Texture2D',
      source,
    })
    expect(t1.referenceCount).toBe(1)
    expect(device.countTextureReferences()).toBe(1)
    expect(device.countTextures()).toBe(1)

    const t2 = device.createTexture({
      type: 'Texture2D',
      source,
    })
    expect(t2.referenceCount).toBe(2)
    expect(device.countTextureReferences()).toBe(2)
    expect(device.countTextures()).toBe(1)

    expect(t1).toBe(t2)

    t2.dispose()
    expect(t2.referenceCount).toBe(1)

    t1.dispose()
    expect(t1.referenceCount).toBe(0)

    // counter reached 0, resource should be gone
    // new texture with same source should create new resource and counter

    const t3 = device.createTexture({
      type: 'Texture2D',
      source,
    })
    expect(t3.referenceCount).toBe(1)
    expect(t3).not.toBe(t2)
  })

  it('creates unique resources for textures without source', () => {
    const t1 = device.createTexture({ type: 'Texture2D' })
    expect(t1.referenceCount).toBe(1)
    expect(device.countTextureReferences()).toBe(1)
    expect(device.countTextures()).toBe(1)

    const t2 = device.createTexture({ type: 'Texture2D' })
    expect(t2.referenceCount).toBe(1)
    expect(device.countTextureReferences()).toBe(2)
    expect(device.countTextures()).toBe(2)

    expect(t1).not.toBe(t2)

    t1.dispose()
    expect(t1.referenceCount).toBe(0)
    expect(device.countTextureReferences()).toBe(1)
    expect(device.countTextures()).toBe(1)

    t2.dispose()
    expect(t2.referenceCount).toBe(0)
    expect(device.countTextureReferences()).toBe(0)
    expect(device.countTextures()).toBe(0)
  })
})
