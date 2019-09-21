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
import { Scene, SceneOutput } from './Types'
import { UniformBinder } from './UniformBinder'

/**
 * @public
 */
export interface RenderTargetRegistry {
  frames: number
  target: Texture
  options: RenderTargetOptions
}

function pushIfEnabled(this: Scene[], scene: Scene) {
  if (!scene.disabled) {
    this.push(scene)
  }
}

function compareSortKey(a: Scene, b: Scene) {
  return a.sortKey < b.sortKey ? -1 : +1
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
   * Collection of all registered scenes
   */
  protected readonly scenes = new Map<any, Scene>()
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

  private readonly sceneOutputs = new Map<any, SceneOutput>()
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

  /**
   * Gets a scene by its id
   *
   * @param id - The scene id
   */
  public getScene(id: string | number) {
    return this.scenes.get(id)
  }

  /**
   * Adds a scene for rendering
   *
   * @param scene - The scene to be rendered
   */
  public addScene(scene: Scene): Scene {
    if (scene.id == null) {
      throw new Error(`id is missing`)
    }
    if (this.scenes.has(scene.id)) {
      throw new Error(`id is already taken`)
    }
    if (scene.viewport == null) {
      scene.viewport = { type: 'normalized', x: 0, y: 0, width: 1, height: 1 }
    }
    this.scenes.set(scene.id, scene)

    return scene
  }

  /**
   * Removes a scene and releases associated resources
   *
   * @param idOrScene - The scene or its id to be removed
   */
  public removeScene(idOrScene: string | number | Scene) {
    let scene = idOrScene as Scene
    let output: SceneOutput
    if (typeof idOrScene === 'number' || typeof idOrScene === 'string') {
      scene = this.scenes.get(idOrScene)
      output = this.sceneOutputs.get(idOrScene)
    } else {
      output = this.sceneOutputs.get(scene.id)
    }
    if (output) {
      this.releaseTarget(output.target)
      this.sceneOutputs.delete(scene.id)
    }
    if (scene) {
      this.scenes.delete(scene.id)
    }
  }

  /**
   * Iterates through all scenes calling the callback
   *
   * @param fn - the callback to call for each scene
   */
  public eachScene(fn: (scene: Scene) => void, thisArg: any = this) {
    this.scenes.forEach(fn, thisArg)
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
    return (a.width === b.width) && (a.height === b.height) && (!!a.depthFormat === !!b.depthFormat)
  }

  /**
   * Updates the management logic
   *
   * @remarks
   * Detects and destroys stale render targets.
   * This should be called once per frame and/or a sufficient value for {@link keepAliveFrames} property must be used.
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
   * Detects active scenes sorts by priority and renders them all. Presents results on screen.
   *
   * @remarks
   * Will only render scenes that don't have a custom tag
   */
  public render() {
    this.toRender.length = 0
    this.toPresent.length = 0
    this.device.resize()
    this.getEnabledScenes(this.toRender)
    for (const scene of this.toRender) {
      this.renderScene(scene)
      if (!scene.offscreen) {
        this.toPresent.push(scene)
      }
    }
    this.presentScenes(this.toPresent)
  }

  /**
   * Gets all enabled scenes sorted by their key
   *
   * @param out - the array to collect into
   */
  public getEnabledScenes(out: Scene[]) {
    this.scenes.forEach(pushIfEnabled, out)
    out.sort(compareSortKey)
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

    const camera = scene.camera
    if (camera) {
      this.binder.updateCamera(camera.world, camera.view, camera.projection)
    } else {
      this.binder.updateCamera()
    }
    this.updateViewport(scene, target)
    for (let step of scene.steps) {
      if (step.setup) {
        this.scene = scene
        step.setup(this)
      }
    }
    for (let step of scene.steps) {
      if (step.render) {
        this.scene = scene
        step.render(this)
      }
    }
    for (let step of scene.steps) {
      if (step.cleanup) {
        this.scene = scene
        step.cleanup(this)
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
      const output = this.sceneOutputs.get(scene.id)
      if (output && output.target) {
        this.spriteBatch
          .draw(output.target)
          .source(0, 0, output.target.width, output.target.height)
          .flipY()
          .destination(output.x, output.y, output.width, output.height)
      }
    }
    this.spriteBatch.end()
    this.device.setRenderTarget(null)
  }

  public resolveLayout(scene: Scene, target?: Texture) {
    const output = this.updateViewport(scene, target)
    return {
      x: output.x,
      y: output.y,
      width: output.width,
      height: output.height,
      aspect: output.width / output.height,
    }
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
    const output = this.sceneOutputs.get(scene.id)
    let needsTarget = !output.target || output.target.width !== output.width || output.target.height !== output.height

    if (scene.steps.length === 1 && !output.target) {
      // no need for a render target. Render directly to backbuffer
      // TODO:
      this.device.viewportState = output
      this.device.scissorState = {
        enable: true,
        ...output,
      }
    } else if (scene.steps.length > 1 && needsTarget) {
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
    const output = this.sceneOutputs.get(this.scene.id)
    if (!renderTarget || renderTarget === output.target) {
      return
    }
    if (output.target) {
      this.releaseTarget(output.target)
    }
    output.target = renderTarget
  }

  private updateViewport(scene: Scene, target?: Texture) {
    const output: SceneOutput = this.sceneOutputs.has(scene.id)
      ? this.sceneOutputs.get(scene.id)
      : {}

    const w = target ? target.width : this.device.context.drawingBufferWidth
    const h = target ? target.height : this.device.context.drawingBufferHeight
    const viewport = scene.viewport
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

    this.sceneOutputs.set(scene.id, output)
    return output
  }
}
