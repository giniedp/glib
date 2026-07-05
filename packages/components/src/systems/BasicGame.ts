import { ContentLoader } from '@gglib/content'
import { CreateEntityOptions, GameEntity, GameQuery, GameWorld } from '@gglib/ecs'
import { createDevice, type CreateDeviceOptions, Device } from '@gglib/graphics'
import { SpaceBasis } from '@gglib/math'
import { RenderChannel, Renderer, RenderView } from '@gglib/render'
import { SceneRootComponent, TransformComponent } from '../components'
import { BehaviorSystem } from './BehaviorSystem'
import { BoundsUpdateSystem } from './BoundsUpdateSystem'
import { GameLoop } from './GameLoop'
import { SceneSystem } from './SceneSystem'
import { TimeSystem } from './TimeSystem'
import { TweenSystem } from './TweenSystem'
import { EventEmitter } from '@gglib/utils'

export class BasicGame {
  public device: Device
  public renderer: Renderer
  public content: ContentLoader
  public world: GameWorld
  public scene: GameEntity
  public view: RenderView
  public loop: GameLoop
  public events = new EventEmitter()

  public sceneQuery: GameQuery
  public constructor(options: CreateDeviceOptions) {
    this.device = createDevice(options)

    this.world = new GameWorld()
    this.world.addSystem(this, BasicGame)
    this.world.addSystem(this.device, Device)

    this.createSystems()

    if (!this.world.hasSystem(SpaceBasis)) {
      this.world.addSystem(SpaceBasis.Y_UP_NEG_Z)
    }
    if (!this.world.hasSystem(GameLoop)) {
      this.world.addSystem(new GameLoop({ autostart: false }))
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
      this.world.addSystem(new Renderer(this.device))
    }

    this.renderer = this.world.getSystem(Renderer)
    this.content = this.world.getSystem(ContentLoader)
    this.sceneQuery = this.world.query({ scope: 'active', required: [SceneRootComponent] })

    this.loop = this.world.getSystem(GameLoop)
    this.loop.onUpdate.add((time) => this.update(time.timeMs, time.deltaMs))
    this.loop.onDraw.add((time) => this.render(time.timeMs, time.deltaMs))

    this.scene = this.createScene({ name: 'Scene' })
    this.view = this.renderer.createView({
      name: 'Main View',
      present: RenderChannel.Color,
    })
    this.scene.component(SceneRootComponent).views.push(this.view)
  }

  protected createSystems() {
    // override to add custom systems
  }

  public async run() {
    await this.device.ready
    this.loop.run()
    this.initialize()
  }

  public initialize(): void {
    this.world.initilize()
  }

  public update(time: number, dt: number) {
    this.world.update(time, dt)
  }

  public render(time: number, dt: number) {
    this.world.render(time, dt)
    this.renderer.update(time)
    for (const entity of this.sceneQuery) {
      this.renderer.render(entity.component(SceneRootComponent))
    }
  }

  public stop() {
    this.loop.stop()
  }

  public destroy(): void {
    this.stop()
    this.world.destroy()
  }

  public createEntity(options: CreateEntityOptions) {
    options.transform ||= new TransformComponent()
    return this.world.createEntity(options)
  }

  public createScene(options: CreateEntityOptions) {
    options.components ||= []
    options.transform ||= new TransformComponent()
    if (!options.components.some((c) => c instanceof SceneRootComponent)) {
      options.components.push(new SceneRootComponent())
    }
    return this.world.createEntity(options)
  }
}
