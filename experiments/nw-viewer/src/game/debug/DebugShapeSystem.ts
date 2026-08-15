import { EcsGame, BoundsComponent, MeshComponent, TransformComponent } from '@gglib/components'
import { GameQuery, GameSystem, GameWorld, GetComponent } from '@gglib/ecs'
import { Device } from '@gglib/graphics'
import { Mat4 } from '@gglib/math'
import { DebugMesh } from './DebugMesh'
import { DebugLayer, DebugShapeComponent, type DebugShapeEntry, type DebugShapeType } from './DebugShapeComponent'
import { DebugShapeRenderComponent } from './DebugShapeRenderComponent'

const tmp1 = Mat4.createIdentity()

export class DebugShapeSystem extends GameSystem {
  private game: EcsGame
  private world: GameWorld
  private activeShapes: GameQuery
  private root: DebugShapeRenderComponent

  public activeLayers: DebugLayer = DebugLayer.Selection

  public initialize(world: GameWorld): void {
    this.world = world
    this.game = world.getSystem(EcsGame)
    this.activeShapes = world.query({ scope: 'active', required: [DebugShapeComponent] })
  }

  public update() {
    const root = this.getRootComponent()
    this.resetInstances(root)
    if (!this.activeLayers) {
      this.commitInstances(root)
      return
    }

    for (const entity of this.activeShapes) {
      const comp = entity.component(DebugShapeComponent)
      // const ref = entity.component(DebugShapeComponent)
      for (const ref of comp.entries) {
        if (!isLayerEnabled(this.activeLayers, ref.layer)) {
          continue
        }

        if (ref.visibleIf && !ref.visibleIf()) {
          continue
        }

        if (ref.boundsBox) {
          const box = entity.component(BoundsComponent).world?.box
          if (!box) {
            continue
          }

          const sizeX = box.max.x - box.min.x
          const sizeY = box.max.y - box.min.y
          const sizeZ = box.max.z - box.min.z

          const world = tmp1
          world.initScaleXYZ(sizeX, sizeY, sizeZ)
          world.setTranslationXYZ(box.min.x + sizeX * 0.5, box.min.y + sizeY * 0.5, box.min.z + sizeZ * 0.5)
          this.pushShape(root, ref, world)
        } else if (ref.boundsSphere) {
          const sphere = entity.component(BoundsComponent).world?.sphere
          if (!sphere) {
            continue
          }

          const world = tmp1
          world.initScaleUniform(sphere.radius)
          world.setTranslation(sphere.center)
          this.pushShape(root, ref, world)
        } else {
          for (const instance of ref.transforms) {
            const world = tmp1
            world.initFrom(instance).premultiply(entity.getTransform().world)
            this.pushShape(root, ref, world)
          }
        }
      }
    }

    this.commitInstances(root)
  }

  private pushShape(root: DebugShapeRenderComponent, ref: DebugShapeEntry, world: Mat4) {
    const shape = this.getShape(root, ref.type, ref.solid)
    const mesh = shape.mesh
    mesh.startInstance(mesh.getInstanceCount() + 1)
    mesh.writeTransform(world)
    mesh.writeColor(ref.color)
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

  public isLayerEnabled(layer: DebugLayer) {
    return isLayerEnabled(this.activeLayers, layer)
  }

  public setLayerEnabled(layer: DebugLayer, enabled: boolean) {
    this.activeLayers = setLayerEnabled(this.activeLayers, layer, enabled)
  }
}

function isLayerEnabled(current: DebugLayer, layer: DebugLayer) {
  return (current & layer) !== 0
}

function setLayerEnabled(current: DebugLayer, layer: DebugLayer, enabled: boolean) {
  if (enabled) {
    return current | layer
  } else {
    return current & ~layer
  }
}
