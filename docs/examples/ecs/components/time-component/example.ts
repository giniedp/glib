import {
  BasicGame,
  BehaviorComponent,
  CameraComponent,
  GameTime,
  LightComponent,
  ModelComponent,
  TimeSystem,
  TransformComponent,
} from '@gglib/components'
import { ContentLoader } from '@gglib/content'
import { GameComponent, GameEntity, InitializableComponent } from '@gglib/ecs'
import { BasicMaterial } from '@gglib/graphics'
import { GLTF, MTL, OBJ } from '@gglib/loaders'
import { DEGREE_TO_RAD, Quat, Vec3 } from '@gglib/math'
import { mountUi } from 'tweak-ui'

export default (canvas: HTMLCanvasElement, tools: HTMLElement) => {
  const game = new Game(canvas)
  const time = game.world.getSystem(TimeSystem).getOrCreate('customTime')
  mountUi(tools, (ui) => {
    ui.number(time, 'factor', { slider: true, min: -2, max: 2, step: 0.1, label: 'Time Factor' })
  })
  game.run()
  return () => game.stop()
}

class Game extends BasicGame {
  public constructor(canvas: HTMLCanvasElement) {
    super({ canvas, platform: 'webgl2' })

    this.content.registerLoader(OBJ.Loader)
    this.content.registerLoader(MTL.Loader)
    this.content.registerLoader(GLTF.Loader)
    this.content.registerMaterial(BasicMaterial, () => true)
    this.createLight()
    this.createCamera()
    this.createObjects()
  }

  public override initialize(): void {
    super.initialize()
    this.scene.activate()
  }

  private createLight() {
    this.createEntity({
      name: 'light',
      parent: this.scene,
      components: [new LightComponent()],
      transform: new TransformComponent({
        rotation: Quat.create().initAxisAngle(Vec3.UnitX, 45 * DEGREE_TO_RAD),
      }),
    })
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
      ],
    })
    this.view.camera = entity.component(CameraComponent)
  }

  private createObjects() {
    let parent = this.scene
    const count = 10
    for (let i = 0; i < count; i++) {
      const child = this.createEntity({
        parent: parent,
        components: [new ModelComponent(), new CubeComponent()],
        transform: new TransformComponent({
          scale: Vec3.createOne().multiplyScalar(0.5),
          position: Vec3.create(i * 2.5, 0, -5),
          keepWorld: true,
        }),
      })
      parent = child
    }

    parent = this.scene
    for (let i = 0; i < count; i++) {
      const child = this.world.createEntity({
        parent: parent,
        components: [new ModelComponent(), new CubeComponent()],
        transform: new TransformComponent({
          scale: Vec3.createOne().multiplyScalar(0.5),
          position: Vec3.create(-i * 2.5, 0, -5),
          keepWorld: true,
        }),
      })
      parent = child
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
    this.entity.getTransform<TransformComponent>()!.setRotationAxisAngle(0, 0, 1, 10 * Math.sin(time) * DEGREE_TO_RAD)
  }
}
