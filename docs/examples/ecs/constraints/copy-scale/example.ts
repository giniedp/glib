import {
  BasicGame,
  CameraComponent,
  CopyScaleConstraint,
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
    // Leader — X and Y scale oscillate on different phases, making each axis readable
    this.leader = this.createEntity({
      name: 'leader',
      parent: this.scene,
      components: [new ModelComponent(), new CubeLoader()],
      transform: new TransformComponent({
        position: Vec3.create(0, 2, -8),
      }),
    })

    const source = this.leader.getTransform<TransformComponent>()!

    // Copies X only — pulses horizontally (sin phase), height stays fixed
    this.createEntity({
      name: 'x-follower',
      parent: this.scene,
      components: [
        new ModelComponent(),
        new CubeLoader(),
        new CopyScaleConstraint({
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
        position: Vec3.create(-4, -1, -8),
      }),
    })

    // Copies Y only — pulses vertically (cos phase), width stays fixed
    this.createEntity({
      name: 'y-follower',
      parent: this.scene,
      components: [
        new ModelComponent(),
        new CubeLoader(),
        new CopyScaleConstraint({
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
        position: Vec3.create(0, -1, -8),
      }),
    })

    // Copies all axes — full mirror of the leader
    this.createEntity({
      name: 'full-follower',
      parent: this.scene,
      components: [
        new ModelComponent(),
        new CubeLoader(),
        new CopyScaleConstraint({
          source,
          copyX: true,
          copyY: true,
          copyZ: true,
          sourceSpace: 'world',
          targetSpace: 'world',
          weight: 1,
        }),
      ],
      transform: new TransformComponent({
        position: Vec3.create(4, -1, -8),
      }),
    })
  }

  public override update(time: number, dt: number): void {
    super.update(time, dt)
    const t = time / 1000
    this.leader
      .getTransform<TransformComponent>()!
      .setScaleX(1 + 0.8 * Math.abs(Math.sin(t)))
      .setScaleY(1 + 0.8 * Math.abs(Math.cos(t)))
      .setScaleZ(1)
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
