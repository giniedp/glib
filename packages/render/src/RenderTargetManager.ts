import { Device, RenderTargetOptions, Texture } from '@gglib/graphics'
import { Log, removeFromArrayUnstable } from '@gglib/utils'

/**
 * @public
 */
export interface ManagedRenderTarget {
  frames: number
  target: Texture
  options: RenderTargetOptions
}

/**
 * @public
 */
export class RenderTargetManager {
  public static compareTargetOptions(a: RenderTargetOptions, b: RenderTargetOptions): boolean {
    if (a.width !== b.width || a.height !== b.height) {
      return false
    }
    if (a.depthFormat !== b.depthFormat || a.surfaceFormat !== b.surfaceFormat) {
      return false
    }
    if (a.pixelFormat !== b.pixelFormat || a.pixelType !== b.pixelType) {
      return false
    }
    if (!a.samplerParams && !b.samplerParams) {
      return true
    }
    if ((a.samplerParams && !b.samplerParams) || (!a.samplerParams && b.samplerParams)) {
      return false
    }
    const aParams = a.samplerParams
    const bParams = b.samplerParams
    if (aParams.minFilter !== bParams.minFilter || aParams.magFilter !== bParams.magFilter) {
      return false
    }
    if (aParams.minLod !== bParams.minLod || aParams.maxLod !== bParams.maxLod) {
      return false
    }
    if (aParams.compareFunc !== bParams.compareFunc || aParams.compareMode !== bParams.compareMode) {
      return false
    }
    if (aParams.wrapU !== bParams.wrapU || aParams.wrapV !== bParams.wrapV || aParams.wrapW !== bParams.wrapW) {
      return false
    }
    return true
  }

  /**
   * The graphics device
   */
  protected device: Device

  /**
   * Collection of render targets currently being unused
   */
  protected freeTargets: ManagedRenderTarget[] = []
  /**
   * Collection of render targets currently being in use
   */
  protected usedTargets: ManagedRenderTarget[] = []

  /**
   * A temporary collection that is used during dispose preocess
   * @private
   */
  protected toDispose: ManagedRenderTarget[] = []

  public maxKeepAlifFrames = 1

  public constructor(device: Device) {
    this.device = device
  }

  /**
   * Updates the management logic
   *
   * @remarks
   * Detects and destroys stale render targets.
   * This should be called once per frame and/or a sufficient value for `keepAliveFrames` property must be used.
   */
  public update() {
    this.toDispose.length = 0
    for (const item of this.freeTargets) {
      item.frames += 1
      if (item.frames > this.maxKeepAlifFrames) {
        this.toDispose.push(item)
      }
    }
    for (const item of this.toDispose) {
      const index = this.freeTargets.indexOf(item)
      this.freeTargets.splice(index, 1)
      item.target.dispose()
    }
  }

  /**
   * Gets an existing render target with given options. Creates a new one if no such exists or is not free.
   */
  public require(opts: RenderTargetOptions): Texture {
    for (const item of this.freeTargets) {
      if (RenderTargetManager.compareTargetOptions(item.options, opts)) {
        removeFromArrayUnstable(this.freeTargets, item)
        this.usedTargets.push(item)
        return item.target
      }
    }

    if (opts instanceof Texture) {
      opts = {
        width: opts.width,
        height: opts.height,
        depthFormat: opts.depthFormat,
        surfaceFormat: opts.surfaceFormat,
        pixelFormat: opts.pixelFormat,
        pixelType: opts.pixelType,
        samplerParams: opts.samplerParams,
      }
    }
    Log.debug('[Render.Manager]', 'create render target', opts)
    const target = this.device.createTexture(opts)
    this.usedTargets.push({
      frames: 0,
      target: target,
      options: opts,
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

    for (const item of this.usedTargets) {
      if (item.target !== target) {
        continue
      }
      item.frames = 0
      this.freeTargets.push(item)
      removeFromArrayUnstable(this.usedTargets, item)
      return
    }

    throw new Error('releaseTarget was called with a target that was not created by this manager.')
  }

  public dispose() {
    for (const item of this.usedTargets) {
      item.target.dispose()
    }
    for (const item of this.freeTargets) {
      item.target.dispose()
    }
    this.usedTargets.length = 0
    this.freeTargets.length = 0
  }
}
