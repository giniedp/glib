import { ContentLoader } from '@gglib/content'
import { GameEntityCollection, GameProvider } from '@gglib/ecs'
import { createDevice } from '@gglib/graphics'
import { CameraInfo, Renderer } from '@gglib/render'
import { GameLoop } from './GameLoop'
import { RenderQuery } from './RenderSystem'

export class BasicGame extends GameProvider {
  public loop: GameLoop
  public renderer: Renderer
  public renderQuery: RenderQuery
  public content: ContentLoader
  public scene = new GameEntityCollection()
  public camera: CameraInfo

  public constructor(canvas: HTMLCanvasElement) {
    super()
    const device = createDevice({ canvas })
    this.provide(this)
    this.provide(device)
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

    this.loop.onUpdate.add(() => this.update())
    this.loop.onDraw.add(() => this.draw())

    this.loop.run()
  }

  public stop() {
    this.loop.stop()
    this.destroy()
  }

  public update() {
    //
  }

  public draw() {
    if (this.camera) {
      this.renderQuery.update(this.scene.entities, this.camera)
      this.renderer.render(this.renderQuery)
    }
  }
}
