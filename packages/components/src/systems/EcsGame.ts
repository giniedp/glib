import { ContentLoader } from '@gglib/content'
import { CreateEntityOptions, GameEntity, GameQuery, GameWorld } from '@gglib/ecs'
import { createDevice, type CreateDeviceOptions, Device } from '@gglib/graphics'
import { SpaceBasis } from '@gglib/math'
import { GeometryPass, RenderChannel, Renderer, RenderView } from '@gglib/render'
import { EventEmitter } from '@gglib/utils'
import { SceneComponent, TransformComponent } from '../components'
import { BehaviorSystem } from './BehaviorSystem'
import { BoundsUpdateSystem } from './BoundsUpdateSystem'
import { GameLoop } from './GameLoop'
import { SceneSystem } from './SceneSystem'
import { TimeSystem } from './TimeSystem'
import { TweenSystem } from './TweenSystem'

export class EcsGame {
  /**
   * The graphics device
   */
  public readonly device: Device

  /**
   * The game world
   */
  public readonly world: GameWorld

  /**
   * Emits game events
   */
  public readonly events = new EventEmitter()

  /**
   * The renderer system
   */
  public renderer: Renderer

  /**
   * The content loader system
   */
  public content: ContentLoader

  /**
   * The game loop system
   */
  public loop: GameLoop

  /**
   * The main render view
   */
  public view: RenderView

  /**
   * The root scene entity
   */
  public scene: GameEntity

  /**
   * Query yielding all active scene root entities
   */
  public sceneQuery: GameQuery

  /**
   * Resolves once the game has fully booted and the loop is running
   */
  public get ready(): Promise<void> {
    return this.booted ?? Promise.reject(new Error('run() has not been called'))
  }

  private booted: Promise<void> | null = null
  private destroyed = false

  public constructor(options: CreateDeviceOptions) {
    this.device = createDevice(options)

    this.world = new GameWorld()
    this.world.addSystem(this, EcsGame)
    this.world.addSystem(this.device, Device)

    this.onCreate()
    this.createEssentialSystems()

    this.sceneQuery ||= this.world.query({ scope: 'active', required: [SceneComponent] })

    this.view ||= this.renderer.createView({
      name: 'Main View',
      present: RenderChannel.Color,
    })

    this.scene ||= this.world.createEntity({
      name: 'Scene',
      transform: new TransformComponent(),
      components: [new SceneComponent({ views: [this.view] })],
    })
  }

  /**
   * Called first during {@link EcsGame.run}. Override to register custom
   * systems before the defaults are installed.
   */
  protected onCreate(): void {
    //
  }

  protected createEssentialSystems() {
    if (!this.world.hasSystem(SpaceBasis)) {
      this.world.addSystem(SpaceBasis.Y_UP_NEG_Z)
    }

    if (!this.world.hasSystem(GameLoop)) {
      this.world.addSystem(new GameLoop())
    }

    if (!this.world.hasSystem(ContentLoader)) {
      this.world.addSystem(new ContentLoader(this.device))
    }

    if (!this.world.hasSystem(TimeSystem)) {
      this.world.addSystem(new TimeSystem())
    }

    if (!this.world.hasSystem(TweenSystem)) {
      this.world.addSystem(new TweenSystem())
    }

    if (!this.world.hasSystem(BehaviorSystem)) {
      this.world.addSystem(new BehaviorSystem())
    }

    if (!this.world.hasSystem(SceneSystem)) {
      this.world.addSystem(new SceneSystem(this.world))
    }

    if (!this.world.hasSystem(BoundsUpdateSystem)) {
      this.world.addSystem(new BoundsUpdateSystem())
    }

    if (!this.world.hasSystem(Renderer)) {
      this.world.addSystem(
        new Renderer(this.device, {
          pipeline: { passes: [new GeometryPass()] },
        }),
      )
    }

    this.renderer ||= this.world.getSystem(Renderer)
    this.content ||= this.world.getSystem(ContentLoader)
    this.loop ||= this.world.getSystem(GameLoop)
  }

  /**
   * Called after the world has been initialized and the GPU is ready.
   * Override to create initial entities or perform setup that requires
   * a live device.
   */
  protected onInitialize(): void {
    //
  }

  /**
   * Called after {@link EcsGame.onInitialize} and awaited before the
   * game loop starts. Override to load content asynchronously.
   */
  protected onLoadContent(): Promise<void> | void {
    //
  }

  /**
   * Called when content needs to be unloaded
   */
  protected onUnloadContent(): Promise<void> | void {
    //
  }

  /**
   * Called once after intialze and load but before the first update
   */
  protected onBeginRun(): void {
    this.world.initialize()
    this.scene.activate()
  }

  /**
   * Called when the game was stopped but before content unload
   */
  protected onEndRun(): void {
    //
  }

  /**
   * Called  before `onUpdate` and can return `false` to skip next `onUpdate` call
   */
  protected onBeginUpdate(time: number, dt: number): boolean | void {
    return true
  }

  /**
   * Called every update tick after the world has been updated.
   */
  protected onUpdate(time: number, dt: number): void {
    //
  }

  /**
   *
   */
  protected onEndUpdate(time: number, dt: number): void {
    this.world.update(time, dt)
  }

  /**
   * Called  before `onDraw` and can return `false` to skip next `onDraw` call
   */
  protected onBeginDraw(time: number, dt: number): boolean | void {
    return true
  }

  /**
   * Called every draw tick to render all active scenes into their output targets
   */
  protected onDraw(time: number, dt: number): void {
    this.world.render(time, dt)
    this.renderer.update(time)
    for (const entity of this.sceneQuery) {
      const scene = entity.component(SceneComponent)
      for (const view of scene.views) {
        this.renderer.renderSceneView(scene, view)
      }
    }
  }

  /**
   * Called after `onDraw` to present all rendered scene outputs
   */
  protected onEndDraw(time: number, dt: number): void {
    for (const entity of this.sceneQuery) {
      const scene = entity.component(SceneComponent)
      this.renderer.present(scene.views, scene.output)
    }
  }

  public async run() {
    if (this.booted) {
      return this.booted
    }

    this.booted = this.boot()
    return this.booted
  }

  public stop() {
    if (!this.loop.isRunning) {
      return
    }
    this.loop.stop()
    this.onEndRun()
  }

  public destroy(): void {
    this.destroyed = true
    this.stop()
    this.onUnloadContent()
    this.world.destroy()
  }

  public createEntity(options: CreateEntityOptions) {
    options.transform ||= new TransformComponent()
    return this.world.createEntity(options)
  }

  private async boot() {
    await this.device.ready
    if (this.destroyed) {
      return
    }

    this.onInitialize()
    await this.onLoadContent()
    if (this.destroyed) {
      return
    }

    this.onBeginRun()
    this.loop.run()
    this.loop.onUpdate.add((time) => this.handleUpdate(time.timeMs, time.deltaMs))
    this.loop.onDraw.add((time) => this.handleRender(time.timeMs, time.deltaMs))
  }

  private handleUpdate(time: number, dt: number) {
    console.assert(this.device.isReady, 'device must be ready')
    if (this.onBeginUpdate(time, dt) !== false) {
      this.onUpdate(time, dt)
      this.onEndUpdate(time, dt)
    }
  }

  private handleRender(time: number, dt: number) {
    console.assert(this.device.isReady, 'device must be ready')
    if (this.onBeginDraw(time, dt) !== false) {
      this.onDraw(time, dt)
      this.onEndDraw(time, dt)
    }
  }
}
