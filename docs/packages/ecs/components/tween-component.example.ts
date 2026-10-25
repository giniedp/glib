import {
  CameraComponent,
  EcsGame,
  LightComponent,
  ModelComponent,
  TransformComponent,
  Tween,
  TweenSystem,
} from '@gglib/components'
import { ContentLoader } from '@gglib/content'
import { GameComponent, GameEntity, InitializableComponent } from '@gglib/ecs'
import { PlatformId } from '@gglib/graphics'
import { GLTF, MTL, OBJ } from '@gglib/loaders'
import { easeInCubic, easeInOutCubic, easeLinear, easeOutCubic, vec3 } from '@gglib/math'
import { Renderer } from '@gglib/render'
import { mount } from 'tweak-ui'

class Game extends EcsGame {
  public cube!: GameEntity
  public move!: Tween
  public scale!: Tween
  public spin!: Tween

  protected override onInitialize(): void {
    this.content.registerLoader(OBJ.Loader)
    this.content.registerLoader(MTL.Loader)
    this.content.registerLoader(GLTF.Loader)
    this.world.getSystem(Renderer).linearToSrgb = true

    this.createCamera()
    this.createLight()
    this.createCube()
    this.createTweens()
  }

  private createTweens() {
    const tweens = this.world.getSystem(TweenSystem)
    const transform = this.cube.getTransform<TransformComponent>()!

    // tweens are reusable: create once, then change from/to and play again
    this.move = tweens.create({
      duration: 0.5,
      ease: easeInOutCubic,
      onUpdate: (t) => transform.setPositionV(t),
    })
    this.scale = tweens.create({
      duration: 0.5,
      ease: easeOutCubic,
      onUpdate: (t) => transform.setScaleUniform(t.value),
    })
    // a scalar tween that loops forever
    this.spin = tweens.play({
      from: 0,
      to: Math.PI * 2,
      duration: 4,
      repeat: Infinity,
      onUpdate: (t) => transform.setRotationAxisAngle(0, 1, 0, t.value),
    })
  }

  public tweenPosition() {
    const position = this.cube.getTransform<TransformComponent>()!.translation
    this.move
      .setFrom(position)
      .setToXYZW(position.x > 0 ? -5 : 5, 0, -10)
      .play()
  }

  public tweenScale() {
    const scale = this.cube.getTransform<TransformComponent>()!.scale.x
    this.scale
      .setFrom(scale)
      .setTo(scale > 1 ? 0.5 : 2)
      .play()
  }

  public toggleSpin() {
    if (this.spin.isPaused) {
      this.spin.resume()
    } else {
      this.spin.pause()
    }
  }

  private createCamera() {
    const entity = this.world.createEntity({
      name: 'camera',
      parent: this.scene.entity,
      components: [
        new CameraComponent({
          type: 'perspective',
        }),
      ],
      transform: new TransformComponent({
        position: vec3(0, 10, 10),
      }),
    })
    this.scene.setCamera(0, entity.component(CameraComponent))
  }

  private createCube() {
    const entity = this.world.createEntity({
      name: 'cube',
      parent: this.scene.entity,
      transform: new TransformComponent({
        position: vec3(0, 0, -10),
      }),
      components: [new ModelComponent(), new CubeComponent()],
    })
    this.cube = entity
  }

  private createLight() {
    const entity = this.createEntity({
      name: 'light',
      parent: this.scene.entity,
      transform: new TransformComponent({}),
      components: [new LightComponent()],
    })
    entity.getTransform<TransformComponent>()!.setRotationAxisAngle(1, 0, 0, -1)
  }

  protected override onUpdate(time: number, dt: number): void {
    this.scene.getCamera<CameraComponent>(0).aspect = this.device.output.aspectRatio
  }
}

class CubeComponent implements GameComponent, InitializableComponent {
  public content!: ContentLoader
  public renderable!: ModelComponent

  public readonly entity!: GameEntity
  public initialize(): void {
    this.renderable = this.entity.component(ModelComponent)
    this.content = this.entity.service(ContentLoader)
    this.content.loadModel('/models/obj/ship-pirate-large.obj').then((model) => {
      this.renderable.model = model
    })
  }
}

export default async (canvas: HTMLCanvasElement, tools: HTMLElement, platform: PlatformId) => {
  const game = new Game({ canvas, platform })
  // the panel binds to the tweens, they are created when the game initializes
  await game.run()

  const eases = [
    { label: 'Linear', value: easeLinear },
    { label: 'InCubic', value: easeInCubic },
    { label: 'OutCubic', value: easeOutCubic },
    { label: 'InOutCubic', value: easeInOutCubic },
  ]
  const panel = mount(tools, (ui) => {
    ui.scalar(game.move, 'duration', { label: 'Move duration', min: 0.1, step: 0.1 })
    ui.scalar(game.move, 'delay', { label: 'Move delay', min: 0, step: 0.1 })
    ui.scalar(game.move, 'repeat', { label: 'Move repeat', min: 0, step: 1 })
    ui.bool(game.move, 'yoyo', { label: 'Move yoyo' })
    ui.select(game.move, 'ease', { label: 'Move ease', options: eases })
    ui.button('Move', { onClick: () => game.tweenPosition() })

    ui.scalar(game.scale, 'duration', { label: 'Scale duration', min: 0.1, step: 0.1 })
    ui.select(game.scale, 'ease', { label: 'Scale ease', options: eases })
    ui.button('Scale', { onClick: () => game.tweenScale() })

    ui.button('Pause / resume spin', { onClick: () => game.toggleSpin() })
  })

  return () => {
    game.destroy()
    panel.dispose()
  }
}
