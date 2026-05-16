import { PriorityLane, SchedulerSystem, type ScheduledTask } from '@gglib/components'
import type { RegionMaterial } from '../../../api'
import type { ContentService } from '../../../content'
import type { TerrainCompositeMaterial } from '../../../material'

export function loadLayerMaterials(
  content: ContentService,
  scheduler: SchedulerSystem,
  data: RegionMaterial,
  done: (result: TerrainCompositeMaterial[]) => void,
): ScheduledTask {
  const result: TerrainCompositeMaterial[] = []

  return scheduler.schedule({
    lane: PriorityLane.Medium,
    load: async (signal) => {
      for (const layer of data.layers || []) {
        if (layer.affectedTiles === '0') {
          // skip layers that are marked as not affecting anything
          // seems to be safe, splat and material textures are usually some dummy data
          continue
        }

        const splat = await content.loadTexture(layer.splatMap)
        const material = await content.loader.loadMaterial<TerrainCompositeMaterial>(layer.material + '.glb', {
          baseUrl: content.nwbtFileUrl,
        })
        material.SplatMap = splat
        result.push(material)
        splat.dispose()

        if (signal.aborted) {
          return
        }
      }
    },
    onCancel: () => {
      done([])
    },
    onDone: () => {
      done(result)
    },
  })
  return
}
