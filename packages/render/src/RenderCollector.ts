import {
  CommonBindingKeys,
  Effect,
  Geometry,
  GeometryBatch,
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
    for (const mesh of item.data.meshes) {
      for (const part of mesh.parts) {
        const material = mesh.getMaterial(part.materialId)
        if (!material) {
          continue
        }
        const effect = material.getEffect(this.variant)
        if (!effect) {
          continue
        }
        material.inputs[CommonBindingKeys.Object.ModelMatrix] = item.transform
        const state = this.list.getState(effect.blendState, effect.depthState, effect.offsetState, effect.cullState)
        this.list.add(part, effect, material.inputs, this.list.getKey(depth, item.layer, 0, state, 0))
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
    for (const part of mesh.parts) {
      const material = mesh.getMaterial(part.materialId)
      if (!material) {
        continue
      }
      const effect = material.getEffect(this.variant)
      if (!effect) {
        continue
      }
      if (effect.instanceBufferKey) {
        if (mesh.instances) {
          mesh.instances.commit()
          effect.program.get(effect.instanceBufferKey).setBuffer(mesh.instances.buffer)
        }
      }
      material.inputs[CommonBindingKeys.Object.ModelMatrix] = item.transform
      const state = this.list.getState(effect.blendState, effect.depthState, effect.offsetState, effect.cullState)
      this.list.add(part, effect, material.inputs, this.list.getKey(depth, item.layer, 0, state, 0))
    }
  }

  public end(): void {
    //
  }
}

export class MeshPartRenderCollector implements RenderCollector<MeshPartRenderItem> {
  private list: RenderList
  private variant: RenderVariant
  private batches = idMap<string, GeometryBatch>()

  public begin(context: RenderContext, list: RenderList): void {
    this.list = list
    this.variant = context.renderVariant

    // reset all batches
    for (const batch of this.batches.values) {
      batch.begin()
    }
  }

  public add(item: MeshPartRenderItem): void {
    const depth = this.list.getDepth(item.transform)
    const part = item.data

    console.assert(!!part.geometry, 'MeshPartRenderItem is missing geometry')
    console.assert(!!part.material, 'MeshPartRenderItem is missing material')

    // select required effect variant, e.g. depth only, or MRT etc
    const material = part.material
    const effect = material.getEffect(this.variant)
    if (!effect) {
      return
    }

    handleMeshInstances(part.geometry, part.instances, effect)

    // autowire per object parameters
    material.inputs[CommonBindingKeys.Object.ModelMatrix] = item.transform
    const state = this.list.getState(effect.blendState, effect.depthState, effect.offsetState, effect.cullState)

    const key = this.list.getKey(depth, item.layer, 0, state, 0)
    this.list.add(part.geometry, effect, material.inputs, key)
  }

  public end(): void {
    // commit batches to render list
    for (const batch of this.batches.values) {
      this.list.add(batch, null, null, this.list.getKey(0, 0, 0, 0, 0))
    }
  }
}

function handleMeshInstances(geometry: Geometry, instances: MeshInstances, effect: Effect) {
  // Resolve instancing before the item enters the render list.
  // MeshInstances is one strategy for instancing, others may set these directly.
  // The contract with the low level renderer is:
  //   1. geometry.instanceCount reflects the number of instances to draw
  //   2. the instance buffer is bound to the program input declared by the effect
  // Everything below this point is instance-strategy agnostic.

  if (effect.instanceBufferKey) {
    if (instances) {
      // Safe to call multiple times per frame, upload only occurs if dirty.
      instances.commit()
      geometry.instanceCount = instances.count // contract with low level
      effect.program.get(effect.instanceBufferKey).setBuffer(instances.buffer)
    }
  }
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
