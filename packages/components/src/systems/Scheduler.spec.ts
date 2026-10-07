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

  it('starts loads of higher lanes first, regardless of priority', () => {
    const scheduler = new AsyncScheduler({
      frameBudgetMs: 100,
      maxConcurrent: 1,
      lanes: {
        [PriorityLane.Critical]: { budgetRatio: 1 },
        [PriorityLane.Low]: { budgetRatio: 1 },
      },
    })
    const started: string[] = []
    const load = (name: string) => () => {
      started.push(name)
      return new Promise<void>(() => {})
    }
    scheduler.enqueue({ lane: PriorityLane.Low, basePriority: -1000, load: load('low') })
    scheduler.enqueue({ lane: PriorityLane.Critical, basePriority: 1000, load: load('critical') })

    scheduler.tick()

    expect(started).toEqual(['critical'])
  })

  it('keeps slots free for higher lanes', () => {
    const scheduler = new AsyncScheduler({
      frameBudgetMs: 100,
      maxConcurrent: 4,
      lanes: {
        [PriorityLane.Critical]: { budgetRatio: 1 },
        [PriorityLane.Low]: { budgetRatio: 1, maxConcurrent: 2 },
      },
    })
    const never = () => new Promise<void>(() => {})
    for (let i = 0; i < 5; i++) {
      scheduler.enqueue({ lane: PriorityLane.Low, load: never })
    }
    scheduler.tick()
    expect(scheduler.getStats().inFlight).toBe(2)

    scheduler.enqueue({ lane: PriorityLane.Critical, load: never })
    scheduler.enqueue({ lane: PriorityLane.Critical, load: never })
    scheduler.tick()
    expect(scheduler.getStats().inFlight).toBe(4)
  })

  it('frees the slot of a load cancelled by flag on the next tick', () => {
    const scheduler = createScheduler()
    const finalize = vi.fn()
    let signal: AbortSignal
    const task: ScheduledTask = {
      load: (_, s) => {
        signal = s
        return new Promise<void>(() => {})
      },
      finalize,
    }
    scheduler.enqueue(task)
    scheduler.tick()
    expect(scheduler.getStats().inFlight).toBe(1)

    task.cancelled = true
    scheduler.tick()

    expect(signal.aborted).toBe(true)
    expect(finalize).toHaveBeenCalledWith(task, expect.any(TaskCancelledError))
    expect(scheduler.getStats()).toEqual({ pending: 0, inFlight: 0, total: 0 })
  })

  it('releases cancelled pending tasks of lanes that are not pumped', () => {
    const scheduler = createScheduler()
    const finalize = vi.fn()
    const task: ScheduledTask = { lane: PriorityLane.Low, load: async () => {}, finalize }
    scheduler.enqueue(task)
    task.cancelled = true

    scheduler.releaseCancelled()

    expect(finalize).toHaveBeenCalledWith(task, expect.any(TaskCancelledError))
    expect(scheduler.getStats().total).toBe(0)
  })
})
