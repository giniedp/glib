import { describe, expect, it, vi } from 'vitest'
import { AsyncScheduler, PriorityLane, ScheduledTask, TaskCancelledError } from './Scheduler'

function createScheduler() {
  return new AsyncScheduler({
    frameBudgetMs: 100,
    maxConcurrent: 10,
    maxReadyTasksPerTick: 10,
    lanes: {
      [PriorityLane.Critical]: { budgetRatio: 1 },
      [PriorityLane.High]: { budgetRatio: 1 },
      [PriorityLane.Medium]: { budgetRatio: 1 },
      [PriorityLane.Low]: { budgetRatio: 1 },
    },
  })
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0))

describe('AsyncScheduler', () => {
  it('runs load, work and finalize', async () => {
    const scheduler = createScheduler()
    const finalize = vi.fn()
    const work = vi.fn(() => true)
    scheduler.enqueue({ load: async () => {}, work, finalize })

    scheduler.tick()
    await flush()
    scheduler.tick()

    expect(work).toHaveBeenCalledOnce()
    expect(finalize).toHaveBeenCalledWith(expect.anything(), undefined)
    expect(scheduler.getStats().total).toBe(0)
  })

  it('releases a task cancelled by flag while pending', () => {
    const scheduler = createScheduler()
    const finalize = vi.fn()
    const work = vi.fn(() => true)
    const task: ScheduledTask = { load: async () => {}, work, finalize }
    scheduler.enqueue(task)
    task.cancelled = true

    scheduler.tick()

    expect(work).not.toHaveBeenCalled()
    expect(finalize).toHaveBeenCalledWith(task, expect.any(TaskCancelledError))
    expect(scheduler.getStats()).toEqual({ pending: 0, inFlight: 0, total: 0 })
  })

  it('releases a task cancelled by flag while loading', async () => {
    const scheduler = createScheduler()
    const finalize = vi.fn()
    const work = vi.fn(() => true)
    const task: ScheduledTask = { load: async () => {}, work, finalize }
    scheduler.enqueue(task)

    scheduler.tick()
    task.cancelled = true
    await flush()
    scheduler.tick()

    expect(work).not.toHaveBeenCalled()
    expect(finalize).toHaveBeenCalledOnce()
    expect(finalize).toHaveBeenCalledWith(task, expect.any(TaskCancelledError))
    expect(scheduler.getStats().total).toBe(0)
  })

  it('finalizes a task cancelled with cancel() only once', async () => {
    const scheduler = createScheduler()
    const finalize = vi.fn()
    const task: ScheduledTask = { load: async () => {}, work: () => true, finalize }
    scheduler.enqueue(task)

    scheduler.tick()
    scheduler.cancel(task)
    await flush()
    scheduler.tick()

    expect(finalize).toHaveBeenCalledOnce()
    expect(scheduler.getStats().total).toBe(0)
  })
})
