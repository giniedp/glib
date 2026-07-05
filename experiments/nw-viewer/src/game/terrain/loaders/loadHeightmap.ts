import { PriorityLane, SchedulerSystem, type ScheduledTask } from '@gglib/components'
import { getRegionHeightmapUrl, getRegionWatermapUrl } from '../../../api'
import type { ContentService } from '../../../content'

export function loadHeightmap(
  content: ContentService,
  scheduler: SchedulerSystem,
  level: string,
  regionName: string,
  done: (result: Float16Array) => void,
): ScheduledTask {
  return scheduler.schedule<Float16Array>({
    lane: PriorityLane.Medium,
    context: null,
    load: async (task) => {
      const request = getRegionHeightmapUrl(level, regionName)
      task.context = await content.fetchTypedRequest(request).then((buffer) => new Float16Array(buffer))
    },
    finalize: (task, err) => {
      done(err ? null : task.context)
    },
  })
}

export function loadWatermap(
  content: ContentService,
  scheduler: SchedulerSystem,
  level: string,
  regionName: string,
  done: (result: Float16Array) => void,
): ScheduledTask {
  return scheduler.schedule<Float16Array>({
    lane: PriorityLane.Medium,
    context: null,
    load: async (task) => {
      const request = getRegionWatermapUrl(level, regionName)
      task.context = await content.fetchTypedRequest(request).then((buffer) => new Float16Array(buffer))
    },
    finalize: (task, err) => {
      done(err ? null : task.context)
    },
  })
}
