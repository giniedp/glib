import { BasicGame, CameraComponent, SpriteComponent } from '@gglib/components'
import { PlatformId } from '@gglib/graphics'
import {} from '@gglib/loaders'
import { mountUi } from 'tweak-ui'

export default (canvas: HTMLCanvasElement, tools: HTMLElement, platform: PlatformId) => {
  const game = new Game(canvas, platform)

  mountUi(tools, (ui) => {
    ui.number(game, 'sizeX', { slider: true, min: 0.1, max: 20, step: 0.01 })
    ui.number(game, 'sizeY', { slider: true, min: 0.1, max: 20, step: 0.01 })
    ui.number(game, 'angle', { slider: true, min: 0, max: Math.PI * 2, step: 0.01 })
    ui.number(game, 'pivotX', { slider: true, min: 0, max: 1, step: 0.01 })
    ui.number(game, 'pivotY', { slider: true, min: 0, max: 1, step: 0.01 })
    ui.number(game, 'tilesX', { slider: true, min: 1, max: 10, step: 1 })
    ui.number(game, 'tilesY', { slider: true, min: 1, max: 10, step: 1 })
    ui.boolean(game, 'flipX')
    ui.boolean(game, 'flipY')
    ui.boolean(game, 'enableSlicing')
    ui.group('Transform', (ui) => {
      ui.number(game, 'scale', { slider: true, min: 0, max: 10, step: 0.01 })
      ui.number(game, 'rotate', { slider: true, min: 0, max: Math.PI * 2, step: 0.01 })
    })
  })

  game.run()
  return () => {
    game.stop()
  }
}

class Game extends BasicGame {
  public sprite!: SpriteComponent

  public sizeX = 4
  public sizeY = 4
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
  public constructor(canvas: HTMLCanvasElement, platform: PlatformId) {
    super({ canvas, platform })
  }

  public override initialize(): void {
    this.createObject()
    this.createCamera()
    this.world.initilize()
    this.scene.activate()
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

  override update(time: number, deltaTime: number): void {
    super.update(time, deltaTime)
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
