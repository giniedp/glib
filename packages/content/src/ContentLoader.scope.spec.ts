import { BasicMaterial, Device, vertexLayout, WebglDevice } from '@gglib/graphics'
import type { ModelOptions } from '@gglib/model'
import { beforeEach, describe, expect, it } from 'vitest'
import { AssetContainer } from './AssetContainer'
import { AssetLoaderRegistry } from './AssetLoaderRegistry'
import { AssetType } from './AssetType'
import { ContentLoader } from './ContentLoader'

describe('@gglib/content/ContentLoader scopes', () => {
  let device: Device
  let content: ContentLoader

  function modelOptions(): ModelOptions {
    return {
      meshes: [
        {
          materials: [{ properties: {} }],
          geometries: [
            {
              vertexBuffer: [
                {
                  layout: vertexLayout(['position']),
                  data: new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]),
                },
              ],
            },
          ],
          parts: [{ geometryIndex: 0, materialIndex: 0 }],
        },
      ],
    }
  }

  beforeEach(() => {
    device = new WebglDevice({})
    const registry = new AssetLoaderRegistry()
    registry.register({
      match: (type) => type === '.test',
      create: () => ({
        load: async (): Promise<AssetContainer> => ({
          count: () => 1,
          load: async (type: AssetType<any, any>): Promise<any> => {
            if (type === AssetType.Texture) {
              return { width: 1, height: 1 }
            }
            return modelOptions()
          },
        }),
      }),
    })
    content = new ContentLoader(device, { registry })
  })

  it('owns the loaded instance by the given scope', async () => {
    const scope = device.createScope('test')
    const texture = await content.loadTexture('a.test', { scope })
    expect(scope.has(texture)).toBe(true)
    expect(device.scope.has(texture)).toBe(false)
  })

  it('shares a cached instance between scopes', async () => {
    const a = device.createScope('a')
    const b = device.createScope('b')
    const t1 = await content.loadTexture('a.test', { scope: a })
    const t2 = await content.loadTexture('a.test', { scope: b })
    expect(t1).toBe(t2)
    expect(a.has(t1) && b.has(t1)).toBe(true)
    a.dispose()
    expect(t1.ownership.isFinalized).toBe(false)
    b.dispose()
    expect(t1.ownership.isFinalized).toBe(true)
  })

  it('evicts finalized instances from the cache', async () => {
    const a = device.createScope('a')
    const t1 = await content.loadTexture('a.test', { scope: a })
    a.dispose()
    const t2 = await content.loadTexture('a.test')
    expect(t2).not.toBe(t1)
    expect(t2.ownership.isFinalized).toBe(false)
  })

  it('creates model materials owned by their mesh', async () => {
    const scope = device.createScope('test')
    const model = await content.loadModel('a.test', { scope })
    const mesh = model.meshes[0]
    const material = mesh.materials[0]
    const geometry = mesh.geometries[0]
    expect(material).toBeInstanceOf(BasicMaterial)
    expect(scope.has(model)).toBe(true)
    expect(Array.from(scope.walk())).toEqual(expect.arrayContaining([mesh, material, geometry.vertexBuffer]))
    expect(device.scope.has(mesh)).toBe(false)

    scope.dispose()
    expect(model.ownership.isFinalized).toBe(true)
    expect(mesh.ownership.isFinalized).toBe(true)
    expect(material.ownership.isFinalized).toBe(true)
    expect(geometry.ownership.isFinalized).toBe(true)
  })

  it('holds the nested loads of a container until the instance is created', async () => {
    let release: () => void
    const gate = new Promise<void>((resolve) => {
      release = resolve
    })
    let nested: any = null
    const registry = new AssetLoaderRegistry()
    registry.register({
      match: (type) => type === '.test',
      create: () => ({
        load: async (): Promise<AssetContainer> => ({
          count: () => 1,
          load: async () => ({ width: 1, height: 1 }),
        }),
      }),
    })
    registry.register({
      match: (type) => type === '.mat',
      create: () => ({
        load: async (): Promise<AssetContainer> => ({
          count: () => 1,
          load: async (_type, _index, context): Promise<any> => {
            // a cached texture that another scope owns
            nested = await context.content.loadTexture('a.test', { scope: context.holdScope })
            await gate
            return { properties: {} }
          },
        }),
      }),
    })
    content = new ContentLoader(device, { registry })
    const other = device.createScope('other')
    const texture = await content.loadTexture('a.test', { scope: other })

    const loading = content.loadMaterial('a.mat')
    await new Promise((resolve) => setTimeout(resolve))
    expect(nested).toBe(texture)
    // the other owner lets go while the material loads
    other.dispose()
    expect(texture.ownership.isFinalized).toBe(false)

    release()
    await loading
    // the hold ends with the load, the material did not claim the texture
    expect(texture.ownership.isFinalized).toBe(true)
  })
})
