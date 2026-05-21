import {
  BasicGame,
  CameraComponent,
  CopyRotationConstraint,
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
    // Leader — spins freely, drives all followers
    this.leader = this.createEntity({
      name: 'leader',
      parent: this.scene,
      components: [new ModelComponent(), new CubeLoader()],
      transform: new TransformComponent({
        position: Vec3.create(0, 2, -8),
      }),
    })

    const source = this.leader.getTransform<TransformComponent>()!

    // Four followers in a row — same source, increasing weight left to right.
    // At steady state each follower lags by a phase offset that shrinks as weight rises.
    const followers: Array<{ x: number; weight: number }> = [
      { x: -6, weight: 0.02 },
      { x: -2, weight: 0.08 },
      { x: 2, weight: 0.3 },
      { x: 6, weight: 1.0 },
    ]

    for (const { x, weight } of followers) {
      this.createEntity({
        parent: this.scene,
        components: [
          new ModelComponent(),
          new CubeLoader(),
          new CopyRotationConstraint({
            source,
            sourceSpace: 'world',
            targetSpace: 'world',
            weight,
          }),
        ],
        transform: new TransformComponent({
          position: Vec3.create(x, 0, -8),
        }),
      })
    }
  }

  public override update(time: number, dt: number): void {
    super.update(time, dt)
    this.leader
      .getTransform<TransformComponent>()!
      .rotateAxisAngle(0, 1, 0, 120 * (dt / 1000) * DEGREE_TO_RAD)
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
