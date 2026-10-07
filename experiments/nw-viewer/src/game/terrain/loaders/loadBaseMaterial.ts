import { PriorityLane, SchedulerSystem, type ScheduledTask } from '@gglib/components'
import type { Texture } from '@gglib/graphics'
import type { RegionMaterial } from '../../../api'
import type { ContentService } from '../../../content'
import type { TerrainCompositeMaterial } from '../../../material'

export function loadBaseMaterial(
  content: ContentService,
  scheduler: SchedulerSystem,
  data: RegionMaterial,
  done: (result: TerrainCompositeMaterial) => void,
): ScheduledTask {
  let colorMap: Texture
  let normalMap: Texture
  let specularMap: Texture
  let material: TerrainCompositeMaterial

  return scheduler.schedule({
    lane: PriorityLane.Critical,
    load: async (_, signal) => {
      signal.throwIfAborted()

      colorMap = await content.loadTexture(data.colorMap)
      signal.throwIfAborted()

      normalMap = await content.loadTexture(data.normalMap)
      signal.throwIfAborted()

      specularMap = await content.loadTexture(data.specularMap)
      signal.throwIfAborted()

      const result = await content.loader.loadMaterial(data.defaultMaterial + '.glb', {
        baseUrl: content.nwbtFileUrl,
        signal: signal,
      })
      signal.throwIfAborted()

      material = result as TerrainCompositeMaterial
      if (!material) {
        return
      }

      material.SplatMap = content.whitePixel

      if (colorMap) {
        material.MacroBaseMap = colorMap
        colorMap.dispose()
        colorMap = null
      }

      if (normalMap) {
        material.MacroNormalMap = normalMap
        normalMap.dispose()
        normalMap = null
      }

      if (specularMap) {
        material.MacroGlossMap = specularMap
        specularMap.dispose()
        specularMap = null
      }
    },
    finalize: (_, err) => {
      if (material) {
        if (colorMap) {
          material.MacroBaseMap = colorMap
        }

        if (normalMap) {
          material.MacroNormalMap = normalMap
        }

        if (specularMap) {
          material.MacroGlossMap = specularMap
        }
      }

      colorMap?.dispose()
      colorMap = null

      normalMap?.dispose()
      normalMap = null

      specularMap?.dispose()
      specularMap = null

      if (err) {
        material.dispose()
        done(null)
      } else {
        done(material)
      }
      material = null
    },
  })
}
