import {
  CameraComponent,
  EcsGame,
  LightComponent,
  ModelComponent,
  TransformComponent,
  TweenOptions,
  TweenSystem,
} from '@gglib/components'
import { ContentLoader } from '@gglib/content'
import { GameComponent, GameEntity, InitializableComponent } from '@gglib/ecs'
import { BasicMaterial, PlatformId } from '@gglib/graphics'
import { GLTF, MTL, OBJ } from '@gglib/loaders'
import { easeInCubic, easeInOutCubic, easeLinear, easeOutCubic, Vec3 } from '@gglib/math'
import { Renderer } from '@gglib/render'
import { mountUi } from 'tweak-ui'

class Game extends EcsGame {
  public cube!: GameEntity
  public tween!: TweenSystem

  public constructor(canvas: HTMLCanvasElement, platform: PlatformId) {
    super({ canvas, platform })

    this.content.registerLoader(OBJ.Loader)
    this.content.registerLoader(MTL.Loader)
    this.content.registerLoader(GLTF.Loader)
    this.tween = this.world.getSystem(TweenSystem)
    this.world.getSystem(Renderer).linearToSrgb = true

    this.createCamera()
    this.createLight()
    this.createCube()
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
        position: Vec3.create(0, 10, 10),
      }),
    })
    this.scene.setCamera(0, entity.component(CameraComponent))
  }

  private createCube() {
    const entity = this.world.createEntity({
      name: 'cube',
      parent: this.scene.entity,
      transform: new TransformComponent({
        position: Vec3.create(0, 0, -10),
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

  public tweenPosition(options: TweenOptions<any>) {
    console.log('tweenPosition', options)
    const transform = this.cube.getTransform<TransformComponent>()!
    this.tween.cancelAll()
    this.tween
      .startV3({
        ...options,
        from: transform.translation,
        to: Vec3.create(transform.translation.x > 0 ? -5 : 5, 0, -5),
      })
      .bind((tween) => {
        console.log(tween)
        transform.setPositionV(tween)
      })
  }

  public tweenScale(options: TweenOptions<any>) {
    const transform = this.cube.getTransform<TransformComponent>()!
    this.tween.cancelAll()
    this.tween
      .start({
        ...options,
        from: [transform.scale.x],
        to: [transform.scale.x > 1 ? 0.5 : 2],
      })
      .bind((tween) => transform.setScaleUniform(tween.value))
  }
}

class CubeComponent implements GameComponent, InitializableComponent {
  public content!: ContentLoader
  public renderable!: ModelComponent

  public get transform(): TransformComponent {
    return this.entity.getTransform<TransformComponent>()!
  }

  public readonly entity!: GameEntity
  public initialize(): void {
    this.renderable = this.entity.component(ModelComponent)
    this.content = this.entity.service(ContentLoader)
    this.content.loadModel('/models/obj/ship-pirate-large.obj').then((model) => {
      this.renderable.model = model
      console.log('Model loaded', model)
    })
  }

  public destroy(): void {
    //
  }
}

export default (canvas: HTMLCanvasElement, tools: HTMLElement, platform: PlatformId) => {
  const game = new Game(canvas, platform)

  mountUi(tools, (ui) => {
    const positionOptions: TweenOptions<any> = {
      from: null,
      to: null,
      duration: 0.5,
      delay: 0,
      ease: easeInOutCubic,
    }
    ui.scalar(positionOptions, 'duration', { min: 0.1, step: 0.1 })
    ui.scalar(positionOptions, 'delay', { min: 0, step: 1 })
    ui.select(positionOptions, 'ease', {
      options: [
        { label: 'Linear', value: easeLinear },
        { label: 'InCubic', value: easeInCubic },
        { label: 'OutCubic', value: easeOutCubic },
        { label: 'InOutCubic', value: easeInOutCubic },
      ],
    })
    ui.button('Move', { onclick: () => game.tweenPosition(positionOptions) })
    const scaleOptions: TweenOptions<any> = {
      from: null,
      to: null,
      duration: 0.5,
      delay: 0,
      ease: easeInOutCubic,
    }
    ui.scalar(scaleOptions, 'duration', { min: 100, step: 1 })
    ui.scalar(scaleOptions, 'delay', { min: 0, step: 1 })
    ui.select(scaleOptions, 'ease', {
      options: [
        { label: 'Linear', value: easeLinear },
        { label: 'InCubic', value: easeInCubic },
        { label: 'OutCubic', value: easeOutCubic },
        { label: 'InOutCubic', value: easeInOutCubic },
      ],
    })
    ui.button('Scale', { onclick: () => game.tweenScale(scaleOptions) })
  })

  game.run()
  return () => game.stop()
}
