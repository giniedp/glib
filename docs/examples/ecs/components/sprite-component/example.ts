import {
  CameraComponent,
  createEntity,
  GameLoop,
  OrthographicCameraComponent,
  RenderQuery,
  SpriteComponent,
} from '@gglib/components'
import { ContentLoader } from '@gglib/content'
import { GameEntityCollection, GameProvider } from '@gglib/ecs'
import { BlendState, createDevice } from '@gglib/graphics'
import {} from '@gglib/loaders'
import { BasicRenderPass, Renderer } from '@gglib/render'
import * as TweakUi from 'tweak-ui'

class Game extends GameProvider {
  public loop: GameLoop
  public renderer: Renderer
  public renderQuery: RenderQuery
  public content: ContentLoader

  public scene = new GameEntityCollection()
  public camera: CameraComponent
  public sprite: SpriteComponent

  // 21/9 aspect ratio with 160 units in width
  // and 90 units in height
  public width = 160
  public height = 90

  public constructor(canvas: HTMLCanvasElement) {
    super()

    const device = createDevice({ canvas })
    this.provide(this)
    this.provide(device)
    this.provide(new Renderer(device))
    this.provide(new ContentLoader(device))
    this.addSystem(new GameLoop({ autostart: false }))

    this.loop = this.get(GameLoop)
    this.content = this.get(ContentLoader)
    this.renderer = this.get(Renderer)
    this.renderQuery = new RenderQuery()

    this.createEntity()
    this.createCamera()
  }

  private createEntity() {
    this.sprite = new SpriteComponent()
    const entity = createEntity({
      components: [this.sprite],
    })
    this.scene.add(entity)
  }

  private createCamera() {
    const entity = createEntity({
      name: 'camera',
      components: [
        new OrthographicCameraComponent({
          width: this.width / 2,
          height: this.height / 2,
          near: 0,
          far: 100,
        }),
      ],
    })
    this.camera = entity.component(OrthographicCameraComponent)
    this.scene.add(entity)
  }

  public run() {
    this.initialize()

    this.scene.initialize(this)
    this.scene.activate()

    this.loop.onUpdate.add(this.update)
    this.loop.onDraw.add(this.draw)

    this.load()
    this.loop.run()
    return () => {
      this.loop.stop()
      this.destroy()
    }
  }

  public update = () => {
    this.sprite.unitPixels = this.renderer.device.drawingBufferHeight / this.height
  }

  public draw = () => {
    this.renderQuery.update(this.scene.entities, this.camera)
    this.renderer.render(this.renderQuery)
  }

  public async load() {
    const renderStep = this.renderer.steps[0] as BasicRenderPass
    renderStep.blendState = BlendState.AlphaBlend
    renderStep.clearColor = 0xff2e2620

    this.sprite.width = 45
    this.sprite.height = 45
    this.sprite.pivotX = 0.5
    this.sprite.pivotY = 0.5
    this.sprite.texture = await this.content.loadTexture('/assets/textures/puzzle/interface_sheet.png')
    this.sprite.source = {
      x: 528,
      y: 374,
      width: 128,
      height: 128,
    }
    this.sprite.slice = {
      top: 24,
      right: 24,
      bottom: 24,
      left: 24,
    }
  }
}

export default (canvas: HTMLCanvasElement, tools: HTMLElement) => {
  const game = new Game(canvas)

  TweakUi.mount(tools, (ui) => {
    ui.slider(game.sprite, 'width', { min: 1, max: 90, step: 1 })
    ui.slider(game.sprite, 'height', { min: 1, max: 90, step: 1 })
    ui.slider(game.sprite, 'pivotX', { min: 0, max: 1, step: 0.1 })
    ui.slider(game.sprite, 'pivotY', { min: 0, max: 1, step: 0.1 })
    ui.checkbox(game.sprite, 'flipX')
    ui.checkbox(game.sprite, 'flipY')
    ui.checkbox(game.sprite, 'enableSlicing')
    ui.checkbox(game.sprite, 'enableTiling')
  })

  return game.run()
}
