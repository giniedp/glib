import { CameraComponent, EcsGame, SpriteComponent, TransformComponent } from '@gglib/components'
import { GameEntity } from '@gglib/ecs'
import { PlatformId } from '@gglib/graphics'
import { type IVec3, vec3 } from '@gglib/math'
import { mount } from 'tweak-ui'

export default (canvas: HTMLCanvasElement, tools: HTMLElement, platform: PlatformId) => {
  const game = new Game({ canvas, platform })

  const panel = mount(tools, (ui) => {
    const sprite = game.panel
    ui.group('Sprite', (ui) => {
      ui.scalar(sprite, 'width', { range: true, min: 0.5, max: 20, step: 0.01 })
      ui.scalar(sprite, 'height', { range: true, min: 0.5, max: 20, step: 0.01 })
      ui.scalar(sprite, 'pivotX', { range: true, min: 0, max: 1, step: 0.01 })
      ui.scalar(sprite, 'pivotY', { range: true, min: 0, max: 1, step: 0.01 })
      ui.scalar(sprite, 'tilesX', { range: true, min: 1, max: 10, step: 1 })
      ui.scalar(sprite, 'tilesY', { range: true, min: 1, max: 10, step: 1 })
      ui.bool(sprite, 'flipX')
      ui.bool(sprite, 'flipY')
      ui.scalar(game, 'slice', { range: true, min: 0, max: 48, step: 1 })
      ui.scalar(sprite, 'pixelsPerUnit', { range: true, min: 4, max: 100, step: 1 })
    })
    ui.group('Transform', (ui) => {
      ui.scalar(game, 'scale', { range: true, min: 0, max: 4, step: 0.01 })
      ui.scalar(game, 'rotate', { range: true, min: 0, max: Math.PI * 2, step: 0.01 })
    })
    ui.group('Depth', (ui) => {
      ui.scalar(game, 'depth', { label: 'Blue circle z', range: true, min: -2, max: 2, step: 0.01 })
    })
  })

  game.run()
  return () => {
    game.stop()
    panel.dispose()
  }
}

class Game extends EcsGame {
  public panel = new SpriteComponent({ width: 8, height: 8, pixelsPerUnit: 16 })
  public slice = 24
  public scale = 1
  public rotate = 0
  public depth = 1

  private blue!: GameEntity

  public override onInitialize(): void {
    this.createCamera()

    this.createSprite(vec3(-9, 0, 0), this.panel)
    this.blue = this.createSprite(vec3(-1, 1, 1), new SpriteComponent({ width: 5, height: 5 }))
    const brown = this.createSprite(vec3(-2.5, -1.5, 0), new SpriteComponent({ width: 5, height: 5 }))
    const cream = this.createSprite(vec3(0.5, -1.5, 0.5), new SpriteComponent({ width: 5, height: 5 }))

    this.content.loadTexture('/sprites/interface.png').then((texture) => {
      // a 9-slice panel and three circles from the same sprite sheet
      this.panel.setTexture(texture, 528, 374, 128, 128)
      this.blue.component(SpriteComponent).setTexture(texture, 785, 1, 126, 126)
      brown.component(SpriteComponent).setTexture(texture, 657, 257, 126, 126)
      cream.component(SpriteComponent).setTexture(texture, 657, 513, 126, 126)
    })
  }

  private createSprite(position: IVec3, sprite: SpriteComponent) {
    return this.createEntity({
      parent: this.scene.entity,
      transform: new TransformComponent({ position }),
      components: [sprite],
    })
  }

  private createCamera() {
    const entity = this.createEntity({
      name: 'camera',
      parent: this.scene.entity,
      transform: new TransformComponent({ position: vec3(0, 0, 10) }),
      components: [
        new CameraComponent({
          type: 'orthographic',
          orthographicScale: 30,
          near: 0.1,
          far: 100,
        }),
      ],
    })
    this.scene.setCamera(0, entity.component(CameraComponent))
  }

  override onUpdate(): void {
    this.scene.getCamera<CameraComponent>(0).aspect = this.device.output.aspectRatio
    // the sprite system reads the component every frame, setting the fields is enough
    this.panel.setSlice(this.slice)
    const transform = this.panel.entity.getTransform<TransformComponent>()!
    transform.setScaleXYZ(this.scale, this.scale, 1)
    transform.setRotationYawPitchRoll(0, 0, this.rotate)
    const blue = this.blue.getTransform<TransformComponent>()!
    blue.setPosition(-1, 1, this.depth)
  }
}
