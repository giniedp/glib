import { Device, surfaceIsDepthStencilFormat, Texture, TextureDescriptor } from '@gglib/graphics'
import { removeItemUnordered } from '@gglib/utils'

export interface ManagedTexture {
  key: string
  texture: Texture
  options: TextureDescriptor
  lastUse: number
}

export interface RenderTargetManagerOptions {
  maxKeepAlifeFrames?: number
}

/**
 * @public
 */
export class RenderTargetManager {
  /**
   * The graphics device
   */
  protected device: Device

  protected frameCount = 0
  protected freeList: ManagedTexture[] = []
  protected usedList: ManagedTexture[] = []

  public maxKeepAlifeFrames = 60

  public constructor(device: Device, options?: RenderTargetManagerOptions) {
    this.device = device
    this.maxKeepAlifeFrames = options?.maxKeepAlifeFrames ?? this.maxKeepAlifeFrames
  }

  /**
   * Updates frame counter and schedules eviction of stale render targets
   */
  public update() {
    this.evict()
    this.frameCount++
  }

  protected toDispose: ManagedTexture[] = []
  protected evict() {
    this.toDispose.length
    for (const item of this.freeList) {
      if (this.isStale(item)) {
        this.toDispose.push(item)
      }
    }
    while (this.toDispose.length > 0) {
      const item = this.toDispose.pop()
      console.debug('RenderTarget dispose', item.key)
      removeItemUnordered(this.freeList, item)
      try {
        item.texture.dispose()
      } catch (err) {
        console.warn('failed to dispose render target', err)
      }
    }
    this.toDispose.length = 0
  }

  private isStale(item: ManagedTexture) {
    return this.frameCount - item.lastUse > this.maxKeepAlifeFrames
  }

  /**
   * Gets an existing render target with given options.
   * Creates a new one if no such exists or is not free.
   */
  public acquire(options: TextureDescriptor, label?: string): Texture {
    for (let i = 0; i < this.freeList.length; i++) {
      const item = this.freeList[i]
      if (!this.compatible(options, item.options)) {
        continue
      }
      this.freeList[i] = this.freeList[this.freeList.length - 1]
      this.freeList.pop()
      this.usedList.push(item)
      item.lastUse = this.frameCount
      return item.texture
    }

    options = {
      ...options,
    }
    const key = [
      options.type,
      options.format,
      `${options.width}x${options.height}x${options.depth}`,
      options.sampleCount,
      label || '',
    ].join('|')
    options.name ??= `rt:${key}`
    let target: Texture
    if (surfaceIsDepthStencilFormat(options.format)) {
      target = this.device.createDepthTarget(options as any)
    } else {
      target = this.device.createRenderTarget(options)
    }
    console.debug('RenderTarget created', key)
    this.usedList.push({
      lastUse: this.frameCount,
      texture: target,
      options,
      key,
    })
    return target
  }

  /**
   * Releases a render target
   *
   * @remarks
   * This must only be called with render targets that were previously created with `acquireTarget`
   */
  public release(target: Texture) {
    if (!target) {
      throw new Error('released target must not be null')
    }

    for (let i = 0; i < this.usedList.length; i++) {
      if (this.usedList[i].texture !== target) {
        continue
      }
      const item = this.usedList[i]
      item.lastUse = this.frameCount
      this.usedList[i] = this.usedList[this.usedList.length - 1]
      this.usedList.pop()
      this.freeList.push(item)
      return
    }

    throw new Error('releaseTarget was called with a target that was not created by this manager.')
  }

  public dispose() {
    for (const item of this.usedList) {
      item.texture.dispose()
    }
    for (const item of this.freeList) {
      item.texture.dispose()
    }
    this.usedList.length = 0
    this.freeList.length = 0
  }

  protected compatible(a: TextureDescriptor, b: TextureDescriptor): boolean {
    return (
      a.width === b.width &&
      a.height === b.height &&
      a.depth === b.depth &&
      a.format === b.format &&
      a.type === b.type &&
      a.sampleCount === b.sampleCount
      // a.usage === b.usage
    )
  }
}
