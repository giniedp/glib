import {
  EcsGame,
  BehaviorComponent,
  CameraComponent,
  LightComponent,
  ModelComponent,
  TransformComponent,
} from '@gglib/components'
import { ContentLoader } from '@gglib/content'
import { GameComponent, GameEntity, InitializableComponent } from '@gglib/ecs'
import { BasicMaterial, Color, CommonInputs, PlatformId } from '@gglib/graphics'
import { GLTF, MTL, OBJ } from '@gglib/loaders'
import { DEGREE_TO_RAD, Quat, Vec3 } from '@gglib/math'

export default (canvas: HTMLCanvasElement, tools: HTMLElement, platform: PlatformId) => {
  const game = new Game({ canvas, platform, autosize: true })
  game.run()
  return () => game.stop()
}

class Game extends EcsGame {
  public override onInitialize(): void {
    this.content.registerLoader(OBJ.Loader)
    this.content.registerLoader(MTL.Loader)
    this.content.registerLoader(GLTF.Loader)
    this.content.registerMaterial(BasicMaterial, () => true)

    this.renderer.clearColor = Color.TransparentBlack

    this.createCamera()
    this.createSolarSystem()
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
        position: Vec3.create(0, 12, 8),
        rotation: Quat.create().initAxisAngle(Vec3.NegativeUnitX, 56 * DEGREE_TO_RAD),
      }),
    })
    this.view.camera = entity.component(CameraComponent)
  }

  private createSolarSystem() {
    // Sun — at origin, slowly self-spins
    this.createEntity({
      name: 'sun',
      parent: this.scene,
      components: [new ModelComponent(), new BodyComponent(20)],
      transform: new TransformComponent({
        scale: Vec3.create(1.5, 1.5, 1.5),
      }),
    })

    // Invisible pivot at origin — rotates to drive earth's orbit around the sun
    const earthOrbit = this.createEntity({
      name: 'earthOrbit',
      parent: this.scene,
      components: [new PivotComponent(15)],
      transform: new TransformComponent(),
    })

    // Earth — child of orbit pivot, offset to orbital radius
    this.createEntity({
      name: 'earth',
      parent: earthOrbit,
      components: [new ModelComponent(), new BodyComponent(60)],
      transform: new TransformComponent({
        position: Vec3.create(5, 0, 0),
        scale: Vec3.create(0.7, 0.7, 0.7),
      }),
    })

    // Moon orbit pivot — sibling of earth (both children of earthOrbit) so it does not
    // inherit earth's scale, but still follows earth's world position
    const moonOrbit = this.createEntity({
      name: 'moonOrbit',
      parent: earthOrbit,
      components: [new PivotComponent(45)],
      transform: new TransformComponent({
        position: Vec3.create(5, 0, 0),
      }),
    })

    // Moon — child of moon orbit pivot, offset to orbital radius
    this.createEntity({
      name: 'moon',
      parent: moonOrbit,
      components: [new ModelComponent(), new BodyComponent(120)],
      transform: new TransformComponent({
        position: Vec3.create(1.8, 0, 0),
        scale: Vec3.create(0.3, 0.3, 0.3),
      }),
    })
  }
}

// Invisible pivot — rotates around Y to carry its children in an orbit
class PivotComponent implements GameComponent, BehaviorComponent {
  public readonly entity!: GameEntity

  public constructor(private degreesPerSecond: number) {}

  public updateBehavior(time: number): void {
    this.entity
      .getTransform<TransformComponent>()!
      .setRotationAxisAngle(0, 1, 0, this.degreesPerSecond * (time / 1000) * DEGREE_TO_RAD)
  }
}

// Loads a cube mesh and self-spins around Y at a fixed angular speed
class BodyComponent implements GameComponent, InitializableComponent, BehaviorComponent {
  public readonly entity!: GameEntity

  public constructor(private degreesPerSecond: number) {}

  public initialize(): void {
    const renderable = this.entity.component(ModelComponent)
    const content = this.entity.service(ContentLoader)
    content.loadModel(`/models/gltf/blocks/decorative_block_yellow.gltf`).then((model) => {
      renderable.model = model
    })
  }

  public updateBehavior(time: number): void {
    this.entity
      .getTransform<TransformComponent>()!
      .setRotationAxisAngle(0, 1, 0, this.degreesPerSecond * (time / 1000) * DEGREE_TO_RAD)
  }
}
