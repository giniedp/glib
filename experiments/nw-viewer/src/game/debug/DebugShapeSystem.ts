import { BasicGame, MeshComponent, TransformComponent } from '@gglib/components'
import { GameQuery, GameSystem, GameWorld, GetComponent } from '@gglib/ecs'
import { Device } from '@gglib/graphics'
import { DebugMesh } from './DebugMesh'
import { DebugShapeComponent, type DebugShapeType } from './DebugShapeComponent'
import { DebugShapeRenderComponent } from './DebugShapeRenderComponent'

export class DebugShapeSystem extends GameSystem {
  private game: BasicGame
  private world: GameWorld
  private query: GameQuery
  private root: DebugShapeRenderComponent

  public initialize(world: GameWorld): void {
    this.world = world
    this.game = world.getSystem(BasicGame)
    this.query = world.query({ required: [DebugShapeComponent] })
  }

  public update() {
    const root = this.getRootComponent()
    this.resetInstances(root)

    for (const entity of this.query) {
      const ref = entity.component(DebugShapeComponent)
      const shape = this.getShape(root, ref.type, ref.solid)
      const mesh = shape.mesh
      mesh.startInstance(mesh.getInstanceCount() + 1)

      const world = ref.entity.getTransform().world
      mesh.writePosition({
        x: world.translationX,
        y: world.translationY,
        z: world.translationZ,
        w: 0,
      })
      mesh.writeScale(ref.scale)
      mesh.writeColor(ref.color)
    }

    this.commitInstances(root)
  }

  public destroy(): void {
    //
  }

  private getRootComponent() {
    if (this.root) {
      return this.root
    }

    this.root = this.game.scene.component(DebugShapeRenderComponent, GetComponent.Optional)
    if (this.root) {
      return this.root
    }

    const entity = this.world.createEntity({
      parent: this.game.scene,
      transform: new TransformComponent({
        keepWorld: true,
      }),
      components: [new DebugShapeRenderComponent()],
    })
    this.root = entity.component(DebugShapeRenderComponent)

    return this.root
  }

  private resetInstances(root: DebugShapeRenderComponent) {
    for (const key in root.shapes) {
      const mesh = root.shapes[key].mesh as DebugMesh
      mesh.resetInstanceCount()
    }
  }

  private commitInstances(root: DebugShapeRenderComponent) {
    for (const key in root.shapes) {
      const mesh = root.shapes[key].mesh as DebugMesh
      mesh.commitInstanceData()
    }
  }

  private getShape(root: DebugShapeRenderComponent, type: DebugShapeType, solid: boolean): MeshComponent<DebugMesh> {
    const key = `${type}:${solid}`

    if (key in root.shapes) {
      return root.shapes[key]
    }

    const component = new MeshComponent<DebugMesh>()
    const device = this.world.getSystem(Device)
    component.mesh = new DebugMesh(device, type, solid)
    this.world.createEntity({
      parent: root.entity,
      transform: new TransformComponent({
        keepWorld: true,
      }),
      components: [component],
    })

    root.shapes[key] = component
    return component
  }
}
