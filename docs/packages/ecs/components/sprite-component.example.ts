import { EcsGame, CameraComponent, SpriteComponent } from '@gglib/components'
import { Color, PlatformId } from '@gglib/graphics'
import {} from '@gglib/loaders'
import { mountUi } from 'tweak-ui'

export default (canvas: HTMLCanvasElement, tools: HTMLElement, platform: PlatformId) => {
  const game = new Game({ canvas, platform })

  mountUi(tools, (ui) => {
    ui.scalar(game, 'sizeX', { range: true, min: 0.1, max: 20, step: 0.01 })
    ui.scalar(game, 'sizeY', { range: true, min: 0.1, max: 20, step: 0.01 })
    ui.scalar(game, 'angle', { range: true, min: 0, max: Math.PI * 2, step: 0.01 })
    ui.scalar(game, 'pivotX', { range: true, min: 0, max: 1, step: 0.01 })
    ui.scalar(game, 'pivotY', { range: true, min: 0, max: 1, step: 0.01 })
    ui.scalar(game, 'tilesX', { range: true, min: 1, max: 10, step: 1 })
    ui.scalar(game, 'tilesY', { range: true, min: 1, max: 10, step: 1 })
    ui.bool(game, 'flipX')
    ui.bool(game, 'flipY')
    ui.bool(game, 'enableSlicing')
    ui.group('Transform', (ui) => {
      ui.scalar(game, 'scale', { range: true, min: 0, max: 10, step: 0.01 })
      ui.scalar(game, 'rotate', { range: true, min: 0, max: Math.PI * 2, step: 0.01 })
    })
  })

  game.run()
  return () => {
    game.stop()
  }
}

class Game extends EcsGame {
  public sprite!: SpriteComponent

  public sizeX = 8
  public sizeY = 8
  public angle = 0
  public pivotX = 0.5
  public pivotY = 0.5
  public tilesX = 1
  public tilesY = 1
  public flipX = false
  public flipY = false
  public enableSlicing = false

  public scale = 1
  public rotate = 0

  public override onInitialize(): void {
    this.renderer.clearColor = Color.CornflowerBlue
    this.createObject()
    this.createCamera()
  }

  private createObject() {
    const entity = this.createEntity({
      parent: this.scene,
      components: [new SpriteComponent()],
    })
    this.sprite = entity.component(SpriteComponent)
    this.sprite.setSize(500, 500)

    this.content.loadTexture('/textures/puzzle/interface_sheet.png').then((texture) => {
      this.sprite.setTexture(texture)
      this.sprite.setSource(528, 374, 128, 128)
      this.sprite.setSlice(24, 24, 24, 24)
    })
  }

  private createCamera() {
    const entity = this.createEntity({
      name: 'camera',
      parent: this.scene,
      components: [
        new CameraComponent({
          type: 'orthographic',
          orthographicScale: 20,
          aspect: this.device.output.aspectRatio,
          near: 0,
          far: 1,
        }),
      ],
    })
    this.view.camera = entity.component(CameraComponent)
  }

  override onUpdate(time: number, deltaTime: number): void {
    this.sprite.setSize(this.sizeX, this.sizeY)
    this.sprite.setAngle(this.angle)
    this.sprite.setPivot(this.pivotX, this.pivotY)
    this.sprite.setFlip(this.flipX, this.flipY)
    this.sprite.setSlicing(this.enableSlicing)
    this.sprite.setTiles(this.tilesX, this.tilesY)
    this.sprite.transform.setScaleXYZ(this.scale, this.scale, 1)
    this.sprite.transform.setRotationYawPitchRoll(0, 0, this.rotate)
  }
}
