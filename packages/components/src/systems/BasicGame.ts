import { ContentLoader } from '@gglib/content'
import { GameEntityCollection, GameProvider } from '@gglib/ecs'
import { createDevice, Device } from '@gglib/graphics'
import { CameraInfo, Renderer } from '@gglib/render'
import { GameLoop, LoopTime } from './GameLoop'
import { RenderQuery } from './RenderSystem'
import { Mat4 } from '@gglib/math'

export class BasicGame extends GameProvider {
  public loop: GameLoop
  public renderer: Renderer
  public renderQuery: RenderQuery
  public content: ContentLoader
  public scene = new GameEntityCollection()
  public camera: CameraInfo = {
    world: Mat4.createIdentity(),
    view: Mat4.createIdentity(),
    projection: Mat4.createIdentity(),
  }

  public constructor(canvas: HTMLCanvasElement) {
    super()
    const device = createDevice({ canvas })
    this.provide(this)
    this.provide(device, Device)
    this.provide(new Renderer(device))
    this.provide(new ContentLoader(device))
    this.addSystem(new GameLoop({ autostart: false }))

    this.loop = this.get(GameLoop)
    this.renderQuery = new RenderQuery()
    this.renderer = this.get(Renderer)
    this.content = this.get(ContentLoader)
  }

  public run() {
    this.initialize()
    this.scene.initialize(this)
    this.scene.activate()

    this.loop.onUpdate.add((time) => this.update(time))
    this.loop.onDraw.add((time) => this.draw(time))

    this.loop.run()
  }

  public stop() {
    this.loop.stop()
    this.destroy()
  }

  public update(time: LoopTime) {
    //
  }

  public draw(time: LoopTime) {
    if (this.camera) {
      this.renderQuery.update(this.scene.entities, this.camera)
      this.renderer.render(this.renderQuery)
    }
  }
}
