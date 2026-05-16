import { PriorityLane, SchedulerSystem, type ScheduledTask } from '@gglib/components'
import type { ContentService } from '../../../content'

export function loadHeightmap(
  content: ContentService,
  scheduler: SchedulerSystem,
  level: string,
  regionName: string,
  done: (result: Float16Array) => void,
): ScheduledTask {
  let result: Float16Array
  const url = `${content.nwbtUrl}/level/${level}/region/${regionName}/region.heightmap`

  return scheduler.schedule({
    lane: PriorityLane.Medium,
    load: async (signal) => {
      await content.loader
        .fetch(url, {
          signal,
          responseType: 'arraybuffer',
        })
        .then((res) => {
          return res.body
        })
        .then((buffer) => {
          result = new Float16Array(buffer)
        })
    },
    onCancel: () => {
      done(null)
    },
    onDone: () => {
      done(result)
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
  let result: Float16Array
  const url = `${content.nwbtUrl}/level/${level}/region/${regionName}/region.watermap`

  return scheduler.schedule({
    lane: PriorityLane.Medium,
    load: async (signal) => {
      await content.loader
        .fetch(url, {
          signal,
          responseType: 'arraybuffer',
        })
        .then((res) => {
          return res.body
        })
        .then((buffer) => {
          result = new Float16Array(buffer)
        })
    },
    onCancel: () => {
      done(null)
    },
    onDone: () => {
      done(result)
    },
  })
}
