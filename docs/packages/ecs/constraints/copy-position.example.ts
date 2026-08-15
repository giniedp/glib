import { EcsGame, CameraComponent, CopyPositionConstraint, ModelComponent, TransformComponent } from '@gglib/components'
import { ContentLoader } from '@gglib/content'
import { GameComponent, GameEntity, InitializableComponent } from '@gglib/ecs'
import { BasicMaterial, Color, CommonInputs, PlatformId } from '@gglib/graphics'
import { GLTF } from '@gglib/loaders'
import { MS_TO_SEC, vec3 } from '@gglib/math'
import { mountUi } from 'tweak-ui'

const settings = {
  speed: 1,
  radius: 3,
  distance: 0,
}

export default (canvas: HTMLCanvasElement, tools: HTMLElement, platform: PlatformId) => {
  const game = new Game({ canvas, platform, autosize: true })
  game.run()

  mountUi(tools, (ui) => {
    ui.scalar(settings, 'speed', { min: -5, max: 5, range: true })
    ui.scalar(settings, 'radius', { min: 0, max: 5, range: true })
    ui.scalar(settings, 'distance', { min: 0, max: 10, range: true })
  })
  return () => game.destroy()
}

class Game extends EcsGame {
  private leader!: GameEntity

  protected override onInitialize() {
    console.assert(this.scene, 'scene must exist')
    console.assert(this.view, 'view must exist')

    this.renderer.clearColor = Color.TransparentBlack
    this.renderer.onContextReady.add((ctx) => {
      ctx.renderInputs.set(CommonInputs.Global.SkyColor, Color.White)
      ctx.renderInputs.set(CommonInputs.Global.GroundColor, Color.White)
    })

    this.content.registerLoader(GLTF.Loader)
    this.content.registerMaterial(BasicMaterial, () => true)

    this.createCamera()
    this.createObjects()
  }

  private createCamera() {
    const entity = this.createEntity({
      name: 'camera',
      parent: this.scene,
      components: [new CameraComponent({ type: 'perspective' })],
      transform: new TransformComponent({
        position: vec3(0, 0, 8),
      }),
    })
    this.view.camera = entity.component(CameraComponent)
  }

  private createObjects() {
    // Leader, orbits in the XY plane, drives all followers
    this.leader = this.createEntity({
      name: 'leader',
      parent: this.scene,
      components: [new ModelComponent(), new CubeLoader('yellow')],
      transform: new TransformComponent({
        position: vec3(0, 0, 0),
      }),
    })

    const source = this.leader.getTransform<TransformComponent>()!

    // Copies X only, slides left/right with the leader, stays at fixed Y
    this.createEntity({
      name: 'x-follower',
      parent: this.scene,
      components: [
        new ModelComponent(),
        new CubeLoader('red'),
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
        position: vec3(0, -5, -3),
      }),
    })

    // Copies Y only, bobs up/down with the leader, stays at fixed X
    this.createEntity({
      name: 'y-follower',
      parent: this.scene,
      components: [
        new ModelComponent(),
        new CubeLoader('green'),
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
        position: vec3(6, 0, -3),
      }),
    })

    // Copies X and Y with low weight, follows the full orbit but lags visibly behind
    this.createEntity({
      name: 'lag-follower',
      parent: this.scene,
      components: [
        new ModelComponent(),
        new CubeLoader('blue'),
        new CopyPositionConstraint({
          source,
          copyX: false,
          copyY: false,
          copyZ: true,
          sourceSpace: 'world',
          targetSpace: 'world',
          weight: 0.01,
        }),
      ],
      transform: new TransformComponent({
        position: vec3(-6, 0, -3),
      }),
    })
  }

  private t = 0
  public override onUpdate(time: number, dt: number): void {
    super.onUpdate(time, dt)
    this.t += dt * MS_TO_SEC * settings.speed
    this.leader
      .getTransform<TransformComponent>()!
      .setPositionX(Math.cos(this.t) * settings.radius)
      .setPositionY(Math.sin(this.t) * settings.radius)
      .setPositionZ(-settings.distance)
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
