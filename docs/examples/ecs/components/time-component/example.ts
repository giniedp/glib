import {
  BasicGame,
  BehaviorComponent,
  CameraComponent,
  GameTime,
  LightComponent,
  ModelComponent,
  TimeSystem,
  TransformComponent,
} from '@gglib/components'
import { ContentLoader } from '@gglib/content'
import { GameComponent, GameEntity, InitializableComponent } from '@gglib/ecs'
import { BasicMaterial } from '@gglib/graphics'
import { GLTF, MTL, OBJ } from '@gglib/loaders'
import { DEGREE_TO_RAD, Quat, Vec3 } from '@gglib/math'
import { mountUi } from 'tweak-ui'

export default (canvas: HTMLCanvasElement, tools: HTMLElement) => {
  const game = new Game(canvas)
  const timeSystem = game.world.getSystem(TimeSystem)
  const timeA = timeSystem.getOrCreate('timeA')
  const timeB = timeSystem.getOrCreate('timeB')
  const timeC = timeSystem.getOrCreate('timeC')

  mountUi(tools, (ui) => {
    ui.number(timeA, 'factor', { slider: true, min: -2, max: 2, step: 0.1, label: 'Time A' })
    ui.number(timeB, 'factor', { slider: true, min: -2, max: 2, step: 0.1, label: 'Time B' })
    ui.number(timeC, 'factor', { slider: true, min: -2, max: 2, step: 0.1, label: 'Time C' })
  })

  game.run()
  return () => game.destroy()
}

class Game extends BasicGame {
  public constructor(canvas: HTMLCanvasElement) {
    super({ canvas, platform: 'webgl2' })

    this.content.registerLoader(OBJ.Loader)
    this.content.registerLoader(MTL.Loader)
    this.content.registerLoader(GLTF.Loader)
    this.content.registerMaterial(BasicMaterial, () => true)
    this.createLight()
    this.createCamera()
    this.createPendulums()
  }

  public override initialize(): void {
    super.initialize()
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

  private createPendulums() {
    for (const [x, timeName] of [
      [-4, 'timeA'],
      [0, 'timeB'],
      [4, 'timeC'],
    ] as const) {
      const pivot = this.createEntity({
        parent: this.scene,
        components: [new PendulumComponent(timeName)],
        transform: new TransformComponent({
          position: Vec3.create(x, 1, -5),
        }),
      })

      this.createEntity({
        parent: pivot,
        components: [new ModelComponent(), new BobComponent()],
        transform: new TransformComponent({
          position: Vec3.create(0, -2, 0),
        }),
      })
    }
  }
}

// Swings the pivot around Z using sin(time.total) — each instance reads a different named time
class PendulumComponent implements GameComponent, InitializableComponent, BehaviorComponent {
  public readonly entity!: GameEntity
  private time!: GameTime

  public constructor(private timeName: string) {}

  public initialize(): void {
    this.time = this.entity.service(TimeSystem).getOrCreate(this.timeName)
  }

  public updateBehavior(): void {
    this.entity
      .getTransform<TransformComponent>()!
      .setRotationAxisAngle(0, 0, 1, 45 * Math.sin(this.time.total) * DEGREE_TO_RAD)
  }
}

// Loads the cube mesh — no motion, just the visible bob hanging from its pivot
class BobComponent implements GameComponent, InitializableComponent {
  public readonly entity!: GameEntity

  public initialize(): void {
    const renderable = this.entity.component(ModelComponent)
    const content = this.entity.service(ContentLoader)
    content.loadModel('/models/obj/cube.obj').then((model) => {
      renderable.model = model
    })
  }
}
