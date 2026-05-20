import {
  BasicGame,
  BehaviorComponent,
  BoundsComponent,
  CameraComponent,
  GameTime,
  KeyboardInputSystem,
  LightComponent,
  ModelComponent,
  MouseInputSystem,
  QuadTree,
  SceneRootComponent,
  SceneStats,
  SpatialComponent,
  SpatialRootComponent,
  TimeSystem,
  TransformComponent,
  WASDComponent,
} from '@gglib/components'

import { ContentLoader } from '@gglib/content'
import { CreateEntityOptions, GameComponent, GameEntity, InitializableComponent } from '@gglib/ecs'
import { BasicMaterial, DeviceStats } from '@gglib/graphics'
import { GLTF, MTL, OBJ } from '@gglib/loaders'
import { DEGREE_TO_RAD, Quat, Vec3 } from '@gglib/math'
import { mountUi } from 'tweak-ui'

export default (canvas: HTMLCanvasElement, tools: HTMLElement) => {
  const game = new Game(canvas)
  console.log('Game created', game)
  mountUi(tools, (ui) => {
    // ui.number(time, 'factor', { slider: true, min: -2, max: 2, step: 0.1, label: 'Time Factor' })
    // ui.spherical(game.light, 'direction', { label: 'Light Direction' })
    ui.graph({
      rows: [
        {
          name: 'Frame Time',
          sample: () => game.frameTime ?? 0,
          min: 0,
          max: 50,
        },
        {
          name: 'Objects',
          sample: () => game.sceneStats?.visible ?? 0,
          min: 0,
          max: 50,
        },
      ],
    })
  })
  return game.run()
}

const WORLD_SIZE = 32
const LEAF_LEVEL = 3

class Game extends BasicGame {
  public light!: LightComponent
  public deviceStats!: DeviceStats
  public sceneStats!: SceneStats
  public frameTime!: number

  public constructor(canvas: HTMLCanvasElement) {
    super({ canvas, platform: 'webgl2' })

    this.world.addSystem(new MouseInputSystem())
    this.world.addSystem(new KeyboardInputSystem())
    this.content.registerLoader(OBJ.Loader)
    this.content.registerLoader(MTL.Loader)
    this.content.registerLoader(GLTF.Loader)
    this.content.registerMaterial(BasicMaterial, () => true)
    this.createLight()
    this.createCamera()
    this.createObjects()

    this.deviceStats = this.device.stats()
  }

  public override createScene(options: CreateEntityOptions) {
    options.components ||= []
    options.components.push(
      new SceneRootComponent(),
      new SpatialRootComponent({
        instance: QuadTree.create({
          min: Vec3.create(-WORLD_SIZE / 2, -2, -WORLD_SIZE / 2),
          max: Vec3.create(WORLD_SIZE / 2, 2, WORLD_SIZE / 2),
          leafLevel: LEAF_LEVEL,
        }),
      }),
    )
    return super.createScene(options)
  }

  public override initialize(): void {
    super.initialize()
    this.scene.activate()
  }

  public override update(t: number, dt: number) {
    super.update(t, dt)
    this.frameTime = dt
    this.deviceStats = this.device.stats(this.deviceStats)
    this.sceneStats = this.scene.component(SceneRootComponent).stats(this.sceneStats)
  }

  private createLight() {
    const entity = this.createEntity({
      name: 'light',
      parent: this.scene,
      components: [new LightComponent()],
      transform: new TransformComponent({
        rotation: Quat.create().initAxisAngle(Vec3.UnitX, 45 * DEGREE_TO_RAD),
      }),
    })
    this.light = entity.component(LightComponent)
  }

  private createCamera() {
    const entity = this.createEntity({
      name: 'camera',
      parent: this.scene,
      transform: new TransformComponent(),
      components: [
        new CameraComponent({
          type: 'perspective',
        }),
        new WASDComponent(),
      ],
    })
    this.view.camera = entity.component(CameraComponent)
  }

  private createObjects() {
    const worldMin = -WORLD_SIZE / 2
    const worldMax = WORLD_SIZE / 2
    const perSide = 8
    for (let x = 0; x < perSide; x++) {
      for (let z = 0; z < perSide; z++) {
        this.createEntity({
          parent: this.scene,
          components: [new ModelComponent(), new CubeComponent(), new BoundsComponent(), new SpatialComponent()],
          transform: new TransformComponent({
            scale: Vec3.createOne(),
            position: Vec3.create(
              worldMin + ((x + 0.5) * (worldMax - worldMin)) / perSide,
              0,
              worldMin + ((z + 0.5) * (worldMax - worldMin)) / perSide,
            ),
            keepWorld: true,
          }),
        })
      }
    }
  }
}

class CubeComponent implements GameComponent, InitializableComponent, BehaviorComponent {
  public readonly entity!: GameEntity
  public renderable!: ModelComponent
  public time!: GameTime

  public initialize(): void {
    this.renderable = this.entity.component(ModelComponent)
    this.time = this.entity.service(TimeSystem).getOrCreate('customTime')

    const content = this.entity.service(ContentLoader)
    content.loadModel('/models/obj/cube.obj').then((model) => {
      this.renderable.model = model
    })
  }

  public updateBehavior(): void {
    const time = this.time.total
    // this.entity.getTransform<TransformComponent>()!.setRotationAxisAngle(0, 0, 1, 10 * Math.sin(time) * DEGREE_TO_RAD)
  }
}
