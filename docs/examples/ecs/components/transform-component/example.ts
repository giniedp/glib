import {
  BasicGame,
  BehaviorComponent,
  CameraComponent,
  LightComponent,
  ModelComponent,
  TransformComponent,
} from '@gglib/components'
import { ContentLoader } from '@gglib/content'
import { GameComponent, GameEntity, InitializableComponent } from '@gglib/ecs'
import { BasicMaterial, PlatformId } from '@gglib/graphics'
import { GLTF, MTL, OBJ } from '@gglib/loaders'
import { DEGREE_TO_RAD, Quat, Vec3 } from '@gglib/math'

export default (canvas: HTMLCanvasElement, tools: HTMLElement, platform: PlatformId) => {
  const game = new Game(canvas, platform)
  game.run()
  return () => game.stop()
}

class Game extends BasicGame {
  public constructor(canvas: HTMLCanvasElement, platform: PlatformId) {
    super({ canvas, platform })

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
      components: [
        new CameraComponent({
          type: 'perspective',
        }),
      ],
      transform: new TransformComponent({
        position: Vec3.create(0, 2, 0),
      }),
    })
    this.view.camera = entity.component(CameraComponent)
  }

  private createObjects() {
    let parent = this.scene
    const count = 5
    for (let i = 0; i < count; i++) {
      const child = this.createEntity({
        parent: parent,
        components: [new ModelComponent(), new CubeComponent()],
        transform: new TransformComponent({
          position: Vec3.create(i * 2.2, 0, -10),
          keepWorld: true,
        }),
      })
      parent = child
    }

    parent = this.scene
    for (let i = 0; i < count; i++) {
      const child = this.createEntity({
        parent: parent,
        components: [new ModelComponent(), new CubeComponent()],
        transform: new TransformComponent({
          position: Vec3.create(-i * 2.2, 0, -10),
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
  public content!: ContentLoader

  public initialize(): void {
    this.renderable = this.entity.component(ModelComponent)
    this.content = this.entity.service(ContentLoader)

    this.content.loadModel('/models/obj/cube.obj').then((model) => {
      this.renderable.model = model
    })
  }

  public updateBehavior(time: number) {
    this.entity
      .getTransform<TransformComponent>()!
      .setRotationAxisAngle(0, 0, 1, 10 * Math.sin(time / 1000) * DEGREE_TO_RAD)
  }
}
