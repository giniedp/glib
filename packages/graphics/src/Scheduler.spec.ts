import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { Scheduler } from './Scheduler'

describe('@gglib/graphics/Scheduler', () => {
  let scheduler: Scheduler

  beforeEach(() => {
    scheduler = new Scheduler()
  })

  afterEach(() => {
    scheduler?.dispose()
  })

  it('schedules', async () => {
    expect(scheduler.size).toEqual(0)
    let count = 0
    await scheduler.add((context) => {
      count++
      if (count === 10) {
        context.finish()
      }
    })
    expect(scheduler.size).toEqual(0)
    expect(count).toEqual(10)
  })
})
