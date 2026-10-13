import { BoundsComponent, EcsGame, MeshComponent, TransformComponent } from '@gglib/components'
import { GameEntity, GameSystem, GameWorld, GetComponent } from '@gglib/ecs'
import { Device } from '@gglib/graphics'
import {
  type Mat4,
  mat4$initFrom,
  mat4$initScaleUniform,
  mat4$initScaleXYZ,
  mat4$premultiply,
  mat4$setTranslation,
  mat4$setTranslationXYZ,
  mat4Identity,
} from '@gglib/math'
import { idMap, type IdMap } from '@gglib/utils'
import { DebugMesh } from './DebugMesh'
import { DebugLayer, DebugShapeComponent, type DebugShapeEntry } from './DebugShapeComponent'
import { DebugShapeRenderComponent } from './DebugShapeRenderComponent'

const tmp1 = mat4Identity()

export class DebugShapeSystem extends GameSystem {
  private game: EcsGame
  private world: GameWorld
  private root: DebugShapeRenderComponent
  private index = idMap<number, IdMap<number, DebugShapeEntry>>()

  public activeLayers: DebugLayer = DebugLayer.Selection

  public initialize(world: GameWorld): void {
    this.world = world
    this.game = world.getSystem(EcsGame)

    world.eventBus.on(GameEntity.onActivated, (entity) => {
      const component = entity.$(DebugShapeComponent, GetComponent.Optional)
      if (component) {
        this.trackComponent(component)
      }
    })
    world.eventBus.on(GameEntity.onDeactivating, (entity) => {
      const component = entity.$(DebugShapeComponent, GetComponent.Optional)
      if (component) {
        this.untrackComponent(component)
      }
    })
  }

  public update() {
    const root = this.getRootComponent()
    this.resetInstances(root)
    this.collectInstances(root)
    this.commitInstances(root)
  }

  private trackComponent(component: DebugShapeComponent) {
    this.untrackComponent(component)
    component.entity.events.on(DebugShapeComponent.onShapeAdded, this.handleShapeAdded)
    component.entity.events.on(DebugShapeComponent.onShapeRemoved, this.handleShapeRemoved)
    for (const entry of component.entries) {
      this.handleShapeAdded(entry)
    }
  }

  private untrackComponent(component: DebugShapeComponent) {
    component.entity.events.off(DebugShapeComponent.onShapeAdded, this.handleShapeAdded)
    component.entity.events.off(DebugShapeComponent.onShapeRemoved, this.handleShapeRemoved)
    for (const entry of component.entries) {
      this.handleShapeRemoved(entry)
    }
  }

  private handleShapeAdded = (entry: DebugShapeEntry) => {
    if (!this.index.has(entry.layer)) {
      this.index.set(entry.layer, idMap())
    }
    this.index.get(entry.layer).set(entry.id, entry)
  }

  private handleShapeRemoved = (entry: DebugShapeEntry) => {
    this.index.get(entry.layer)?.delete(entry.id)
  }

  private collectInstances(root: DebugShapeRenderComponent) {
    for (const layer of this.index.keys) {
      if (!isLayerEnabled(this.activeLayers, layer)) {
        continue
      }
      for (const shape of this.index.get(layer).values) {
        if (shape.visibleIf && !shape.visibleIf()) {
          continue
        }

        if (shape.boundsBox) {
          const box = shape.entity.$(BoundsComponent).world?.box
          if (!box) {
            continue
          }

          const sizeX = box.max.x - box.min.x
          const sizeY = box.max.y - box.min.y
          const sizeZ = box.max.z - box.min.z

          const world = tmp1
          mat4$initScaleXYZ(world, sizeX, sizeY, sizeZ)
          mat4$setTranslationXYZ(world, box.min.x + sizeX * 0.5, box.min.y + sizeY * 0.5, box.min.z + sizeZ * 0.5)
          this.writeShapeInstance(root, shape, world)
        } else if (shape.boundsSphere) {
          const sphere = shape.entity.$(BoundsComponent).world?.sphere
          if (!sphere) {
            continue
          }

          const world = tmp1
          mat4$initScaleUniform(world, sphere.radius)
          mat4$setTranslation(world, sphere.center)
          this.writeShapeInstance(root, shape, world)
        } else {
          for (const instance of shape.transforms) {
            const world = tmp1
            mat4$initFrom(world, instance)
            mat4$premultiply(world, shape.entity.getTransform().world)
            this.writeShapeInstance(root, shape, world)
          }
        }
      }
    }
  }

  private writeShapeInstance(root: DebugShapeRenderComponent, entry: DebugShapeEntry, world: Mat4) {
    const mesh = this.getShape(root, entry).mesh
    mesh.startInstance(mesh.getInstanceCount() + 1)
    mesh.writeTransform(world)
    mesh.writeColor(entry.color)
  }

  public destroy(): void {
    //
  }

  private getRootComponent() {
    if (this.root) {
      return this.root
    }

    this.root = this.game.scene.entity.component(DebugShapeRenderComponent, GetComponent.Optional)
    if (this.root) {
      return this.root
    }

    const entity = this.world.createEntity({
      parent: this.game.scene.entity,
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

  private getShape(root: DebugShapeRenderComponent, ref: DebugShapeEntry): MeshComponent<DebugMesh> {
    const key = ref.key
    if (key in root.shapes) {
      return root.shapes[key]
    }

    const component = new MeshComponent<DebugMesh>()
    const device = this.world.getSystem(Device)
    component.mesh = new DebugMesh(device, ref.geometry(device, ref.solid))
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
