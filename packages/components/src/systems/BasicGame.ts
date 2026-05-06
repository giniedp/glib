import { ContentLoader } from '@gglib/content'
import { CreateEntityOptions, GameEntity, GameWorld, GetComponent } from '@gglib/ecs'
import { createDevice, type CreateDeviceOptions, Device } from '@gglib/graphics'
import { RenderChannel, Renderer, RenderView } from '@gglib/render'
import { SceneRootComponent, TransformComponent } from '../components'
import { BehaviorSystem } from './BehaviorSystem'
import { BoundsUpdateSystem } from './BoundsUpdateSystem'
import { GameLoop } from './GameLoop'
import { SceneSystem } from './SceneSystem'
import { TimeSystem } from './TimeSystem'
import { TweenSystem } from './TweenSystem'

export class BasicGame {
  public loop: GameLoop
  public device: Device
  public renderer: Renderer
  public content: ContentLoader
  public world: GameWorld
  public scene: GameEntity
  public view: RenderView

  public constructor(options: CreateDeviceOptions) {
    this.device = createDevice(options)
    this.world = new GameWorld()
    this.world.addSystem(this, BasicGame)
    this.world.addSystem(this.device, Device)
    this.world.addSystem(new GameLoop({ autostart: false }))
    this.world.addSystem(new ContentLoader(this.device))
    this.world.addSystem(new TimeSystem())
    this.world.addSystem(new TweenSystem())
    this.world.addSystem(new BehaviorSystem())
    this.world.addSystem(new BoundsUpdateSystem())
    this.world.addSystem(new SceneSystem(this.world))
    this.world.addSystem(new Renderer(this.device))

    this.loop = this.world.getSystem(GameLoop)
    this.loop.onUpdate.add((time) => this.update(time.timeMs, time.deltaMs))
    this.loop.onDraw.add((time) => this.render(time.timeMs, time.deltaMs))

    this.renderer = this.world.getSystem(Renderer)
    this.content = this.world.getSystem(ContentLoader)

    this.scene = this.createScene({ name: 'Scene' })
    this.view = this.renderer.addView({
      name: 'Main View',
      present: RenderChannel.Color,
    })
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
    this.renderer.update(time)
    // this.scene.getTransform<TransformComponent>().propagateUpdates(false, true)
  }

  public render(time: number, dt: number) {
    const scene = this.scene?.component(SceneRootComponent, GetComponent.Optional)
    if (scene) {
      this.renderer.render(scene)
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
