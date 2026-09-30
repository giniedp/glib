import { describe, expect, it } from 'vitest'
import { TextureUsage, type Device, type TextureDescriptor } from '@gglib/graphics'
import { RenderTargetManager } from './RenderTargetManager'

function createManager() {
  const device = {
    createRenderTarget: (options: TextureDescriptor) => ({ ...options, dispose: () => {} }),
    createDepthTarget: (options: TextureDescriptor) => ({ ...options, dispose: () => {} }),
  } as unknown as Device
  return new RenderTargetManager(device)
}

function desc(mipLevelCount: number): TextureDescriptor {
  return {
    type: '2d',
    format: 'r16float',
    width: 64,
    height: 64,
    depth: 1,
    sampleCount: 1,
    mipLevelCount,
    usage: TextureUsage.RenderTarget | TextureUsage.TextureBinding,
  }
}

describe('RenderTargetManager', () => {
  it('reuses released targets with the same descriptor', () => {
    const manager = createManager()
    const a = manager.acquire(desc(1))
    manager.release(a)
    expect(manager.acquire(desc(1))).toBe(a)
  })

  it('does not reuse targets with a different mip level count', () => {
    const manager = createManager()
    const a = manager.acquire(desc(1))
    manager.release(a)
    const b = manager.acquire(desc(5))
    expect(b).not.toBe(a)
    expect(b.mipLevelCount).toBe(5)
  })
})
