import {
  BlendState,
  CullState,
  DepthFormat,
  DepthState,
  Device,
  RenderTargetOptions,
  ScissorState,
  SpriteBatch,
  StencilState,
  Texture,
} from '@gglib/graphics'
import { Log } from '@gglib/utils'
import { Binder } from './Binder'
import { Scene, SceneOutput } from './Types'

/**
 * @public
 */
export interface RenderTargetRegistry {
  frames: number
  target: Texture
  options: RenderTargetOptions
}

/**
 * @public
 */
export class Manager {

  /**
   * The graphics device
   */
  public readonly device: Device
  /**
   * The shader uniform binder
   */
  public readonly binder: Binder
  /**
   * Collection of all registered scenes
   */
  public readonly scenes = new Map<any, Scene>()
  /**
   * The scene that is currently being rendered
   */
  public scene: Scene
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

  private readonly sceneOutputs = new Map<any, SceneOutput>()
  private readonly toKill: RenderTargetRegistry[] = []
  private readonly toRender: Scene[] = []

  constructor(device: Device) {
    this.device = device
    this.binder = new Binder(device)
    this.spriteBatch = device.createSpriteBatch()
  }

  /**
   * Adds a scene for rendering
   *
   * @param scene - The scene to be rendered
   */
  public addScene(scene: Scene) {
    if (scene.id == null) {
      throw new Error(`id is missing`)
    }
    if (this.scenes.has(scene.id)) {
      throw new Error(`id is already taken`)
    }
    if (scene.enabled == null) {
      scene.enabled = true
    }
    if (scene.viewport == null) {
      scene.viewport = { type: 'normalized', x: 0, y: 0, width: 1, height: 1 }
    }
    this.scenes.set(scene.id, scene)
  }

  /**
   * Removes a scene
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
   * Gets an existing render target with given options. Creates a new one if no such exists or is not free.
   */
  public acquireTarget(opts: RenderTargetOptions): Texture {
    const found = this.freeTargets.find((it) => Manager.compareTargetOptions(it.options, opts))
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
   * Updates lifetime and detects and destroys outdated render targets.
   * This should be called once per frame
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
   * Renders all registered and enabled scenes and presents them on screen
   *
   * @remarks
   * Will only render scenes that don't have a custom tag
   */
  public render() {
    this.toRender.length = 0
    this.device.resize()
    this.scenes.forEach((scene) => {
      if (scene.enabled && scene.tag == null) {
        this.toRender.push(scene)
      }
    })
    this.renderScenes(this.toRender, null)
  }

  /**
   * Renders each scene and the presents all results in the given texture
   */
  public renderScenes(scenes: Scene[], target?: Texture) {
    for (const scene of scenes) {
      this.renderScene(scene, target)
    }
    this.presentScenes(scenes, target)
  }

  /**
   * Renders a scene regardless whether it is enabled or not
   *
   * @param scene - The scene to render
   */
  public renderScene(scene: Scene, target?: Texture) {
    this.updateOutput(scene, target)
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
  }

  /**
   * Presents all scenes on the given texture
   */
  public presentScenes(scenes: Scene[], target?: Texture): void {
    this.device.setRenderTarget(target)
    // this.device.clear(0xFF000000, 1)
    this.spriteBatch.begin({
      depthState: DepthState.None,
      blendState: BlendState.Default,
      stencilState: StencilState.Default,
      scissorState: ScissorState.Default,
      cullState: CullState.CullNone,
    })

    for (const scene of scenes) {
      const output = this.sceneOutputs.get(scene.id)
      if (!output || !output.target) {
        continue
      }
      this.spriteBatch
        .draw(output.target)
        .destination(output.x, output.y, output.width, output.height)
        .flip(false, true)
    }
    this.spriteBatch.end()
    this.device.setRenderTarget(null)
  }

  public resolveBounds(scene: Scene, target?: Texture) {
    const output = this.updateOutput(scene, target)
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
    const view = this.scene
    const output = this.sceneOutputs.get(view.id)
    let needsTarget = !output.target || output.target.width !== output.width || output.target.height !== output.height

    if (view.steps.length === 1 && !output.target) {
      // no need for a render target. Render directly to backbuffer
      // TODO:
      this.device.viewportState = output
      this.device.scissorState = {
        enable: true,
        ...output,
      }
    } else if (view.steps.length > 1 && needsTarget) {
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

  private updateOutput(scene: Scene, target?: Texture) {
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

    this.sceneOutputs.set(scene.id, output)
    return output
  }
}
