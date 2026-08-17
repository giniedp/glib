import {
  EcsGame,
  CameraComponent,
  LightComponent,
  LookAtConstraint,
  ModelComponent,
  TransformComponent,
} from '@gglib/components'
import { ContentLoader } from '@gglib/content'

import { GameComponent, GameEntity, InitializableComponent } from '@gglib/ecs'
import { BasicMaterial, Color, CommonInputs, PlatformId } from '@gglib/graphics'
import { GLTF, MTL } from '@gglib/loaders'
import { DEGREE_TO_RAD, Quat, SpaceBasis, Vec3 } from '@gglib/math'

export default (canvas: HTMLCanvasElement, tools: HTMLElement, platform: PlatformId) => {
  const game = new Game({ canvas, platform, autosize: true })
  game.run()
  return () => game.destroy()
}

class Game extends EcsGame {
  private entity1!: GameEntity

  protected override onInitialize() {
    this.content.registerLoader(GLTF.Loader)
    this.content.registerLoader(MTL.Loader)
    this.content.registerMaterial(BasicMaterial, () => true)

    this.renderer.clearColor = Color.TransparentBlack

    this.createLight()
    this.createCamera()
    this.createObjects()
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
      transform: new TransformComponent({
        position: Vec3.create(0, 0, 0),
        keepWorld: true,
      }),
      components: [
        new CameraComponent({
          type: 'perspective',
        }),
      ],
    })
    this.view.camera = entity.component(CameraComponent)
  }

  private createObjects() {
    this.entity1 = this.createEntity({
      parent: this.scene,
      transform: new TransformComponent({
        position: Vec3.create(0, -3, -10),
      }),
      components: [new ModelComponent(), new CubeLoader('yellow')],
    })
    this.createEntity({
      parent: this.scene,
      transform: new TransformComponent({
        position: Vec3.create(0, 5, -10),
      }),
      components: [
        new CubeLoader('red'),
        new ModelComponent(),
        new LookAtConstraint({
          source: this.entity1.getTransform<TransformComponent>()!,
          sourceSpace: 'world',
          targetSpace: 'world',
          weight: 1,
          up: SpaceBasis.Y_UP_NEG_Z.up,
        }),
      ],
    })
    this.createEntity({
      parent: this.scene,
      transform: new TransformComponent({
        position: Vec3.create(-10, 0, -10),
      }),
      components: [
        new CubeLoader('green'),
        new ModelComponent(),
        new LookAtConstraint({
          source: this.entity1.getTransform<TransformComponent>()!,
          sourceSpace: 'world',
          targetSpace: 'world',
          weight: 1,
          up: SpaceBasis.Y_UP_NEG_Z.up,
        }),
      ],
    })
    this.createEntity({
      parent: this.scene,
      transform: new TransformComponent({
        position: Vec3.create(10, 0, -10),
      }),
      components: [
        new CubeLoader('blue'),
        new ModelComponent(),
        new LookAtConstraint({
          source: this.entity1.getTransform<TransformComponent>()!,
          sourceSpace: 'world',
          targetSpace: 'world',
          weight: 1,
          up: SpaceBasis.Y_UP_NEG_Z.up,
        }),
      ],
    })
  }

  override onUpdate(time: number, dt: number) {
    this.entity1
      .getTransform<TransformComponent>()!
      .setPositionX(Math.sin(time / 1000) * 8)
      .setPositionY(Math.cos(time / 1000) * 5 - 5)
      .setPositionZ(Math.cos(time / 1000) * 5 - 15)
  }
}

class CubeLoader implements GameComponent, InitializableComponent {
  public readonly entity!: GameEntity
  private color!: string
  public constructor(color: 'yellow' | 'red' | 'green' | 'blue') {
    this.color = color
  }

  public initialize(): void {
    const renderable = this.entity.component(ModelComponent)
    const content = this.entity.service(ContentLoader)
    content.loadModel(`/models/gltf/blocks/decorative_block_${this.color}.gltf`).then((model) => {
      renderable.model = model
    })
  }
}
