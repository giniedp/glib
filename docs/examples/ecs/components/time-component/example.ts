import {
  CameraComponent,
  createEntity,
  GameLoop,
  LightComponent,
  ModelComponent,
  PerspectiveCameraComponent,
  RenderQuery,
  TimeSystem,
  TransformComponent,
} from '@gglib/components'

import { ContentLoader } from '@gglib/content'
import { GameComponent, GameEntity, GameEntityCollection, GameProvider } from '@gglib/ecs'
import { Color, createDevice } from '@gglib/graphics'
import { GLTF, MTL, OBJ } from '@gglib/loaders'
import { AutoMaterial } from '@gglib/materials'
import { DEGREE_TO_RAD, Quat, Vec3 } from '@gglib/math'
import { BasicRenderPass, Renderer } from '@gglib/render'
import * as TweakUi from 'tweak-ui'

export default (canvas: HTMLCanvasElement, tools: HTMLElement) => {
  const game = new Game(canvas)
  const time = game.get(TimeSystem).getOrCreate('customTime')
  TweakUi.mount(tools, (ui) => {
    ui.slider(time, 'factor', { min: -2, max: 2, step: 0.1, label: 'Time Factor' })
  })
  return game.run()
}

class Game extends GameProvider {
  public loop: GameLoop
  public renderer: Renderer
  public renderQuery: RenderQuery

  public camera: CameraComponent
  public scene = new GameEntityCollection()

  public constructor(canvas: HTMLCanvasElement) {
    super()
    const device = createDevice({ canvas })
    const content = new ContentLoader(device)
    content.registerLoader(OBJ.Loader)
    content.registerLoader(MTL.Loader)
    content.registerLoader(GLTF.Loader)
    content.registerMaterial({
      name: 'BasicEffect',
      type: AutoMaterial,
    })
    this.provide(this)
    this.provide(device)
    this.provide(new Renderer(device))
    this.provide(content)
    this.addSystem(new GameLoop({ autostart: false }))
    this.addSystem(new TimeSystem())

    this.loop = this.get(GameLoop)
    this.renderQuery = new RenderQuery()
    this.renderer = this.get(Renderer)
    this.renderer.steps = [
      new BasicRenderPass({
        clearColor: Color.CornflowerBlue.rgba,
      }),
    ]
  }

  private createLight() {
    const entity = createEntity({
      name: 'light',
      components: [new LightComponent()],
      transform: {
        rotation: Quat.create().initAxisAngle(Vec3.Right, 45 * DEGREE_TO_RAD),
      },
    })
    this.scene.add(entity)
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

  private createObjects() {
    let parent: GameEntity<TransformComponent> = null!
    const count = 5
    for (let i = 0; i < count; i++) {
      const child = createEntity({
        components: [new ModelComponent(), new CubeComponent()],
        transform: {
          position: Vec3.create(i * 1.2, 0, -5),
        },
      })
      if (i == 0) {
        this.scene.add(child)
      } else {
        parent.transform.addChildInWorld(child.transform)
      }
      parent = child
    }

    for (let i = 0; i < count; i++) {
      const child = createEntity({
        components: [new ModelComponent(), new CubeComponent()],
        transform: {
          position: Vec3.create(-i * 1.2, 0, -5),
        },
      })
      if (i == 0) {
        this.scene.add(child)
      } else {
        parent.transform.addChildInWorld(child.transform)
      }
      parent = child
    }
  }

  public run() {
    this.createLight()
    this.createCamera()
    this.createObjects()

    this.initialize()
    this.scene.initialize(this)
    this.scene.activate()

    this.loop.onUpdate.add(this.update)
    this.loop.onDraw.add(this.draw)

    this.loop.run()
    return () => {
      this.loop.stop()
      this.destroy()
    }
  }

  public update = () => {
    //
  }

  public draw = () => {
    this.renderQuery.update(this.scene.entities, this.camera)
    this.renderer.render(this.renderQuery)
  }
}

class CubeComponent implements GameComponent {
  public renderable: ModelComponent
  public loop: GameLoop
  public time: TimeSystem

  public entity: GameEntity<TransformComponent>
  public initialize(entity: GameEntity<TransformComponent>): void {
    this.entity = entity
    this.renderable = entity.component(ModelComponent)
    this.loop = entity.provider.get(GameLoop)
    this.time = entity.provider.get(TimeSystem)

    const content = entity.provider.get(ContentLoader)
    content.loadModel('/assets/models/gltf/box.gltf').then((model) => {
      this.renderable.model = model
    })
  }

  public activate(): void {
    this.loop.onUpdate.add(this.update)
  }

  public deactivate(): void {
    this.loop.onUpdate.remove(this.update)
  }

  public destroy(): void {
    //
  }

  private update = () => {
    const time = this.time.getOrCreate('customTime')
    this.entity.transform.setRotationAxisAngle(0, 0, 1, 10 * Math.sin(time.total) * DEGREE_TO_RAD)
  }
}
