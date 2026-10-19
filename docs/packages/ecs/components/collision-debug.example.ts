import {
  BehaviorComponent,
  boxCollider,
  CameraComponent,
  CollisionSystem,
  cylinderCollider,
  DebugDrawSystem,
  EcsGame,
  MouseInputSystem,
  RaycastHit,
  sphereCollider,
  TransformComponent,
} from '@gglib/components'
import { GameComponent, GameEntity } from '@gglib/ecs'
import { MouseListener } from '@gglib/game'
import { Color, PlatformId } from '@gglib/graphics'
import { quatCreateYawPitchRoll, vec3 } from '@gglib/math'
import { mount } from 'tweak-ui'

export default (canvas: HTMLCanvasElement, tools: HTMLElement, platform: PlatformId) => {
  const game = new Game({ canvas, platform, autosize: true })
  game.run()
  const panel = mount(tools, (ui) => {
    ui.bool(game.debug, 'enabled', { label: 'Debug draw' })
    ui.bool(game.collisions, 'debugDraw', { label: 'Colliders' })
    ui.bool(game, 'showGrid', { label: 'Grid' })
    ui.bool(game, 'showAxes', { label: 'Axes' })
  })
  return () => {
    game.destroy()
    panel.dispose()
  }
}

/**
 * The scene has no models, everything is drawn with the DebugDrawSystem
 */
class Game extends EcsGame {
  public readonly collisions = new CollisionSystem({ debugDraw: true })
  public showGrid = true
  public showAxes = true

  public get debug() {
    return this.world.getSystem(DebugDrawSystem)
  }

  private camera!: CameraComponent
  private mouse!: MouseInputSystem
  private ring!: GameEntity
  private hit: RaycastHit | null = null
  private hitResult: RaycastHit = {
    collider: null!,
    entity: null!,
    distance: 0,
    point: vec3(),
  }

  protected override onCreate(): void {
    const canvas = this.device.canvas as HTMLCanvasElement
    this.mouse = new MouseInputSystem({ provider: new MouseListener({ eventTarget: canvas, captureTarget: canvas }) })
    this.world.addSystem(this.mouse)
    // onCreate is called from the base constructor, before the fields of this class are initialized
    this.world.addSystem(new DebugDrawSystem())
  }

  protected override onInitialize(): void {
    // added here, so it runs after the behaviors moved the entities
    this.world.addSystem(this.collisions)

    const camera = this.createEntity({
      name: 'camera',
      parent: this.scene.entity,
      transform: new TransformComponent({ position: vec3(0, 6, 9) }),
      components: [new CameraComponent({ type: 'perspective' })],
    })
    camera.getTransform<TransformComponent>()!.lookAt(vec3(0, 0, 0), vec3(0, 1, 0))
    this.camera = camera.component(CameraComponent)
    this.scene.setCamera(0, this.camera)

    // a spinning ring of colliders, they follow the transform of the parent
    this.ring = this.createEntity({
      name: 'ring',
      parent: this.scene.entity,
      components: [new SpinComponent(0.3, 0, 0)],
    })
    const count = 8
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2
      const collider =
        i % 3 === 0 ? sphereCollider(0.6) : i % 3 === 1 ? boxCollider(vec3(1, 1.4, 0.8)) : cylinderCollider(0.5, 1.4)
      this.createEntity({
        name: `shape ${i}`,
        parent: this.ring,
        transform: new TransformComponent({ position: vec3(Math.cos(angle) * 4, 0, Math.sin(angle) * 4) }),
        components: [collider, new SpinComponent(0.7, 0.5, 0)],
      })
    }

    // a probe moving in and out of the ring
    this.createEntity({
      name: 'probe',
      parent: this.scene.entity,
      components: [sphereCollider(0.8), new ProbeComponent()],
    })
  }

  protected override onUpdate(): void {
    this.camera.aspect = this.device.output.aspectRatio
  }

  protected override onEndUpdate(time: number, dt: number): void {
    super.onEndUpdate(time, dt)
    // after the world update, so the entities have moved and the collider volumes are up to date

    // the collider under the mouse, reusing the result object
    const ray = this.camera.createRay(this.mouse.xNormalized, this.mouse.yNormalized)
    this.hit = this.collisions.raycast(ray, undefined, this.hitResult)

    const debug = this.debug.in(this.scene)
    if (this.showGrid) {
      const size = 8
      for (let i = -size; i <= size; i++) {
        const color = i === 0 ? Color.Gray : Color.DarkSlateGray
        debug.line(vec3(i, -1, -size), vec3(i, -1, size), color)
        debug.line(vec3(-size, -1, i), vec3(size, -1, i), color)
      }
    }
    if (this.showAxes) {
      for (const child of this.ring.children) {
        debug.axes(child.world, 0.8)
      }
    }
    if (this.hit) {
      debug.volume(this.hit.collider.volume, Color.Gold)
      debug.point(this.hit.point, 0.2, Color.Gold)
    }
  }
}

/**
 * Rotates the entity
 */
class SpinComponent implements GameComponent, BehaviorComponent {
  public readonly entity!: GameEntity

  public constructor(
    private yaw: number,
    private pitch: number,
    private roll: number,
  ) {}

  public updateBehavior(time: number): void {
    this.entity
      .getTransform<TransformComponent>()!
      .setRotation(quatCreateYawPitchRoll(time * this.yaw, time * this.pitch, time * this.roll))
  }
}

/**
 * Moves the entity on a path that crosses the ring
 */
class ProbeComponent implements GameComponent, BehaviorComponent {
  public readonly entity!: GameEntity

  public updateBehavior(time: number): void {
    const r = 4 + Math.sin(time * 0.9) * 2
    this.entity.getTransform<TransformComponent>()!.setPosition(Math.cos(time * 0.4) * r, 0, Math.sin(time * 0.4) * r)
  }
}
