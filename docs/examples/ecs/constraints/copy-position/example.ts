import {
  BasicGame,
  CameraComponent,
  CopyPositionConstraint,
  LightComponent,
  ModelComponent,
  TransformComponent,
} from '@gglib/components'
import { ContentLoader } from '@gglib/content'
import { GameComponent, GameEntity, InitializableComponent } from '@gglib/ecs'
import { BasicMaterial } from '@gglib/graphics'
import { MTL, OBJ } from '@gglib/loaders'
import { DEGREE_TO_RAD, Quat, Vec3 } from '@gglib/math'

export default (canvas: HTMLCanvasElement, tools: HTMLElement) => {
  const game = new Game(canvas)
  game.run()
  return () => game.destroy()
}

class Game extends BasicGame {
  private leader!: GameEntity

  public constructor(canvas: HTMLCanvasElement) {
    super({ canvas, platform: 'webgl2' })

    this.content.registerLoader(OBJ.Loader)
    this.content.registerLoader(MTL.Loader)
    this.content.registerMaterial(BasicMaterial, () => true)
    this.createLight()
    this.createCamera()
    this.createObjects()
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
        rotation: Quat.create().initAxisAngle(Vec3.UnitX, 45 * DEGREE_TO_RAD),
      }),
    })
  }

  private createCamera() {
    const entity = this.createEntity({
      name: 'camera',
      parent: this.scene,
      components: [new CameraComponent({ type: 'perspective' })],
      transform: new TransformComponent({
        position: Vec3.create(0, 0, 5),
      }),
    })
    this.view.camera = entity.component(CameraComponent)
  }

  private createObjects() {
    // Leader — orbits in the XY plane, drives all followers
    this.leader = this.createEntity({
      name: 'leader',
      parent: this.scene,
      components: [new ModelComponent(), new CubeLoader()],
      transform: new TransformComponent({
        position: Vec3.create(0, 0, -8),
      }),
    })

    const source = this.leader.getTransform<TransformComponent>()!

    // Copies X only — slides left/right with the leader, stays at fixed Y
    this.createEntity({
      name: 'x-follower',
      parent: this.scene,
      components: [
        new ModelComponent(),
        new CubeLoader(),
        new CopyPositionConstraint({
          source,
          copyX: true,
          copyY: false,
          copyZ: false,
          sourceSpace: 'world',
          targetSpace: 'world',
          weight: 1,
        }),
      ],
      transform: new TransformComponent({
        position: Vec3.create(0, -5, -8),
      }),
    })

    // Copies Y only — bobs up/down with the leader, stays at fixed X
    this.createEntity({
      name: 'y-follower',
      parent: this.scene,
      components: [
        new ModelComponent(),
        new CubeLoader(),
        new CopyPositionConstraint({
          source,
          copyX: false,
          copyY: true,
          copyZ: false,
          sourceSpace: 'world',
          targetSpace: 'world',
          weight: 1,
        }),
      ],
      transform: new TransformComponent({
        position: Vec3.create(6, 0, -8),
      }),
    })

    // Copies X and Y with low weight — follows the full orbit but lags visibly behind
    this.createEntity({
      name: 'lag-follower',
      parent: this.scene,
      components: [
        new ModelComponent(),
        new CubeLoader(),
        new CopyPositionConstraint({
          source,
          copyX: true,
          copyY: true,
          copyZ: false,
          sourceSpace: 'world',
          targetSpace: 'world',
          weight: 0.01,
        }),
      ],
      transform: new TransformComponent({
        position: Vec3.create(0, 0, -8),
      }),
    })
  }

  public override update(time: number, dt: number): void {
    super.update(time, dt)
    const r = 3
    this.leader
      .getTransform<TransformComponent>()!
      .setPositionX(Math.cos(time / 1000) * r)
      .setPositionY(Math.sin(time / 1000) * r)
      .setPositionZ(-8)
  }
}

// Loads the cube mesh on initialize — no other behaviour
class CubeLoader implements GameComponent, InitializableComponent {
  public readonly entity!: GameEntity

  public initialize(): void {
    const renderable = this.entity.component(ModelComponent)
    const content = this.entity.service(ContentLoader)
    content.loadModel('/models/obj/cube.obj').then((model) => {
      renderable.model = model
    })
  }
}
