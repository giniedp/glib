import { BasicGame, MeshComponent, TransformComponent } from '@gglib/components'
import { GameQuery, GameSystem, GameWorld, GetComponent } from '@gglib/ecs'
import { Device, Mesh } from '@gglib/graphics'
import { ShapeMaterial } from '../../material/ShapeMaterial'
import { DebugShapeComponent, type DebugShapeType } from './DebugShapeComponent'
import {
  createShapeGeometry,
  DebugShapeBufferLayout,
  DebugShapeRenderComponent,
  type DebugShapeMesh,
} from './DebugShapeRenderComponent'

export class DebugShapeSystem extends GameSystem {
  private game: BasicGame
  private world: GameWorld
  private qrShapes: GameQuery
  private root: DebugShapeRenderComponent

  public initialize(world: GameWorld): void {
    this.world = world
    this.game = world.getSystem(BasicGame)
    this.qrShapes = world.query({ required: [DebugShapeComponent] })
  }

  public update() {
    const root = this.getRootComponent()
    this.resetInstances(root)

    // for (const entity of this.qrShapes) {
    //   const ref = entity.component(DebugShapeComponent)
    //   const shape = this.getShape(root, ref.type, ref.solid)
    //   const mesh = shape.mesh.instances
    //   const index = mesh.count
    //   mesh.setCount(index + 1)

    //   const world = ref.entity.getTransform().world
    //   mesh.writeFieldVec4(index, 'position', {
    //     x: world.translationX,
    //     y: world.translationY,
    //     z: world.translationZ,
    //     w: 0,
    //   })
    //   mesh.writeFieldVec4(index, 'scale', ref.scale)
    //   mesh.writeFieldVec4(index, 'color', ref.color)
    // }
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
      root.shapes[key].mesh.instances.setCount(0)
    }
  }

  private getShape(root: DebugShapeRenderComponent, type: DebugShapeType, solid: boolean) {
    const key = `${type}:${solid}`

    if (key in root.shapes) {
      return root.shapes[key]
    }

    const component = new MeshComponent<DebugShapeMesh>()
    const device = this.world.getSystem(Device)
    const geometry = createShapeGeometry(device, type, solid)
    const material = new ShapeMaterial(device)
    component.mesh = new Mesh(device, {
      geometries: [geometry],
      parts: [{ geometryIndex: 0, materialIndex: 0 }],
      materials: [material],
    }).enableInstancing({
      layout: DebugShapeBufferLayout,
      capacity: 1000,
      buffer: device.createBuffer({
        type: 'StorageBuffer',
        readWrite: true,
      }),
    })
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
