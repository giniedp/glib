import {
  BehaviorComponent,
  boxCollider,
  CameraComponent,
  ColliderComponent,
  CollisionSystem,
  cylinderCollider,
  EcsGame,
  ModelComponent,
  MouseInputSystem,
  sphereCollider,
  TransformComponent,
} from '@gglib/components'
import { GameComponent, GameEntity, InitializableComponent } from '@gglib/ecs'
import { MouseListener } from '@gglib/game'
import {
  BasicMaterial,
  boxGeometry,
  Color,
  CommonInputs,
  cylinderGeometry,
  Geometry,
  Mesh,
  PlatformId,
  sphereGeometry,
} from '@gglib/graphics'
import { quatCreateYawPitchRoll, vec3, vec3Normalize } from '@gglib/math'
import { Model } from '@gglib/model'
import { Renderer } from '@gglib/render'

export default (canvas: HTMLCanvasElement, tools: HTMLElement, platform: PlatformId) => {
  const game = new Game({ canvas, platform, autosize: true })
  game.run()
  return () => game.destroy()
}

class Game extends EcsGame {
  private camera!: CameraComponent
  private mouse!: MouseInputSystem
  private collisions!: CollisionSystem
  private hovered: HighlightComponent | null = null

  protected override onCreate(): void {
    const canvas = this.device.canvas as HTMLCanvasElement
    this.mouse = new MouseInputSystem({ provider: new MouseListener({ eventTarget: canvas, captureTarget: canvas }) })
    this.world.addSystem(this.mouse)
    this.collisions = new CollisionSystem()
    this.world.addSystem(this.collisions)
  }

  protected override onInitialize(): void {
    const renderer = this.world.getSystem(Renderer)
    renderer.inputs.set(CommonInputs.Global.AmbientColor, Color.DimGray)
    renderer.inputs.set(CommonInputs.Global.AmbientColorTop, Color.White)
    renderer.inputs.set(CommonInputs.Global.AmbientDirection, vec3Normalize(vec3(0.5, 1, 0.3)))

    const camera = this.createEntity({
      name: 'camera',
      parent: this.scene.entity,
      transform: new TransformComponent({ position: vec3(0, 5, 9) }),
      components: [new CameraComponent({ type: 'perspective' })],
    })
    camera.getTransform<TransformComponent>()!.lookAt(vec3(0, 0, 0), vec3(0, 1, 0))
    this.camera = camera.component(CameraComponent)
    this.scene.setCamera(0, this.camera)

    const device = this.device
    // static obstacles
    this.createShape('sphere', sphereGeometry(device, { radius: 1 }), sphereCollider(1), vec3(-4, 0, 0))
    this.createShape('box', boxGeometry(device, { size: 2 }), boxCollider(vec3(2)), vec3(0, 0, 0), new SpinComponent())
    this.createShape(
      'cylinder',
      cylinderGeometry(device, { radius: 1, height: 2, closeTop: true, closeBottom: true }),
      cylinderCollider(1, 2),
      vec3(4, 0, 0),
    )
    // a sphere moving through the obstacles
    this.createShape(
      'mover',
      sphereGeometry(device, { radius: 0.75 }),
      sphereCollider(0.75),
      vec3(0, 0, 0),
      new MoverComponent(),
    )
  }

  private createShape(
    name: string,
    geometry: Geometry,
    collider: ColliderComponent,
    position = vec3(0),
    ...components: GameComponent[]
  ): GameEntity {
    const material = new BasicMaterial(this.device, { properties: {} })
    const mesh = new Mesh(this.device, {
      geometries: [geometry],
      materials: [material],
      parts: [{ geometryIndex: 0, materialIndex: 0 }],
    })
    return this.createEntity({
      name,
      parent: this.scene.entity,
      transform: new TransformComponent({ position }),
      components: [
        new ModelComponent({ model: new Model(this.device, { meshes: [mesh] }) }),
        collider,
        new HighlightComponent(material),
        ...components,
      ],
    })
  }

  protected override onUpdate(): void {
    this.camera.aspect = this.device.output.aspectRatio

    // pick the shape under the mouse
    const ray = this.camera.createRay(this.mouse.xNormalized, this.mouse.yNormalized)
    const hit = this.collisions.raycast(ray)
    if (this.hovered) {
      this.hovered.hovered = false
    }
    this.hovered = hit?.entity.component(HighlightComponent) ?? null
    if (this.hovered) {
      this.hovered.hovered = true
    }
  }
}

/**
 * Colors the shape while it collides or is hovered
 */
class HighlightComponent implements GameComponent, InitializableComponent, BehaviorComponent {
  public readonly entity!: GameEntity
  public hovered = false
  private overlaps = 0

  public constructor(private material: BasicMaterial) {}

  public initialize(): void {
    this.entity.events.on(ColliderComponent.onCollisionEnter, () => this.overlaps++)
    this.entity.events.on(ColliderComponent.onCollisionExit, () => this.overlaps--)
  }

  public updateBehavior(): void {
    const color = this.hovered ? Color.Gold : this.overlaps > 0 ? Color.Tomato : Color.LightSteelBlue
    this.material.BaseColor = vec3(color.r, color.g, color.b)
  }
}

/**
 * Moves the entity back and forth along the x axis
 */
class MoverComponent implements GameComponent, BehaviorComponent {
  public readonly entity!: GameEntity

  public updateBehavior(time: number): void {
    this.entity.getTransform<TransformComponent>()!.setPosition(Math.sin(time * 0.7) * 7, 0, Math.sin(time * 1.3) * 0.5)
  }
}

/**
 * Rotates the entity, so the box collider changes its orientation
 */
class SpinComponent implements GameComponent, BehaviorComponent {
  public readonly entity!: GameEntity

  public updateBehavior(time: number): void {
    this.entity.getTransform<TransformComponent>()!.setRotation(quatCreateYawPitchRoll(time * 0.6, time * 0.4, 0))
  }
}
