import { Events, extend, logger } from '@glib/core'
import { DepthFormat, Device, RenderTargetOptions, SpriteBatch, Texture } from '@glib/graphics'
import { Binder } from './Binder'
import { View } from './Types'

export interface RenderTargetRegistry {
  frames: number
  target: Texture
  options: RenderTargetOptions
}

let toKill: RenderTargetRegistry[] = []

export class Manager extends Events {

  /**
   * The graphics device
   */
  public device: Device
  /**
   * The shader uniform binder
   */
  public binder: Binder
  /**
   * Collection of all renderable views
   */
  public views: View[]
  /**
   * View that is currently being rendered
   */
  public view: View
  /**
   * SpriteBatch that is used to compose the results of all views into final image
   */
  protected spriteBatch: SpriteBatch
  /**
   * Collection of created but not currently used render targets
   */
  protected freeTargets: RenderTargetRegistry[] = []
  /**
   * Collection of currently used render targets
   */
  protected usedTargets: RenderTargetRegistry[] = []

  /**
   * Maximum life time (number of frames) of an unused render target
   */
  public keepAliveFrames = 1

  constructor(device: Device) {
    super()
    this.device = device
    this.binder = new Binder(device)
    this.views = []
    this.spriteBatch = device.createSpriteBatch()
  }

  public addView(view: View) {
    if (view.enabled == null) {
      view.enabled = true
    }
    if (view.layout == null) {
      view.layout = { x: 0, y: 0, width: 1, height: 1 }
    }
    this.views.push(view)
  }

  public removeView(indexOrView: number|View) {
    let view = indexOrView as View
    if (typeof indexOrView === 'number') {
      view = this.views[indexOrView]
    }
    if (view && view.target) {
      this.releaseTarget(view.target)
      view.target = void 0
    }
    let index = this.views.indexOf(view)
    if (index >= 0) {
      this.views.splice(index, 1)
    }
  }

  public acquireTarget(opts: RenderTargetOptions): Texture {
    let found
    for (let item of this.freeTargets) {
      if (Manager.compareTargetOptions(item.options, opts)) {
        found = item
        break
      }
    }
    if (found) {
      // remove from free list
      let index = this.freeTargets.indexOf(found)
      this.freeTargets.splice(index, 1)
      // mark as owned and used
      this.usedTargets.push(found)
      // return
      return found.target
    }
    if (opts instanceof Texture) {
      opts = {
        width: opts.width,
        height: opts.height,
        depthFormat: opts.depthFormat,
      }
    }
    logger.info('[Render.Manager]', 'create render target', opts)
    let target = this.device.createTexture2D(opts)
    this.usedTargets.push({
      frames: 0,
      target: target,
      options: opts,
    })
    return target
  }

  public releaseTarget(target: Texture) {
    if (!target) {
      throw new Error('released target must not be null')
    }

    let found: RenderTargetRegistry
    for (let item of this.usedTargets) {
      if (item.target === target) {
        found = item
        break
      }
    }
    if (found) {
      // remove from used list
      let index = this.usedTargets.indexOf(found)
      this.usedTargets.splice(index, 1)
      found.frames = 0
      this.freeTargets.push(found)
      return
    }
    this.freeTargets.push({
      frames: 0,
      target: target,
      options: {
        width: target.width,
        height: target.height,
        depthFormat: target.depthFormat,
      },
    })
  }

  private static compareTargetOptions(a: RenderTargetOptions, b: RenderTargetOptions): boolean {
    return (a.width === b.width) && (a.height === b.height) && (!!a.depthFormat === !!b.depthFormat)
  }

  public update() {
    toKill.length = 0
    for (let item of this.freeTargets) {
      item.frames += 1
      if (item.frames > this.keepAliveFrames) {
        toKill.push(item)
      }
    }
    for (let item of toKill) {
      let index = this.freeTargets.indexOf(item)
      this.freeTargets.splice(index, 1)
      logger.info('[Render.Manager]', 'destroy render target')
      item.target.destroy()
    }
  }

  public render() {
    this.device.resize()
    for (const view of this.views) {
      this.renderView(view)
    }
    this.presentViews()
  }

  public renderView(view: View) {
    this.updateView(view)
    for (let step of view.steps) {
      if (step.setup) {
        this.view = view
        step.setup(this)
      }
    }
    for (let step of view.steps) {
      if (step.render) {
        this.view = view
        step.render(this)
      }
    }
    for (let step of view.steps) {
      if (step.cleanup) {
        this.view = view
        step.cleanup(this)
      }
    }
  }

  public updateView(view: View) {
    let layout = view.layout
    let w = this.device.context.drawingBufferWidth
    let h = this.device.context.drawingBufferHeight
    view.x = (layout.x * w) || 0
    view.y = (layout.y * h) || 0
    view.width = (layout.width * w) || 0
    view.height = (layout.height * h) || 0
  }

  public presentViews() {
    this.device.setRenderTarget(null)
    this.spriteBatch.begin()
    for (let view of this.views) {
      if (!view.enabled || !view.target) {
        continue
      }
      this.spriteBatch
        .draw(view.target)
        .destination(view.x, view.y, view.width, view.height)
        .flip(false, true)
    }
    this.spriteBatch.end()
  }

  private stepHasBegun: boolean
  public beginStep(): Texture {
    if (this.stepHasBegun) {
      throw new Error('each beginStep() call must be paired with an endStep() call.')
    }
    this.stepHasBegun = true
    let view = this.view
    let needsTarget = !view.target || view.target.width !== view.width || view.target.height !== view.height

    if (view.steps.length === 1 && !view.target) {
      // no need for a render target. Render directly to backbuffer
      // TODO:
      this.device.viewportState = this.view
      this.device.scissorState = extend({ enable: true}, this.view)
    } else if (view.steps.length > 1 && needsTarget) {
      if (view.target) {
        this.releaseTarget(view.target)
      }
      view.target = this.acquireTarget({
        width: view.width,
        height: view.height,
        depthFormat: DepthFormat.DepthStencil,
      })
    }
    return view.target
  }

  public endStep(renderTarget?: Texture) {
    if (!this.stepHasBegun) {
      throw new Error('each beginStep() call must be paired with an endStep() call.')
    }
    this.stepHasBegun = false
    if (!renderTarget || renderTarget === this.view.target) {
      return
    }
    if (this.view.target) {
      this.releaseTarget(this.view.target)
    }
    this.view.target = renderTarget
  }
}
