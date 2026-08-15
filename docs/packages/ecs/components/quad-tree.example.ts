import {
  EcsGame,
  BoundsComponent,
  CameraComponent,
  KeyboardInputSystem,
  LightComponent,
  ModelComponent,
  MouseInputSystem,
  QuadTree,
  SceneComponent,
  SceneStats,
  SpatialNodeComponent,
  SpatialComponent,
  SpatialSystem,
  TransformComponent,
  WASDComponent,
  OccTree,
} from '@gglib/components'

import { ContentLoader } from '@gglib/content'
import { GameComponent, GameEntity, InitializableComponent } from '@gglib/ecs'
import { BasicMaterial, Color, CommonInputs, DeviceStats, PlatformId } from '@gglib/graphics'
import { GLTF } from '@gglib/loaders'
import { vec3, Vec3 } from '@gglib/math'
import { RenderChannel, Renderer } from '@gglib/render'
import { mountUi } from 'tweak-ui'

export default (canvas: HTMLCanvasElement, tools: HTMLElement, platform: PlatformId) => {
  const game = new Game({ canvas, platform })

  mountUi(tools, (ui) => {
    ui.graph({
      rows: [
        {
          name: 'Frame Time',
          sample: () => game.frameTime ?? 0,
          min: 0,
          max: 50,
        },
        {
          name: 'Objects',
          sample: () => game.sceneStats?.visible ?? 0,
          min: 0,
          max: 50,
        },
      ],
    })
  })
  game.run()
  return () => game.destroy()
}

const WORLD_SIZE = 64
const LEAF_LEVEL = 3
const OBJECT_STRIDE = 16

class Game extends EcsGame {
  public light!: LightComponent
  public deviceStats!: DeviceStats
  public sceneStats!: SceneStats
  public frameTime!: number

  protected override onCreate(): void {
    this.world.addSystem(new MouseInputSystem())
    this.world.addSystem(new KeyboardInputSystem())

    // Register the SpatialSystem in order to enable spatial capabilities.
    this.world.addSystem(new SpatialSystem())

    this.deviceStats = this.device.stats()
  }

  protected override setupEssentialSystems(): void {
    super.setupEssentialSystems()
    const renderer = this.world.getSystem(Renderer)
    this.view = renderer.createView({
      name: 'Main View',
      present: RenderChannel.Color,
    })
    this.scene = this.world.createEntity({
      name: 'Scene',
      transform: new TransformComponent(),
      components: [
        new SceneComponent({ views: [this.view] }),
        // Add a SpatialComponent with a spatial accelerator, in this case a OccTree to the scene
        new SpatialComponent({
          index: OccTree.create({
            min: vec3(-WORLD_SIZE),
            max: vec3(WORLD_SIZE),
            leafLevel: LEAF_LEVEL,
            looseFactor: 1,
          }),
        }),
      ],
    })
  }

  public override onInitialize(): void {
    this.content.registerLoader(GLTF.Loader)
    this.content.registerMaterial(BasicMaterial, () => true)

    this.renderer.clearColor = Color.TransparentBlack
    this.renderer.onContextReady.add((ctx) => {
      ctx.renderInputs.set(CommonInputs.Global.SkyColor, Color.White)
      ctx.renderInputs.set(CommonInputs.Global.GroundColor, Color.White)
    })
    this.createCamera()
    this.createObjects()
  }

  public override onUpdate(t: number, dt: number) {
    this.frameTime = dt
    this.deviceStats = this.device.stats(this.deviceStats)
    this.sceneStats = this.scene.component(SceneComponent).stats(this.sceneStats)
  }

  private createCamera() {
    const entity = this.createEntity({
      name: 'camera',
      parent: this.scene,
      transform: new TransformComponent({
        position: vec3(0, 0, 0),
      }),
      components: [
        new CameraComponent({
          type: 'perspective',
        }),
        new WASDComponent(),
      ],
    })
    this.view.camera = entity.component(CameraComponent)
  }

  private createObjects() {
    const worldMin = -WORLD_SIZE / 2
    const worldMax = WORLD_SIZE / 2
    const perSide = OBJECT_STRIDE
    for (let z = 0; z < perSide; z++) {
      for (let y = 0; y < perSide; y++) {
        for (let x = 0; x < perSide; x++) {
          const position = vec3(
            worldMin + ((x + 0.5) * (worldMax - worldMin)) / perSide,
            worldMin + ((y + 0.5) * (worldMax - worldMin)) / perSide,
            worldMin + ((z + 0.5) * (worldMax - worldMin)) / perSide,
          )
          this.createEntity({
            name: Vec3.format(position),
            parent: this.scene,
            components: [
              // the component that provides the model to the renderer
              new ModelComponent(),
              // our custom model loader, this will feed the ModelComponent
              new CubeLoader(),
              // the spatial component, so that the entity will be placed in the quad tree
              new SpatialNodeComponent(),
              // required by SpatialNodeComponent
              new BoundsComponent(),
            ],
            transform: new TransformComponent({
              scale: vec3(1),
              position: position,
            }),
          })
        }
      }
    }
  }
}

// Loads the cube mesh on initialize
class CubeLoader implements GameComponent, InitializableComponent {
  public readonly entity!: GameEntity
  private color!: string
  public constructor(color?: 'yellow' | 'red' | 'green' | 'blue') {
    this.color = color || ['yellow', 'red', 'green', 'blue'][Math.floor(Math.random() * 3)]
  }

  public initialize(): void {
    const renderable = this.entity.component(ModelComponent)
    const content = this.entity.service(ContentLoader)
    content.loadModel(`/models/gltf/blocks/decorative_block_${this.color}.gltf`).then((model) => {
      renderable.model = model
    })
  }
}
