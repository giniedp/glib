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
    lane: PriorityLane.High,
    load: async (_, signal) => {
      if (signal.aborted) {
        return
      }

      colorMap = await content.loadTexture(data.colorMap)

      if (signal.aborted) {
        return
      }
      normalMap = await content.loadTexture(data.normalMap)

      if (signal.aborted) {
        return
      }

      specularMap = await content.loadTexture(data.specularMap)

      if (signal.aborted) {
        return
      }

      material = await content.loader.loadMaterial<TerrainCompositeMaterial>(data.defaultMaterial + '.glb', {
        baseUrl: content.nwbtFileUrl,
        signal: signal,
      })

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
