import {
  Effect,
  Geometry,
  Material,
  type Ownable,
  RenderVariant,
  ResourceOwnership,
} from '@gglib/graphics'
import { idMap } from '@gglib/utils'
import { RenderList } from './RenderList'
import {
  InstanceBatchRenderItem,
  MeshPartRenderItem,
  MeshRenderItem,
  ModelRenderItem,
  RenderCollector,
  RenderContext,
  RenderItem,
  RenderItemType,
} from './Types'

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

        const state = this.list.getState(effect.blendState, effect.depthState, effect.offsetState, effect.cullState)
        const sortKey = this.list.getKey(depth, item.layer, getMaterialId(material), state, getGeometryId(geometry))
        this.list.add(sortKey, geometry, effect, material.inputBlocks, item.transform, item.instance)
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

      const state = this.list.getState(effect.blendState, effect.depthState, effect.offsetState, effect.cullState)
      const sortKey = this.list.getKey(depth, item.layer, getMaterialId(material), state, getGeometryId(geometry))
      this.list.add(sortKey, geometry, effect, material.inputBlocks, item.transform, item.instance)
    }
  }

  public end(): void {
    //
  }
}

let materialIds = 1
let geometryIds = 1

const mtlIdKey = Symbol('materialId')
function getMaterialId(material: Material): number {
  if (!material[mtlIdKey]) {
    material[mtlIdKey] = materialIds++
  }
  return material[mtlIdKey]
}

const geoIdKey = Symbol('geometryId')
function getGeometryId(geometry: Geometry): number {
  if (!geometry[geoIdKey]) {
    geometry[geoIdKey] = geometryIds++
  }
  return geometry[geoIdKey]
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

    const state = this.list.getState(effect.blendState, effect.depthState, effect.offsetState, effect.cullState)
    const sortKey = this.list.getKey(depth, item.layer, getMaterialId(material), state, getGeometryId(geometry))
    this.list.add(sortKey, geometry, effect, material.inputBlocks, item.transform, item.instance)
  }

  public end(): void {
    //
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

/**
 * Adds instance batches as already batched draws, see {@link RenderList.addInstanced}
 */
export class InstanceBatchRenderCollector implements RenderCollector<InstanceBatchRenderItem> {
  private list: RenderList
  private variant: RenderVariant
  public begin(context: RenderContext, list: RenderList): void {
    this.list = list
    this.variant = context.renderVariant
  }

  public add(item: InstanceBatchRenderItem): void {
    const batch = item.data
    const material = batch.material
    const geometry = batch.geometry
    const effect = material?.getEffect(this.variant)
    if (!effect || !geometry) {
      return
    }
    const state = this.list.getState(effect.blendState, effect.depthState, effect.offsetState, effect.cullState)
    // the instances have no common position, depth is left out of the key
    const sortKey = this.list.getKey(0, item.layer, getMaterialId(material), state, getGeometryId(geometry))
    this.list.addInstanced(sortKey, geometry, effect, material.inputBlocks, batch.instanceOffset, batch.instanceCount)
  }

  public end(): void {
    //
  }
}
