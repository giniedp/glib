import { CommonBindingKeys, Geometry, GeometryBatch, RenderVariant, SpriteBatch, SpriteMode } from '@gglib/graphics'
import { Vec4 } from '@gglib/math'
import { idMap } from '@gglib/utils'
import { RenderList } from './RenderList'
import {
  KeyedRenderItem,
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

  public register<T>(type: RenderItemType<string, T>, collector: RenderCollector<KeyedRenderItem<string, T>>): void {
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
    for (const mesh of item.model.meshes) {
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
    for (const part of item.mesh.parts) {
      const material = item.mesh.getMaterial(part.materialId)
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
    const geometry = item.meshPart.geometry
    const material = item.meshPart.material
    if (!material || !geometry) {
      return
    }
    const effect = material.getEffect(this.variant)
    if (!effect) {
      return
    }
    if (item.meshPart.instanced) {
      const batch = this.getBatch(geometry)
      const instance = batch.next(item.transform, effect.program)
      if (item.meshPart.instanceData1) {
        Vec4.initFrom(instance.row1, item.meshPart.instanceData1)
      }
      if (item.meshPart.instanceData2) {
        Vec4.initFrom(instance.row2, item.meshPart.instanceData2)
      }
    } else {
      material.inputs[CommonBindingKeys.Object.ModelMatrix] = item.transform
      const state = this.list.getState(effect.blendState, effect.depthState, effect.offsetState, effect.cullState)
      this.list.add(geometry, effect, material.inputs, this.list.getKey(depth, item.layer, 0, state, 0))
    }
  }

  private getBatch(geometry: Geometry): GeometryBatch {
    if (!this.batches.has(geometry.uid)) {
      const batch = new GeometryBatch(geometry.device, {
        geometry,
      })
      batch.begin()
      this.batches.set(geometry.uid, batch)
    }
    return this.batches.get(geometry.uid)
  }

  public end(): void {
    // commit batches to render list
    for (const batch of this.batches.values) {
      this.list.add(batch, null, null, this.list.getKey(0, 0, 0, 0, 0))
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
    const data = item.sprite
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
