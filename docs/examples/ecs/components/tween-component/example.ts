import {
  CameraComponent,
  createEntity,
  GameLoop,
  LightComponent,
  ModelComponent,
  PerspectiveCameraComponent,
  RenderQuery,
  TimeSystem,
  TransformComponent,
  TweenOptions,
  TweenSystem,
} from '@gglib/components'
import { ContentManager } from '@gglib/content'
import '@gglib/content-loaders'
import { GameComponent, GameEntity, GameEntityCollection, GameProvider } from '@gglib/ecs'
import { Color, createDevice, Model } from '@gglib/graphics'
import { DEGREE_TO_RAD, easeInCubic, easeInOutCubic, easeLinear, easeOutCubic, Vec3 } from '@gglib/math'
import { BasicRenderPass, Renderer } from '@gglib/render'
import * as TweakUi from 'tweak-ui'

class Game extends GameProvider {
  public loop: GameLoop
  public renderer: Renderer
  public renderQuery: RenderQuery
  public tween: TweenSystem

  public camera: CameraComponent
  public scene = new GameEntityCollection()
  public cube: GameEntity<TransformComponent>

  public constructor(canvas: HTMLCanvasElement) {
    super()
    const device = createDevice({ canvas })
    this.provide(this)
    this.provide(device)
    this.provide(new Renderer(device))
    this.provide(new ContentManager(device))
    this.addSystem(new TimeSystem())
    this.addSystem(new TweenSystem())
    this.addSystem(new GameLoop({ autostart: false }))

    this.loop = this.get(GameLoop)
    this.tween = this.get(TweenSystem)
    this.renderer = this.get(Renderer)
    this.renderQuery = new RenderQuery()
    const renderPass = new BasicRenderPass()
    renderPass.clearColor = Color.CornflowerBlue.rgba
    this.renderer.steps = [renderPass]

    this.createCamera()
    this.createLight()
    this.createCube()
  }

  public run() {
    this.initialize()

    this.scene.initialize(this)
    this.scene.activate()

    this.loop.onUpdate.add(this.update)
    this.loop.onDraw.add(this.draw)

    this.loop.run()
    return () => {
      this.loop.stop()
      this.destroy()
    }
  }

  public update = () => {
    //
  }

  public draw = () => {
    this.renderQuery.update(this.scene.entities, this.camera)
    this.renderer.render(this.renderQuery)
  }

  public destroy(): void {
    this.loop.onUpdate.remove(this.update)
    this.loop.onDraw.remove(this.draw)
    this.scene.deactivate()
    this.scene.destroy()
    this.scene.clear()
  }

  private createCamera() {
    const entity = createEntity({
      name: 'camera',
      components: [
        new PerspectiveCameraComponent({
          near: 0.01,
          far: 1000,
          fov: 70 * DEGREE_TO_RAD,
          aspect: 16 / 9,
        }),
      ],
      transform: {
        position: Vec3.create(0, 0, 0),
      },
    })
    this.camera = entity.component(PerspectiveCameraComponent)
    this.scene.add(entity)
  }

  private createCube() {
    const entity = createEntity({
      name: 'cube',
      transform: {
        position: Vec3.create(0, 0, -5),
      },
      components: [new ModelComponent(), new CubeComponent()],
    })
    entity.transform.lookAt(Vec3.create(0, 0, 0))
    this.cube = entity
    this.scene.add(entity)
  }

  private createLight() {
    const entity = createEntity({
      name: 'light',
      components: [new LightComponent()],
    })
    entity.transform.setRotationAxisAngle(1, 0, 0, -1)
    this.scene.add(entity)
  }

  public tweenPosition(options: TweenOptions<any>) {
    const transform = this.cube.transform
    this.tween
      .startV3({
        ...options,
        from: transform.position,
        to: Vec3.create(transform.position.x > 0 ? -5 : 5, 0, -5),
      })
      .addUpdatableWith3Args(transform, 'setPosition')
  }

  public tweenScale(options: TweenOptions<any>) {
    const transform = this.cube.transform
    this.tween
      .start({
        ...options,
        from: [transform.scale.x],
        to: [transform.scale.x > 1 ? 0.5 : 2],
      })
      .addUpdatableWith1Arg(transform, 'setScaleUniform')
  }
}

class CubeComponent implements GameComponent {
  public renderable: ModelComponent

  public get transform(): TransformComponent {
    return this.entity.transform
  }

  public content: ContentManager

  public entity: GameEntity<TransformComponent>
  public initialize(entity: GameEntity<TransformComponent>): void {
    this.entity = entity
    this.renderable = entity.component(ModelComponent)
    this.content = entity.provider.get(ContentManager)

    this.content.load('/assets/models/obj/cube.obj', Model).then((model) => {
      this.renderable.model = model
    })
  }

  public activate(): void {
    //
  }

  public deactivate(): void {
    //
  }

  public destroy(): void {
    //
  }
}

export default (canvas: HTMLCanvasElement, tools: HTMLElement) => {
  const game = new Game(canvas)

  TweakUi.mount(tools, (ui) => {
    const positionOptions: TweenOptions<any> = {
      from: null,
      to: null,
      durationInMs: 500,
      delayInMs: 0,
      ease: easeInOutCubic,
    }
    ui.number(positionOptions, 'durationInMs', { min: 100, step: 1 })
    ui.number(positionOptions, 'delayInMs', { min: 0, step: 1 })
    ui.select(positionOptions, 'ease', {
      options: [
        { label: 'Linear', value: easeLinear },
        { label: 'InCubic', value: easeInCubic },
        { label: 'OutCubic', value: easeOutCubic },
        { label: 'InOutCubic', value: easeInOutCubic },
      ],
    })
    ui.button('Move', { onClick: () => game.get(Game).tweenPosition(positionOptions) })
    const scaleOptions: TweenOptions<any> = {
      from: null,
      to: null,
      durationInMs: 500,
      delayInMs: 0,
      ease: easeInOutCubic,
    }
    ui.number(scaleOptions, 'durationInMs', { min: 100, step: 1 })
    ui.number(scaleOptions, 'delayInMs', { min: 0, step: 1 })
    ui.select(scaleOptions, 'ease', {
      options: [
        { label: 'Linear', value: easeLinear },
        { label: 'InCubic', value: easeInCubic },
        { label: 'OutCubic', value: easeOutCubic },
        { label: 'InOutCubic', value: easeInOutCubic },
      ],
    })
    ui.button('Scale', { onClick: () => game.get(Game).tweenScale(scaleOptions) })
  })

  return game.run()
}
