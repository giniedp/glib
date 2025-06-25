import {
  BlendState,
  CullState,
  DepthState,
  Device,
  RenderTargetOptions,
  ScissorState,
  SpriteBatch,
  SpriteBatchBeginOptions,
  StencilState,
  TextureImage,
} from '@gglib/graphics'
import { BasicRenderPass } from './BasicRenderPass'
import { RenderContext } from './RenderContext'
import { RenderTargetManager } from './RenderTargetManager'
import { RenderPass, SceneComposition, SceneView, ViewportArea } from './Types'
import { UniformBinder } from './UniformBinder'

/**
 * A utility class to render compositions on screen or render targets.
 *
 * @public
 * @remarks
 * The renderer does not perform any culling or filtering of the rendered items. This is left to callers of the renderer.
 */
export class Renderer {
  public static compareOrder(a: { order?: number }, b: { order?: number }) {
    return (a.order ?? 0) - (b.order ?? 0)
  }

  /**
   * The graphics device
   */
  public device: Device

  /**
   * Common uniforms (e.g. time and camera matrices) that can be updated and passed to the shaders
   */
  public uniforms: UniformBinder

  /**
   * Default rendering steps, being used for compositions without own render steps definition
   */
  public steps: RenderPass[] = [new BasicRenderPass()]

  /**
   * Default viewport area, being used for compositions without own viewport definition
   */
  public viewport: ViewportArea = {
    x: 0,
    y: 0,
    width: 1,
    height: 1,
  }

  /**
   * The intial, default render target is created with these options
   */
  public targetOptions: RenderTargetOptions = {
    format: 'RGBA8_UNORM',
    depthFormat: 'DepthStencil',
  }

  /**
   * SpriteBatch that is used to compose the results of all views into final image
   */
  protected spriteBatch: SpriteBatch

  public targets: RenderTargetManager

  /**
   * Indicates whether the views, subviews and items should be sorted by their order property before rendering
   */
  public autosort: boolean = true

  protected readonly contexts = new Map<SceneComposition, Map<SceneView, RenderContext>>()
  protected readonly toRender: SceneComposition[] = []
  protected readonly toPresent: SceneComposition[] = []
  protected readonly batchOptions: SpriteBatchBeginOptions = {
    depthState: DepthState.None,
    blendState: BlendState.Default,
    stencilState: StencilState.Default,
    scissorState: ScissorState.Default,
    cullState: CullState.CullNone,
  }

  public constructor(device: Device) {
    this.device = device
    this.uniforms = new UniformBinder()
    this.spriteBatch = device.createSpriteBatch()
    this.targets = new RenderTargetManager(this.device)
  }

  /**
   * Releases resources that have been cached for the given scene
   */
  public release(scene: SceneComposition) {
    const toRelease = this.contexts.get(scene)
    this.contexts.delete(scene)
    if (!toRelease) {
      return
    }
    toRelease.forEach((ctx) => {
      ctx.dispose()
    })
  }

  private prepareContext(scene: SceneComposition, view: SceneView) {
    if (!this.contexts.has(scene)) {
      this.contexts.set(scene, new Map())
    }
    if (!this.contexts.get(scene).has(view)) {
      this.contexts.get(scene).set(view, new RenderContext(this))
    }
    const context = this.contexts.get(scene).get(view)
    context.prepare(scene, view)
    return context
  }

  /**
   * Takes an array of scenes, renders which are not disabled and presents all non-offset views on screen.
   */
  public render(...scenes: SceneComposition[]) {
    this.toRender.length = 0
    this.toPresent.length = 0
    this.device.resize()
    this.targets.update()

    for (const item of scenes) {
      if (item.disabled) {
        continue
      }
      this.toRender.push(item)
      if (!item.muted) {
        this.toPresent.push(item)
      }
    }

    if (this.autosort) {
      this.toRender.sort(Renderer.compareOrder)
      this.toPresent.sort(Renderer.compareOrder)
      for (const it of this.toRender) {
        if (it.items) {
          it.items.sort(Renderer.compareOrder)
        }
      }
    }

    for (const it of this.toRender) {
      this.renderScene(it)
    }
    this.present(this.toPresent)
  }

  /**
   * Renders a single scene into its render target
   *
   * @remarks
   * - Runs the scene through each rendering step
   * - Does NOT present the result on screen, use `render()` for that
   */
  public renderScene(scene: SceneComposition) {
    if (!scene.views) {
      scene.views = [
        {
          viewport: {
            x: 0,
            y: 0,
            width: 1,
            height: 1,
          },
        },
      ]
    }

    for (const view of scene.views) {
      if (view.disabled) {
        continue
      }

      const context = this.prepareContext(scene, view)
      const camera = context.camera
      if (!camera) {
        continue
      }

      const mask = camera.layerMask ?? -1 // all layers
      for (const it of context.items) {
        const layer = it.layer ?? 1 // default layer
        it.hidden = (mask & layer) === 0
      }

      const steps = context.steps
      for (let step of steps) {
        if (typeof step.setup === 'function') {
          step.setup(context)
        }
      }
      for (let step of steps) {
        if (typeof step.render === 'function') {
          step.render(context)
        }
      }
      for (let step of steps) {
        if (typeof step.cleanup === 'function') {
          step.cleanup(context)
        }
      }
    }
  }

  /**
   * Presents all rendered compositions on screen or given render target
   *
   * @remarks
   * - Rendering results of all given compositions are rendered on the given texture.
   * - Compositions without a result are silently skipped.
   * - No filtering is performed, meaning even disabled The scenes are processed in given order and without filtering meaning that
   * disabled as well as offscreen scenes would also be presented
   * if they have a rendering result.
   *
   * @param scenes - the rendered compositions to present
   * @param target - the output render target. If missing, output goes to screen.
   * @param batchOptions - the batch options to use
   */
  public present(scenes: SceneComposition[], target?: TextureImage, batchOptions?: SpriteBatchBeginOptions): void {
    this.device.setRenderTarget(target)
    this.spriteBatch.begin(batchOptions || this.batchOptions)
    for (const scene of scenes) {
      const outputs = this.contexts.get(scene)
      if (!outputs || !outputs.size) {
        continue
      }

      for (const [_, ctx] of outputs) {
        const target = ctx.channels[ctx.channel]
        if (!target) {
          continue
        }
        const rect = ctx.viewport
        this.spriteBatch
          .draw(target)
          .source(0, 0, target.width, target.height)
          .flipY()
          .destination(rect.x, rect.y, rect.width, rect.height)
      }
    }
    this.spriteBatch.end()
    this.device.setRenderTarget(null)
  }

  public dispose() {
    for (const [_, map] of this.contexts) {
      for (const [_, ctx] of map) {
        ctx.dispose()
      }
    }
    this.contexts.clear()
    this.spriteBatch.dispose()
    this.targets.dispose()
  }
}
