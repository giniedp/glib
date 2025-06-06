import {
  BasicGame,
  createEntity,
  GameLoop,
  LightComponent,
  LoopTime,
  ModelComponent,
  PerspectiveCameraComponent,
  TransformComponent,
} from '@gglib/components'

import { ContentLoader } from '@gglib/content'
import { GameComponent, GameEntity } from '@gglib/ecs'
import { Color } from '@gglib/graphics'
import { GLTF } from '@gglib/loaders'
import { AutoMaterial } from '@gglib/materials'
import { DEGREE_TO_RAD, Quat, Vec3 } from '@gglib/math'
import { BasicRenderPass } from '@gglib/render'

export default (canvas: HTMLCanvasElement, tools: HTMLElement) => {
  const game = new Game(canvas)
  game.run()
  return () => {
    game.stop()
  }
}

class Game extends BasicGame {
  public constructor(canvas: HTMLCanvasElement) {
    super(canvas)
    this.renderer.steps = [
      new BasicRenderPass({
        clearColor: Color.CornflowerBlue.rgba,
      }),
    ]
    this.content.registerLoader(GLTF.Loader)
    this.content.registerMaterial({
      name: 'BasicEffect',
      type: AutoMaterial,
    })
    this.createLight()
    this.createCamera()
    this.createObjects()
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
}

class CubeComponent implements GameComponent {
  public renderable: ModelComponent

  public get transform(): TransformComponent {
    return this.entity.transform
  }

  public content: ContentLoader
  public loop: GameLoop

  public entity: GameEntity<TransformComponent>
  public initialize(entity: GameEntity<TransformComponent>): void {
    this.entity = entity
    this.renderable = entity.component(ModelComponent)
    this.content = entity.provider.get(ContentLoader)
    this.loop = entity.provider.get(GameLoop)

    this.content.loadModel('/models/gltf/box.gltf').then((model) => {
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

  private update = (time: LoopTime) => {
    this.entity.transform.setRotationAxisAngle(0, 0, 1, 10 * Math.sin(time.total) * DEGREE_TO_RAD)
  }
}
