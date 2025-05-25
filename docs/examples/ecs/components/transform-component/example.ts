import {
  CameraComponent,
  createEntity,
  GameLoop,
  ModelComponent,
  PerspectiveCameraComponent,
  RenderQuery,
  TransformComponent,
} from '@gglib/components'

import { ContentManager } from '@gglib/content'
import { GameComponent, GameEntity, GameEntityCollection, GameProvider } from '@gglib/ecs'
import { createDevice, Model } from '@gglib/graphics'
import { DEGREE_TO_RAD, Vec3 } from '@gglib/math'
import { Renderer } from '@gglib/render'

class Game extends GameProvider {
  public loop: GameLoop
  public renderer: Renderer
  public renderQuery: RenderQuery

  public camera: CameraComponent
  public scene = new GameEntityCollection()

  public constructor(canvas: HTMLCanvasElement) {
    super()
    const device = createDevice({ canvas })
    this.provide(this)
    this.provide(device)
    this.provide(new Renderer(device))
    this.provide(new ContentManager(device))
    this.addSystem(new GameLoop({ autostart: false }))

    this.loop = this.get(GameLoop)
    this.renderer = this.get(Renderer)
    this.renderQuery = new RenderQuery()

    this.createCamera()
    this.createEntities()
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

  private createEntities() {
    const e1 = createEntity({
      components: [new ModelComponent(), new CubeComponent()],
    })

    const e2 = createEntity({
      components: [new ModelComponent(), new CubeComponent()],
      transform: {
        position: Vec3.create(0, 0, -5),
      },
    })

    const e3 = createEntity({
      components: [new ModelComponent(), new CubeComponent()],
      transform: {
        position: Vec3.create(0, 0, -10),
      },
    })
  }
}

class CubeComponent implements GameComponent {
  public renderable: ModelComponent

  public get transform(): TransformComponent {
    return this.entity.transform
  }

  public content: ContentManager

  public entity: GameEntity<TransformComponent>
  public initialize(entity: GameEntity<TransformComponent>): void {
    this.entity = entity
    this.renderable = entity.component(ModelComponent)
    this.content = entity.provider.get(ContentManager)

    this.content.load('/assets/models/obj/cube.obj', Model).then((model) => {
      this.renderable.model = model
    })
  }

  public activate(): void {
    //
  }

  public deactivate(): void {
    //
  }

  public destroy(): void {
    //
  }
}

// createGame(
//   {
//     device: { canvas: document.getElementById('canvas') as HTMLCanvasElement },
//     autorun: true,
//   },
//   (e) => {
//     e.install(RendererSystem)
//     e.install(Game)
//   },
// )
//   .createChild((e) => {
//     e.name = 'Camera'
//     e.install(PerspectiveCameraComponent)
//   })
//   .createChild((e) => {
//     e.name = 'Light'
//     e.install(LightComponent, { type: LightType.Directional })
//     e.get(TransformComponent).setRotationAxisAngle(1, 0, 0, -1)
//   })
//   .createChild((e) => {
//     buildCube(e, 0, 0, -10)
//     e.createChild((e) => {
//       buildCube(e, 0, 3, 0)
//       e.createChild((e) => {
//         buildCube(e, 0, 3, 0)
//       })
//     })

//     e.createChild((e) => {
//       buildCube(e, 0, -3, 0)
//       e.createChild((e) => {
//         buildCube(e, 0, -3, 0)
//       })
//     })

//     e.createChild((e) => buildCube(e, 3, 0, 0))
//     e.createChild((e) => buildCube(e, -3, 0, 0))
//   })

export default (canvas: HTMLCanvasElement, tools: HTMLElement) => {
  const game = new Game(canvas)
}
