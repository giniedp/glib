import { beforeEach, describe, expect, it } from 'vitest'
import { Device } from './Device'
import { WebglDevice } from './webgl'
import { WebGpuDevice } from './webgpu'

describe('Device', () => {
  describe('WebGPU', () => {
    runContract(() => {
      return new WebGpuDevice({
        surfaceFormat: 'rgba8unorm',
        keepAliveFrames: 2,
      })
    })
  })

  describe('WebGL', () => {
    runContract(() => {
      return new WebglDevice({
        keepAliveFrames: 2,
      })
    })
  })
})

export function runContract(createDevice: () => Device) {
  let device: Device

  beforeEach(async () => {
    device = await createDevice().ready
  })

  describe('createTexture', () => {
    it('counts textures in stats', () => {
      const initialCount = 2 // default textures
      expect(device.stats().textureCount).toBe(initialCount)
      expect(device.stats().textureStaleCount).toBe(0)

      const t1 = device.createTexture({ width: 1, height: 1 })
      expect(device.stats().textureCount).toBe(initialCount + 1)
      expect(device.stats().textureStaleCount).toBe(0)

      const t2 = device.createTexture({ width: 1, height: 1 })
      expect(device.stats().textureCount).toBe(initialCount + 2)
      expect(device.stats().textureStaleCount).toBe(0)

      t1.dispose()
      expect(device.stats().textureCount).toBe(initialCount + 1)
      expect(device.stats().textureStaleCount).toBe(0)

      t2.dispose()
      expect(device.stats().textureCount).toBe(initialCount)
      expect(device.stats().textureStaleCount).toBe(0)
    })

    it('is owned by the global scope', () => {
      const texture = device.createTexture({ width: 1, height: 1 })
      expect(texture.owners.defaultOwner).toBe(device.scope)
      expect(device.scope.has(texture)).toBe(true)
    })

    it('is owned by the given scope', () => {
      const initialCount = device.stats().textureCount
      const scope = device.createScope('test')
      const texture = device.createTexture({ width: 1, height: 1, scope })
      expect(texture.owners.defaultOwner).toBe(null)
      expect(device.scope.has(texture)).toBe(false)
      expect(scope.has(texture)).toBe(true)

      scope.dispose()
      expect(texture.owners.isFinalized).toBe(true)
      expect(device.stats().textureCount).toBe(initialCount)
    })

    it('moves ownership to a scope', () => {
      const scope = device.createScope('test')
      const texture = scope.own(device.createTexture({ width: 1, height: 1 }))
      expect(device.scope.has(texture)).toBe(false)
      scope.dispose()
      expect(texture.owners.isFinalized).toBe(true)
    })

    it('keeps default textures owned by the global scope', () => {
      const scope = device.createScope('test')
      scope.own(device.defaultTexture)
      scope.dispose()
      expect(device.defaultTexture.owners.isFinalized).toBe(false)
      expect(device.scope.has(device.defaultTexture)).toBe(true)
    })
  })

  describe('acquireTexture', () => {
    it('shares one texture between scopes', async () => {
      const initialCount = device.stats().textureCount
      const a = device.createScope('a')
      const b = device.createScope('b')

      const t1 = device.acquireTexture({ key: 'test', width: 1, height: 1, scope: a })
      const t2 = device.acquireTexture({ key: 'test', width: 1, height: 1, scope: b })
      expect(t1).toBe(t2)
      expect(t1.owners.size).toBe(2)
      expect(device.stats().textureCount).toBe(initialCount + 1)

      a.dispose()
      expect(device.stats().textureStaleCount).toBe(0)

      b.dispose()
      expect(device.stats().textureCount).toBe(initialCount + 1)
      expect(device.stats().textureStaleCount).toBe(1)

      // acquire again to revive
      const c = device.createScope('c')
      const t3 = device.acquireTexture({ key: 'test', width: 4, height: 4, scope: c })
      expect(t3, 'same texture').toBe(t1)
      expect(t3.width, 'same texture, old width').toBe(1)
      expect(device.stats().textureStaleCount, 'revived').toBe(0)

      c.dispose()
      expect(device.stats().textureStaleCount).toBe(1)

      // finalized after keep alive frames
      await expect.poll(() => device.stats().textureCount).toBe(initialCount)
      expect(device.stats().textureStaleCount).toBe(0)
      expect(t1.owners.isFinalized).toBe(true)
    })

    it('is owned by the global scope without a scope', () => {
      const texture = device.acquireTexture({ key: 'global', width: 1, height: 1 })
      expect(texture.owners.defaultOwner).toBe(device.scope)
      expect(device.acquireTexture({ key: 'global' })).toBe(texture)
      expect(texture.owners.size).toBe(1)
    })

    it('throws if missing', () => {
      expect(() => device.acquireTexture({ key: 'missing', throwIfMissing: true })).toThrow()
    })
  })
}
