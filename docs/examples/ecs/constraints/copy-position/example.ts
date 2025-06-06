import {
  BasicGame,
  CopyPositionConstraint,
  createEntity,
  LightComponent,
  LoopTime,
  ModelComponent,
  PerspectiveCameraComponent,
  TransformComponent,
} from '@gglib/components'

import { GameEntity } from '@gglib/ecs'
import { Color } from '@gglib/graphics'
import { MTL, OBJ } from '@gglib/loaders'
import { AutoMaterial } from '@gglib/materials'
import { DEGREE_TO_RAD, Quat, Vec3 } from '@gglib/math'
import { BasicRenderPass } from '@gglib/render'

export default (canvas: HTMLCanvasElement, tools: HTMLElement) => {
  const game = new Game(canvas)
  game.run()
  return () => {
    game.stop()
  }
}

class Game extends BasicGame {
  private entity1: GameEntity<TransformComponent>
  private entity2: GameEntity<TransformComponent>
  private entity3: GameEntity<TransformComponent>
  private entity4: GameEntity<TransformComponent>

  public constructor(canvas: HTMLCanvasElement) {
    super(canvas)
    this.renderer.steps = [
      new BasicRenderPass({
        clearColor: Color.CornflowerBlue.rgba,
      }),
    ]
    this.content.registerLoader(OBJ.Loader)
    this.content.registerLoader(MTL.Loader)
    this.content.registerMaterial({
      name: 'BasicEffect',
      type: AutoMaterial,
    })
    this.createLight()
    this.createCamera()
    this.createObjects()

    this.content.loadModel('/models/obj/cube.obj').then((model) => {
      this.entity1.component(ModelComponent).model = model
      this.entity2.component(ModelComponent).model = model
      this.entity3.component(ModelComponent).model = model
      this.entity4.component(ModelComponent).model = model
    })
  }

  private createLight() {
    const entity = createEntity({
      name: 'light',
      components: [new LightComponent()],
      transform: {
        rotation: Quat.create().initAxisAngle(Vec3.Right, 45 * DEGREE_TO_RAD),
      },
    })
    this.scene.add(entity)
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

  private createObjects() {
    this.entity1 = createEntity({
      transform: {
        position: Vec3.create(0, 0, -10),
      },
      components: [new ModelComponent()],
    })
    this.entity2 = createEntity({
      transform: {
        position: Vec3.create(0, 5, -10),
      },
      components: [
        new ModelComponent(),
        new CopyPositionConstraint({
          source: this.entity1.transform,
          copyX: true,
          copyY: false,
          copyZ: false,

          sourceSpace: 'world',
          targetSpace: 'world',
          weight: 0.1,
        }),
      ],
    })
    this.entity3 = createEntity({
      transform: {
        position: Vec3.create(-10, 0, -10),
      },
      components: [
        new ModelComponent(),
        new CopyPositionConstraint({
          source: this.entity1.transform,
          copyX: false,
          copyY: true,
          copyZ: false,

          sourceSpace: 'world',
          targetSpace: 'world',
          weight: 0.1,
        }),
      ],
    })
    this.entity4 = createEntity({
      transform: {
        position: Vec3.create(10, 0, -10),
      },
      components: [
        new ModelComponent(),
        new CopyPositionConstraint({
          source: this.entity1.transform,
          copyX: false,
          copyY: false,
          copyZ: true,

          sourceSpace: 'world',
          targetSpace: 'world',
          weight: 0.1,
        }),
      ],
    })
    this.scene.add(this.entity1)
    this.scene.add(this.entity2)
    this.scene.add(this.entity3)
    this.scene.add(this.entity4)
  }

  override update(time: LoopTime) {
    this.entity1.transform
      .setPositionX(Math.sin(time.total) * 8)
      .setPositionY(Math.cos(time.total) * 3)
      .setPositionZ(Math.cos(time.total) * 5 - 15)
  }
}
