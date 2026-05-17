import {
  CommonBindingKeys,
  Effect,
  Geometry,
  Material,
  MeshInstances,
  RenderVariant,
  SpriteBatch,
  SpriteMode,
} from '@gglib/graphics'
import { idMap } from '@gglib/utils'
import { RenderList } from './RenderList'
import {
  MeshPartRenderItem,
  MeshRenderItem,
  ModelRenderItem,
  RenderCollector,
  RenderContext,
  RenderItem,
  RenderItemType,
  SpriteRenderItem,
} from './types'

export class RenderCollectorRegistry {
  private collectors = idMap<string, RenderCollector<RenderItem>>()

  public register<T>(type: RenderItemType<string, T>, collector: RenderCollector<RenderItem<T>>): void {
    this.collectors.set(type, collector as RenderCollector<RenderItem>)
  }

  public begin(context: RenderContext, list: RenderList): void {
    for (const collector of this.collectors.values) {
      collector.begin(context, list)
    }
  }

  public add<T extends RenderItem>(item: T): void {
    if (!this.collectors.has(item.type)) {
      console.warn(`No render collector registered for items of type ${item.type}`)
      const collector = new NullRenderCollector()
      this.collectors.set(item.type, collector)
    }
    this.collectors.get(item.type).add(item)
  }

  public end(): void {
    for (const collector of this.collectors.values) {
      collector.end()
    }
  }
}

export class ModelRenderCollector implements RenderCollector<ModelRenderItem> {
  private list: RenderList
  private variant: RenderVariant
  public begin(context: RenderContext, list: RenderList): void {
    this.list = list
    this.variant = context.renderVariant
  }

  public add(item: ModelRenderItem): void {
    const depth = this.list.getDepth(item.transform)

    let material: Material
    let geometry: Geometry
    let effect: Effect

    for (const mesh of item.data.meshes) {
      for (const part of mesh.parts) {
        material = mesh.materials[part.materialIndex]
        if (!material) {
          continue
        }

        geometry = mesh.geometries[part.geometryIndex]
        if (!geometry) {
          continue
        }

        effect = material.getEffect(this.variant)
        if (!effect) {
          continue
        }

        if (!handleMeshInstances(geometry, mesh.instances, effect)) {
          continue
        }

        material.inputs[CommonBindingKeys.Object.ModelMatrix] = item.transform
        const state = this.list.getState(effect.blendState, effect.depthState, effect.offsetState, effect.cullState)
        this.list.add(geometry, effect, material.inputs, this.list.getKey(depth, item.layer, 0, state, 0))
      }
    }
  }

  public end(): void {
    //
  }
}

export class MeshRenderCollector implements RenderCollector<MeshRenderItem> {
  private list: RenderList
  private variant: RenderVariant
  public begin(context: RenderContext, list: RenderList): void {
    this.list = list
    this.variant = context.renderVariant
  }

  public add(item: MeshRenderItem): void {
    const depth = this.list.getDepth(item.transform)
    const mesh = item.data

    let material: Material
    let geometry: Geometry
    let effect: Effect
    for (const part of mesh.parts) {
      material = mesh.materials[part.materialIndex]
      if (!material) {
        continue
      }

      geometry = mesh.geometries[part.geometryIndex]
      if (!geometry) {
        continue
      }

      effect = material.getEffect(this.variant)
      if (!effect) {
        continue
      }

      if (!handleMeshInstances(geometry, mesh.instances, effect)) {
        continue
      }

      material.inputs[CommonBindingKeys.Object.ModelMatrix] = item.transform
      const state = this.list.getState(effect.blendState, effect.depthState, effect.offsetState, effect.cullState)
      this.list.add(geometry, effect, material.inputs, this.list.getKey(depth, item.layer, 0, state, 0))
    }
  }

  public end(): void {
    //
  }
}

export class MeshPartRenderCollector implements RenderCollector<MeshPartRenderItem> {
  private list: RenderList
  private variant: RenderVariant
  public begin(context: RenderContext, list: RenderList): void {
    this.list = list
    this.variant = context.renderVariant
  }

  public add(item: MeshPartRenderItem): void {
    const depth = this.list.getDepth(item.transform)
    const mesh = item.data

    let material: Material
    let geometry: Geometry
    let effect: Effect

    material = mesh.material
    if (!material) {
      return
    }

    geometry = mesh.geometry
    if (!geometry) {
      return
    }

    effect = material.getEffect(this.variant)
    if (!effect) {
      return
    }

    if (!handleMeshInstances(geometry, mesh.instances, effect)) {
      return
    }

    material.inputs[CommonBindingKeys.Object.ModelMatrix] = item.transform
    const state = this.list.getState(effect.blendState, effect.depthState, effect.offsetState, effect.cullState)
    this.list.add(geometry, effect, material.inputs, this.list.getKey(depth, item.layer, 0, state, 0))
  }

  public end(): void {
    //
  }
}

function handleMeshInstances(geometry: Geometry, instances: MeshInstances, effect: Effect): boolean {
  // Resolve instancing before the item enters the render list.
  // MeshInstances is one strategy for instancing, others may set these directly.
  // The contract with the low level renderer is:
  //   1. geometry.instanceCount reflects the number of instances to draw
  //   2. the instance buffer is bound to the program input declared by the effect
  // Everything below this point is instance-strategy agnostic.

  if (!effect.needsInstanceBuffer) {
    return true
  }

  if (!instances) {
    console.warn(`Effect '${effect.name}' requires instancing but no instance data was provided.`, effect)
    return true
  }

  if (instances.count === 0) {
    return false
  }

  // Safe to call multiple times per frame, upload only occurs if dirty.
  instances.commit()
  geometry.instanceCount = instances.count // contract with low level
  effect.program.get(effect.instanceBufferKey).setBuffer(instances.buffer)

  return true
}

export class SpriteRenderCollector implements RenderCollector<SpriteRenderItem> {
  private list: RenderList
  private spriteBatch: SpriteBatch
  public begin(context: RenderContext, list: RenderList): void {
    this.list = list
    this.spriteBatch ||= new SpriteBatch(context.device)
    this.spriteBatch.begin(SpriteMode.Deferred, context.view.camera.projection)
  }

  public add(item: SpriteRenderItem): void {
    const data = item.data
    const sprite = this.spriteBatch.next(
      data.texture,
      data.source,
      data.destination,
      data.depth,
      data.angle,
      data.pivotX,
      data.pivotY,
    )
    if (data.color) {
      sprite.tint(data.color)
    }
    if (data.flipX) {
      sprite.flipX()
    }
    if (data.flipY) {
      sprite.flipY()
    }
    if (data.transform) {
      sprite.transform.premultiply(data.transform)
    }
  }

  public end(): void {
    this.list.add(this.spriteBatch, null, null, this.list.getKey(0, 0, 0, 0, 0))
  }
}

export class NullRenderCollector implements RenderCollector<RenderItem> {
  public begin(context: RenderContext, list: RenderList): void {
    //
  }

  public add(item: RenderItem): void {
    //
  }

  public end(): void {
    //
  }
}
