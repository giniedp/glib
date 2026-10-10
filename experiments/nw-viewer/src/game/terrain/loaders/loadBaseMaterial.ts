import { PriorityLane, SchedulerSystem, type ScheduledTask } from '@gglib/components'
import type { Texture } from '@gglib/graphics'
import type { RegionMaterial } from '../../../api'
import type { ContentService } from '../../../content'
import type { TerrainCompositeMaterial } from '../../../material'
import type { TerrainMacroMaps } from '../TerrainRegionComponent'

export interface BaseMaterialResult {
  /**
   * Default material of the region, may be shared with other regions (loader cache), must not hold region state
   */
  material: TerrainCompositeMaterial
  /**
   * Macro maps of the region, owned by the caller
   */
  macro: TerrainMacroMaps
}

export function loadBaseMaterial(
  content: ContentService,
  scheduler: SchedulerSystem,
  data: RegionMaterial,
  done: (result: BaseMaterialResult) => void,
): ScheduledTask {
  let color: Texture
  let normal: Texture
  let gloss: Texture
  let material: TerrainCompositeMaterial

  return scheduler.schedule({
    lane: PriorityLane.Critical,
    load: async (_, signal) => {
      signal.throwIfAborted()

      color = await content.loadTexture(data.colorMap)
      signal.throwIfAborted()

      normal = await content.loadTexture(data.normalMap)
      signal.throwIfAborted()

      gloss = await content.loadTexture(data.specularMap)
      signal.throwIfAborted()

      material = (await content.loader.loadMaterial(data.defaultMaterial + '.glb', {
        baseUrl: content.nwbtFileUrl,
        signal: signal,
      })) as TerrainCompositeMaterial
      signal.throwIfAborted()
    },
    finalize: (_, err) => {
      if (err || !material) {
        color?.dispose()
        normal?.dispose()
        gloss?.dispose()
        done(null)
      } else {
        done({ material, macro: { color, normal, gloss } })
      }
      color = normal = gloss = null
      material = null
    },
  })
}
