import {
  BlendState,
  CullState,
  DepthFormat,
  DepthState,
  Device,
  RenderTargetOptions,
  ScissorState,
  SpriteBatch,
  SpriteBatchBeginOptions,
  StencilState,
  Texture,
} from '@gglib/graphics'
import { Log } from '@gglib/utils'
import { Scene, SceneOutput, SceneView } from './Types'
import { UniformBinder } from './UniformBinder'

/**
 * @public
 */
export interface RenderTargetRegistry {
  frames: number
  target: Texture
  options: RenderTargetOptions
}

/**
 * A utility class for managing render targets and rendering scenes
 *
 * @public
 */
export class RenderManager {
  /**
   * The graphics device
   */
  public readonly device: Device
  /**
   * The shader uniform binder
   */
  public readonly binder: UniformBinder
  /**
   * The scene that is currently being rendered
   */
  public scene: Scene | null
  /**
   * The view that is currently being rendered
   */
  public view: SceneView | null
  /**
   * Collection of all registered scenes
   */
  // protected readonly scenes = new Map<any, Scene>()
  /**
   * SpriteBatch that is used to compose the results of all views into final image
   */
  protected readonly spriteBatch: SpriteBatch
  /**
   * Collection of render targets currently being unused
   */
  protected readonly freeTargets: RenderTargetRegistry[] = []
  /**
   * Collection of render targets currently being in use
   */
  protected readonly usedTargets: RenderTargetRegistry[] = []

  /**
   * Maximum life time (number of frames) of an unused render target
   */
  public keepAliveFrames = 1

  private get currentViewId() {
    return this.scene.views.indexOf(this.view)
  }

  private readonly sceneOutputs = new Map<Scene, SceneOutput[]>()
  private readonly toKill: RenderTargetRegistry[] = []
  private readonly toRender: Scene[] = []
  private readonly toPresent: Scene[] = []
  private readonly batchOptions: SpriteBatchBeginOptions = {
    depthState: DepthState.None,
    blendState: BlendState.Default,
    stencilState: StencilState.Default,
    scissorState: ScissorState.Default,
    cullState: CullState.CullNone,
  }

  constructor(device: Device) {
    this.device = device
    this.binder = new UniformBinder(device)
    this.spriteBatch = device.createSpriteBatch()
  }

  // /**
  //  * Gets a scene by its id
  //  *
  //  * @param id - The scene id
  //  */
  // public getScene(id: string | number) {
  //   return this.scenes.get(id)
  // }

  // /**
  //  * Adds a scene for rendering
  //  *
  //  * @param scene - The scene to be rendered
  //  */
  // public addScene(scene: Scene): Scene {
  //   if (scene.id == null) {
  //     throw new Error(`id is missing`)
  //   }
  //   if (this.scenes.has(scene.id)) {
  //     throw new Error(`id is already taken`)
  //   }
  //   if (scene.views == null) {
  //     scene.views = []
  //   }
  //   if (scene.views.length === 0) {
  //     scene.views.push({
  //       viewport: {
  //         type: 'normalized',
  //         x: 0,
  //         y: 0,
  //         width: 1,
  //         height: 1,
  //       },
  //     })
  //   }
  //   this.scenes.set(scene.id, scene)

  //   return scene
  // }

  /**
   * Releases resources that have been cached for the given scene
   */
  public releaseScene(scene: Scene) {
    let output: SceneOutput[]
    output = this.sceneOutputs.get(scene)
    if (output) {
      output.forEach((it) => this.releaseTarget(it.target))
      this.sceneOutputs.delete(scene)
    }
  }

  /**
   * Gets an existing render target with given options. Creates a new one if no such exists or is not free.
   */
  public acquireTarget(opts: RenderTargetOptions): Texture {
    const found = this.freeTargets.find((it) => RenderManager.compareTargetOptions(it.options, opts))
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
    Log.d('[Render.Manager]', 'create render target', opts)
    let target = this.device.createTexture2D(opts)
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
  public releaseTarget(target: Texture) {
    if (!target) {
      throw new Error('released target must not be null')
    }

    const found = this.usedTargets.find((it) => it.target === target)
    if (found) {
      // remove from used list
      let index = this.usedTargets.indexOf(found)
      this.usedTargets.splice(index, 1)
      found.frames = 0 // reset lifetime counter
      this.freeTargets.push(found)
      return
    }
    throw new Error('releaseTarget was called with a target that was not created by this manager.')
  }

  private static compareTargetOptions(a: RenderTargetOptions, b: RenderTargetOptions): boolean {
    return a.width === b.width && a.height === b.height && !!a.depthFormat === !!b.depthFormat
  }

  /**
   * Updates the management logic
   *
   * @remarks
   * Detects and destroys stale render targets.
   * This should be called once per frame and/or a sufficient value for `keepAliveFrames` property must be used.
   */
  public update() {
    this.toKill.length = 0
    for (const item of this.freeTargets) {
      item.frames += 1
      if (item.frames > this.keepAliveFrames) {
        this.toKill.push(item)
      }
    }
    for (const item of this.toKill) {
      const index = this.freeTargets.indexOf(item)
      this.freeTargets.splice(index, 1)
      Log.d('[Render.Manager]', 'destroy render target')
      item.target.destroy()
    }
  }

  /**
   * Takes an array of scenes, renders which are not disabled and presents all non-offset views on screen.
   */
  public render(scenes: Scene[]) {
    this.toRender.length = 0
    this.toPresent.length = 0
    this.device.resize()
    for (const scene of scenes) {
      if (!scene.disabled) {
        this.toRender.push(scene)
        if (!scene.offscreen) {
          this.toPresent.push(scene)
        }
      }
    }
    for (const scene of this.toRender) {
      this.renderScene(scene)
    }
    this.presentScenes(this.toPresent)
  }

  /**
   * Renders a scene regardless whether it is enabled or not
   *
   * @param scene - The scene to render
   * @param target - The render target
   *
   * @remarks
   * Runs the scene through each rendering step
   */
  public renderScene(scene: Scene, target?: Texture) {
    if (this.scene) {
      throw new Error('another scene is already rendering')
    }

    for (const view of scene.views) {
      if (view.disabled) {
        continue
      }

      const camera = view.camera || scene.camera
      if (camera) {
        this.binder.updateCamera(camera.world, camera.view, camera.projection)
      } else {
        this.binder.updateCamera()
      }

      this.updateViewport(scene, view, target)
      for (let step of scene.steps) {
        if (typeof step.setup === 'function') {
          this.scene = scene
          this.view = view
          step.setup(this)
        }
      }
      for (let step of scene.steps) {
        if (typeof step.render === 'function') {
          this.scene = scene
          this.view = view
          step.render(this)
        }
      }
      for (let step of scene.steps) {
        if (typeof step.cleanup === 'function') {
          this.scene = scene
          this.view = view
          step.cleanup(this)
        }
      }
    }
    this.scene = null
  }

  /**
   * Presents all scenes on the given texture.
   *
   * @remarks
   * Rendering results of all given scenes are rendered on the given texture.
   * Scenes without a rendering result are silently skipped.
   * The scenes are processed in given order and without filtering meaning that
   * disabled as well as offscreen scenes would also be presented
   * if they have a rendering result.
   *
   * @param scenes - the pre-rendered scenes to present
   * @param target - the render target or null to present on screen
   * @param batchOptions - the batch options to use
   */
  public presentScenes(scenes: Scene[], target?: Texture, batchOptions?: SpriteBatchBeginOptions): void {
    this.device.setRenderTarget(target)
    this.spriteBatch.begin(batchOptions || this.batchOptions)
    for (const scene of scenes) {
      const outputs = this.sceneOutputs.get(scene)
      if (!outputs || !outputs.length) {
        continue
      }
      for (const output of outputs) {
        if (output && output.target) {
          this.spriteBatch
            .draw(output.target)
            .source(0, 0, output.target.width, output.target.height)
            .flipY()
            .destination(output.x, output.y, output.width, output.height)
        }
      }
    }
    this.spriteBatch.end()
    this.device.setRenderTarget(null)
  }

  private stepHasBegun: boolean
  /**
   * begins a rendering step
   *
   * @remarks
   * `endStep()` must be called before calling `beginStep()` again.
   */
  public beginStep(): Texture {
    if (this.stepHasBegun) {
      throw new Error('each beginStep() call must be paired with an endStep() call.')
    }
    this.stepHasBegun = true
    const scene = this.scene
    const outputs = this.sceneOutputs.get(scene)
    const output = outputs[this.currentViewId]
    let needsTarget = !output.target || output.target.width !== output.width || output.target.height !== output.height

    // TODO: review this decision
    if (scene.steps.length === 1 && !output.target) {
      // if only one rendering step is active, we assume a basic
      // ForwarRendering technique that goes directly into the backbuffer
      this.device.viewportState = output
      this.device.scissorState = {
        enable: true,
        ...output,
      }
    } else if (scene.steps.length > 1 && needsTarget) {
      // otherwise we assume some kind of rendering stack that
      // renders into a render target first which will be combined later
      if (output.target) {
        this.releaseTarget(output.target)
      }
      output.target = this.acquireTarget({
        width: output.width,
        height: output.height,
        depthFormat: DepthFormat.DepthStencil,
      })
    }
    return output.target
  }

  /**
   * Ends a rendering step
   *
   * @param renderTarget - The rendered image
   *
   * @remarks
   * `beginStep()` must have been called before calling `endStep()`
   */
  public endStep(renderTarget?: Texture) {
    if (!this.stepHasBegun) {
      throw new Error('each beginStep() call must be paired with an endStep() call.')
    }
    this.stepHasBegun = false
    const outputs = this.sceneOutputs.get(this.scene)
    const output = outputs[this.currentViewId]
    if (!renderTarget || renderTarget === output.target) {
      return
    }
    if (output.target) {
      this.releaseTarget(output.target)
    }
    output.target = renderTarget
  }

  private updateViewport(scene: Scene, view: SceneView, target?: Texture) {
    const viewId = scene.views.indexOf(view)
    const outputs: SceneOutput[] = this.sceneOutputs.has(scene) ? this.sceneOutputs.get(scene) : []
    const output = outputs[viewId] || {}

    outputs[viewId] = output
    this.sceneOutputs.set(scene, outputs)

    const w = target ? target.width : this.device.drawingBufferWidth
    const h = target ? target.height : this.device.drawingBufferHeight
    const viewport = view.viewport
    if (!viewport) {
      output.x = 0
      output.y = 0
      output.width = w
      output.height = h
    } else if (viewport.type === 'normalized') {
      output.x = viewport.x * w
      output.y = viewport.y * h
      output.width = viewport.width * w
      output.height = viewport.height * h
    } else {
      output.x = viewport.x
      output.y = viewport.y
      output.width = viewport.width
      output.height = viewport.height
    }
    if (viewport) {
      viewport.aspect = output.width / output.height
    }

    return output
  }
}
