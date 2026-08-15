import {
  EcsGame,
  CameraComponent,
  CopyScaleConstraint,
  LightComponent,
  ModelComponent,
  TransformComponent,
} from '@gglib/components'
import { ContentLoader } from '@gglib/content'
import { GameComponent, GameEntity, InitializableComponent } from '@gglib/ecs'
import { BasicMaterial, Color, CommonInputs, PlatformId } from '@gglib/graphics'
import { GLTF, MTL, OBJ } from '@gglib/loaders'
import { DEGREE_TO_RAD, Quat, vec3, Vec3 } from '@gglib/math'

export default (canvas: HTMLCanvasElement, tools: HTMLElement, platform: PlatformId) => {
  const game = new Game({ canvas, platform })
  game.run()
  return () => game.destroy()
}

class Game extends EcsGame {
  private leader!: GameEntity

  override onInitialize() {
    this.content.registerLoader(GLTF.Loader)
    this.content.registerMaterial(BasicMaterial, () => true)

    this.renderer.clearColor = Color.TransparentBlack
    this.renderer.onContextReady.add((ctx) => {
      ctx.renderInputs.set(CommonInputs.Global.SkyColor, Color.White)
      ctx.renderInputs.set(CommonInputs.Global.GroundColor, Color.White)
    })

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
        position: vec3(0, 0, 5),
      }),
    })
    this.view.camera = entity.component(CameraComponent)
  }

  private createObjects() {
    // Leader — X and Y scale oscillate on different phases, making each axis readable
    this.leader = this.createEntity({
      name: 'leader',
      parent: this.scene,
      components: [new ModelComponent(), new CubeLoader('yellow')],
      transform: new TransformComponent({
        position: vec3(0, 4, -8),
      }),
    })

    const source = this.leader.getTransform<TransformComponent>()!

    // Copies X only — pulses horizontally (sin phase), height stays fixed
    this.createEntity({
      name: 'x-follower',
      parent: this.scene,
      components: [
        new ModelComponent(),
        new CubeLoader('red'),
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
        position: vec3(-5, -2, -8),
      }),
    })

    // Copies Y only — pulses vertically (cos phase), width stays fixed
    this.createEntity({
      name: 'y-follower',
      parent: this.scene,
      components: [
        new ModelComponent(),
        new CubeLoader('green'),
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
        position: vec3(0, -2, -8),
      }),
    })

    // Copies all axes — full mirror of the leader
    this.createEntity({
      name: 'full-follower',
      parent: this.scene,
      components: [
        new ModelComponent(),
        new CubeLoader('blue'),
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
        position: vec3(5, -2, -8),
      }),
    })
  }

  public override onUpdate(time: number, dt: number): void {
    const t = time / 1000
    this.leader
      .getTransform<TransformComponent>()!
      .setScaleX(1 + 0.8 * Math.abs(Math.sin(t)))
      .setScaleY(1 + 0.8 * Math.abs(Math.cos(t)))
      .setScaleZ(1)
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
