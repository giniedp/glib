import {
  EcsGame,
  CameraComponent,
  DistanceConstraint,
  LightComponent,
  ModelComponent,
  TransformComponent,
} from '@gglib/components'
import { ContentLoader } from '@gglib/content'
import { GameComponent, GameEntity, InitializableComponent } from '@gglib/ecs'
import { BasicMaterial, Color, CommonInputs, PlatformId } from '@gglib/graphics'
import { GLTF, MTL } from '@gglib/loaders'
import { DEGREE_TO_RAD, Quat, vec3, Vec3 } from '@gglib/math'

export default (canvas: HTMLCanvasElement, tools: HTMLElement, platform: PlatformId) => {
  const game = new Game({ canvas, platform })
  game.run()
  return () => game.destroy()
}

class Game extends EcsGame {
  private leader!: GameEntity

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
      components: [new CameraComponent({ type: 'perspective' })],
      transform: new TransformComponent({
        position: vec3(0, 0, 3),
      }),
    })
    this.view.camera = entity.component(CameraComponent)
  }

  private createObjects() {
    // Leader — sweeps left and right along X, drives all followers
    this.leader = this.createEntity({
      name: 'leader',
      parent: this.scene,
      components: [new ModelComponent(), new CubeLoader('yellow')],
      transform: new TransformComponent({
        position: vec3(0, 0, -8),
      }),
    })

    const source = this.leader.getTransform<TransformComponent>()!

    // Rigid leash — weight=1 snaps the target to exactly maxDistance every frame
    this.createEntity({
      name: 'rigid-leash',
      parent: this.scene,
      components: [
        new ModelComponent(),
        new CubeLoader('red'),
        new DistanceConstraint({
          source,
          minDistance: 0,
          maxDistance: 3,
          sourceSpace: 'world',
          targetSpace: 'world',
          weight: 1,
        }),
      ],
      transform: new TransformComponent({
        position: vec3(0, -3, -8),
      }),
    })

    // Elastic leash — low weight means the correction is applied gradually each frame,
    // so the target stretches and trails behind the source before settling at maxDistance
    this.createEntity({
      name: 'elastic-leash',
      parent: this.scene,
      components: [
        new ModelComponent(),
        new CubeLoader('green'),
        new DistanceConstraint({
          source,
          minDistance: 0,
          maxDistance: 3,
          sourceSpace: 'world',
          targetSpace: 'world',
          weight: 0.1,
        }),
      ],
      transform: new TransformComponent({
        position: vec3(0, 3, -8),
      }),
    })

    // Repulsion — minDistance pushes the target away when source comes too close.
    // Starts slightly off the source path so the push direction is always well-defined.
    this.createEntity({
      name: 'repulsion',
      parent: this.scene,
      components: [
        new ModelComponent(),
        new CubeLoader('blue'),
        new DistanceConstraint({
          source,
          minDistance: 3,
          maxDistance: 100,
          sourceSpace: 'world',
          targetSpace: 'world',
          weight: 0.5,
        }),
      ],
      transform: new TransformComponent({
        position: vec3(0, 1, -8),
      }),
    })
  }

  public override onUpdate(time: number, dt: number): void {
    this.leader
      .getTransform<TransformComponent>()!
      .setPositionX(8 * Math.sin(time / 1500))
      .setPositionY(0)
      .setPositionZ(-8)
  }
}

/**
 * Loads the cube mesh on initialize
 */
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
