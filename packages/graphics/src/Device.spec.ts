import { beforeEach, describe, expect, it } from 'vitest'
import { Device } from './Device'
import { WebglDevice } from './webgl'
import { WebGpuDevice } from './webgpu'

describe('Device', () => {
  describe('WebGPU', () => {
    runContract(() => {
      return new WebGpuDevice({
        surfaceFormat: 'RGBA8_UNORM',
      })
    })
  })

  describe('WebGL', () => {
    runContract(() => {
      return new WebglDevice({})
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
      expect(device.stats().textureCount).toBe(1) // default texture
      expect(device.stats().textureStaleCount).toBe(0)

      const t1 = device.createTexture({ width: 1, height: 1 })
      expect(device.stats().textureCount).toBe(2)
      expect(device.stats().textureStaleCount).toBe(0)

      const t2 = device.createTexture({ width: 1, height: 1 })
      expect(device.stats().textureCount).toBe(3)
      expect(device.stats().textureStaleCount).toBe(0)

      t1.dispose()
      expect(device.stats().textureCount).toBe(2)
      expect(device.stats().textureStaleCount).toBe(0)

      t2.dispose()
      expect(device.stats().textureCount).toBe(1)
      expect(device.stats().textureStaleCount).toBe(0)
    })
  })

  describe('acquireTexture', () => {
    it('counts textures in stats', async () => {
      expect(device.stats().textureCount).toBe(1) // default texture
      expect(device.stats().textureStaleCount).toBe(0)

      const t1 = device.acquireTexture({ key: 'test', width: 1, height: 1 })
      expect(device.stats().textureCount).toBe(2)
      expect(device.stats().textureStaleCount).toBe(0)

      const t2 = device.acquireTexture({ key: 'test', width: 1, height: 1 })
      expect(device.stats().textureCount).toBe(2) // same texture
      expect(device.stats().textureStaleCount).toBe(0)

      expect(t1).toBe(t2)

      t1.dispose()
      expect(device.stats().textureCount).toBe(2)
      expect(device.stats().textureStaleCount).toBe(0)

      t2.dispose()
      expect(device.stats().textureCount).toBe(2)
      expect(device.stats().textureStaleCount).toBe(1)

      // acquire again to revive
      const t3 = device.acquireTexture({ key: 'test', width: 4, height: 4 })
      expect(device.stats().textureCount).toBe(2)
      expect(device.stats().textureStaleCount, 'revived').toBe(0)
      expect(t3.width, 'same texture, old width').toBe(1)
      expect(t3, 'same texture').toBe(t1)

      await new Promise((resolve) => setTimeout(resolve, 0))
      expect(device.stats().textureCount).toBe(2)

      t3.dispose()
      expect(device.stats().textureCount).toBe(2)
      expect(device.stats().textureStaleCount).toBe(1)

      // finalize stale texture on next tick
      await new Promise((resolve) => setTimeout(resolve, 0))
      expect(device.stats().textureCount).toBe(1)
      expect(device.stats().textureStaleCount).toBe(0)
    })
  })
}
