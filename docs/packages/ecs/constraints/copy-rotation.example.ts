import {
  EcsGame,
  CameraComponent,
  CopyRotationConstraint,
  LightComponent,
  ModelComponent,
  TransformComponent,
} from '@gglib/components'
import { ContentLoader } from '@gglib/content'
import { GameComponent, GameEntity, InitializableComponent } from '@gglib/ecs'
import { BasicMaterial, Color, CommonInputs, PlatformId } from '@gglib/graphics'
import { GLTF } from '@gglib/loaders'
import { DEGREE_TO_RAD, MS_TO_SEC, Quat, vec3, Vec3 } from '@gglib/math'
import { mountUi } from 'tweak-ui'

const settings = {
  speedX: 0.0,
  speedY: 1.0,
  speedZ: 0.0,
}

export default (canvas: HTMLCanvasElement, tools: HTMLElement, platform: PlatformId) => {
  const game = new Game({ canvas, platform })
  game.run()

  mountUi(tools, (ui) => {
    ui.scalar(settings, 'speedX', { range: true, min: -5, max: 5 })
    ui.scalar(settings, 'speedY', { range: true, min: -5, max: 5 })
    ui.scalar(settings, 'speedZ', { range: true, min: -5, max: 5 })
  })
  return () => game.destroy()
}

class Game extends EcsGame {
  private leader!: GameEntity

  override onInitialize() {
    this.content.registerLoader(GLTF.Loader)
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
        position: vec3(0, 0, 5),
      }),
    })
    this.view.camera = entity.component(CameraComponent)
  }

  private createObjects() {
    // Leader — spins freely, drives all followers
    this.leader = this.createEntity({
      name: 'leader',
      parent: this.scene,
      components: [new ModelComponent(), new CubeLoader('yellow')],
      transform: new TransformComponent({
        position: vec3(0, 2, -5),
      }),
    })

    const source = this.leader.getTransform<TransformComponent>()!

    // Four followers in a row — same source, increasing weight left to right.
    // At steady state each follower lags by a phase offset that shrinks as weight rises.
    const followers: Array<{ x: number; weight: number }> = [
      { x: -8, weight: 0.02 },
      { x: -3, weight: 0.08 },
      { x: 3, weight: 0.3 },
      { x: 8, weight: 1.0 },
    ]

    for (const { x, weight } of followers) {
      this.createEntity({
        parent: this.scene,
        components: [
          new ModelComponent(),
          new CubeLoader('red'),
          new CopyRotationConstraint({
            source,
            sourceSpace: 'world',
            targetSpace: 'world',
            weight,
          }),
        ],
        transform: new TransformComponent({
          position: vec3(x, -2, -5),
        }),
      })
    }
  }

  override onUpdate(time: number, dt: number): void {
    const transform = this.leader.getTransform<TransformComponent>()!
    transform
      .rotateAxisAngle(1, 0, 0, dt * MS_TO_SEC * settings.speedX * 120 * DEGREE_TO_RAD)
      .rotateAxisAngle(0, 1, 0, dt * MS_TO_SEC * settings.speedY * 120 * DEGREE_TO_RAD)
      .rotateAxisAngle(0, 0, 1, dt * MS_TO_SEC * settings.speedZ * 120 * DEGREE_TO_RAD)
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
