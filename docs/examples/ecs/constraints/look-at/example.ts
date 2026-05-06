import {
  BasicGame,
  CameraComponent,
  LightComponent,
  LookAtConstraint,
  ModelComponent,
  TransformComponent,
} from '@gglib/components'

import { GameEntity } from '@gglib/ecs'
import { BasicMaterial } from '@gglib/graphics'
import { MTL, OBJ } from '@gglib/loaders'
import { DEGREE_TO_RAD, Quat, Vec3 } from '@gglib/math'

export default (canvas: HTMLCanvasElement, tools: HTMLElement) => {
  const game = new Game(canvas)
  game.run()
  return () => {
    game.stop()
  }
}

class Game extends BasicGame {
  private entity1!: GameEntity

  public constructor(canvas: HTMLCanvasElement) {
    super({ canvas, platform: 'webgl2' })

    this.content.registerLoader(OBJ.Loader)
    this.content.registerLoader(MTL.Loader)
    this.content.registerMaterial(BasicMaterial, () => true)
    this.createLight()
    this.createCamera()
    this.createObjects()

    //ship-pirate-large
    this.content.loadAsset('/models/obj/cube.obj').then((asset) => {
      this.world
        .query({
          required: [ModelComponent],
        })
        .forEach((entity) => {
          entity.component(ModelComponent)!.model = this.content.createModel(asset)
        })
    })
  }

  override async run() {
    await super.run()
    this.scene.activate()
  }

  private createLight() {
    this.createEntity({
      name: 'light',
      parent: this.scene,
      components: [new LightComponent()],
      transform: new TransformComponent({
        rotation: Quat.create().initAxisAngle(Vec3.Right, 45 * DEGREE_TO_RAD),
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
        position: Vec3.create(0, 0, -10),
      }),
      components: [new ModelComponent()],
    })
    this.createEntity({
      parent: this.scene,
      transform: new TransformComponent({
        position: Vec3.create(0, 5, -10),
      }),
      components: [
        new ModelComponent(),
        new LookAtConstraint({
          source: this.entity1.getTransform<TransformComponent>()!,
          sourceSpace: 'world',
          targetSpace: 'world',
          weight: 1,
        }),
      ],
    })
    this.createEntity({
      parent: this.scene,
      transform: new TransformComponent({
        position: Vec3.create(-10, 0, -10),
      }),
      components: [
        new ModelComponent(),
        new LookAtConstraint({
          source: this.entity1.getTransform<TransformComponent>()!,
          sourceSpace: 'world',
          targetSpace: 'world',
          weight: 1,
        }),
      ],
    })
    this.createEntity({
      parent: this.scene,
      transform: new TransformComponent({
        position: Vec3.create(10, 0, -10),
      }),
      components: [
        new ModelComponent(),
        new LookAtConstraint({
          source: this.entity1.getTransform<TransformComponent>()!,
          sourceSpace: 'world',
          targetSpace: 'world',
          weight: 1,
        }),
      ],
    })
  }

  override update(time: number, dt: number) {
    super.update(time, dt)
    this.entity1
      .getTransform<TransformComponent>()!
      .setPositionX(Math.sin(time / 1000) * 8)
      .setPositionY(Math.cos(time / 1000) * 3)
      .setPositionZ(Math.cos(time / 1000) * 5 - 15)
  }
}
