import { GameEntity, idProvider } from '@gglib/ecs'
import { brand, Brand, PriorityQueue } from '@gglib/utils'

export type TaskPhase = Brand<number, 'TaskPhase'>

export const TaskPhase = {
  Idle: brand<TaskPhase>(0),
  Loading: brand<TaskPhase>(1),
  Ready: brand<TaskPhase>(2),
  Finalizing: brand<TaskPhase>(3),
  Done: brand<TaskPhase>(4),
  Cancelled: brand<TaskPhase>(5),
} as const

export type PriorityLane = Brand<number, 'PriorityLane'>

export const PriorityLane = {
  Critical: brand<PriorityLane>(0),
  High: brand<PriorityLane>(1),
  Medium: brand<PriorityLane>(2),
  Low: brand<PriorityLane>(3),
} as const

export interface ScheduledTask<T = unknown> {
  lane: PriorityLane

  basePriority?: number

  dynamicPriority?: number

  phase?: TaskPhase

  cancelled?: boolean

  /**
   * The result of the task, if applicable
   */
  result?: T | null

  /**
   * The entity this task is associated with. Can be used for auto priority updates based on spatial data
   */
  entity?: GameEntity

  /**
   * The async loading function for the task.
   */
  load?: (signal: AbortSignal) => Promise<void>

  /**
   * The main work function for the task. Should return true if the task is complete, or false if it needs more time and should be rescheduled for another tick.
   */
  work?: (budgetMs: number) => boolean

  /**
   * Called when the task is cancelled, either by user action or due to an error.
   */
  onCancel?: () => void
  /**
   * Called when the task is completed successfully.
   */
  onDone?: () => void

  /**
   * @internal
   */
  _abortController?: AbortController
}

export interface LaneConfig {
  /**
   * Frame budget ratio for this lane
   */
  budgetRatio: number
}

export interface SchedulerConfig {
  /**
   * Async concurrency cap. Tasks beyond this will wait in the pending queue until a slot is available.
   */
  maxConcurrent: number

  /**
   * Total frame budget in milliseconds. The scheduler will try to keep within this budget by deferring ready tasks to future ticks as needed.
   */
  frameBudgetMs: number

  /**
   * Fraction for finalization (default 1.0)
   */
  readyBudgetRatio?: number

  /**
   * Safety cap for number of ready tasks to process per tick (default Infinity).
   * This is to prevent pathological cases where too many ready tasks cause frame drops, even if they are individually cheap.
   */
  maxReadyTasksPerTick?: number

  /**
   * Configuration for each lane. Tasks in different lanes can have different budget ratios,
   * which allows prioritizing certain types of work over others.
   */
  lanes: Record<PriorityLane, LaneConfig>
}

export interface SchedulerStats {
  pending: number
  inFlight: number
  total: number
}

const taskIds = idProvider(Symbol('SchedulerTask'))

export class AsyncScheduler {
  private pending = new PriorityQueue<number, ScheduledTask>()
  private readyQueues = new Map<PriorityLane, PriorityQueue<number, ScheduledTask>>()
  private inFlight = new Map<number, ScheduledTask>()
  private tasks = new Map<number, ScheduledTask>()

  private config: SchedulerConfig
  private laneOrder: PriorityLane[]

  public constructor(config: SchedulerConfig) {
    this.config = {
      readyBudgetRatio: 1.0,
      maxReadyTasksPerTick: Infinity,
      ...config,
    }
    this.laneOrder = Object.keys(config.lanes)
      .map((k) => Number(k) as PriorityLane)
      .sort((a, b) => a - b)

    for (const lane of this.laneOrder) {
      this.readyQueues.set(lane, new PriorityQueue<number, ScheduledTask>())
    }
  }

  public get pendingEntries(): ReadonlyArray<Readonly<{ value: ScheduledTask }>> {
    return this.pending.entries
  }

  public enqueue(task: ScheduledTask) {
    task.phase = TaskPhase.Idle
    task.cancelled = false
    task.dynamicPriority ??= 0
    task.basePriority ??= 0
    task.lane ??= PriorityLane.Medium
    const id = taskIds.getOrCreate(task)

    if (this.tasks.has(id)) {
      throw new Error(`Task with id ${id} already exists`)
    }
    this.tasks.set(id, task)
    this.pending.push(id, task.dynamicPriority, task)
  }

  public cancel(task: ScheduledTask) {
    if (!task) {
      return
    }
    const id = taskIds.get(task)

    task.cancelled = true
    task.phase = TaskPhase.Cancelled

    for (const queue of this.readyQueues.values()) {
      queue.remove(id)
    }
    this.pending.remove(id)
    this.inFlight.delete(id)
    this.tasks.delete(id)

    try {
      task._abortController?.abort()
      task.onCancel?.()
    } catch (e) {
      console.error('Error in task onCancel callback', e)
    }
  }

  public cancelAll() {
    for (const task of this.tasks.values()) {
      this.cancel(task)
    }
  }

  public reprioritize(task: ScheduledTask, newPriority: number, newLane?: PriorityLane) {
    if (!task) {
      return
    }
    const id = taskIds.get(task)

    const oldLane = task.lane
    task.dynamicPriority = newPriority

    if (newLane != null && newLane != oldLane) {
      task.lane = newLane

      // move between ready queues if necessary
      const oldQueue = this.readyQueues.get(oldLane)
      const newQueue = this.readyQueues.get(newLane)

      if (oldQueue?.remove(id)) {
        newQueue?.push(id, newPriority, task)
      }
    }

    // update whichever queue it is in
    if (this.pending.has(id)) {
      this.pending.updatePriority(id, newPriority)
    } else {
      const queue = this.readyQueues.get(task.lane)
      queue?.updatePriority(id, newPriority)
    }
  }

  public tick() {
    this.pumpAsync()
    this.runReady()
  }

  protected pumpAsync() {
    while (this.inFlight.size < this.config.maxConcurrent && this.pending.size() > 0) {
      const task = this.pending.pop()

      if (!task) {
        break
      }

      if (task.cancelled) {
        continue
      }

      if (!task.load) {
        task.phase = TaskPhase.Ready

        this.readyQueues.get(task.lane)!.push(taskIds.get(task), task.dynamicPriority, task)
        continue
      }

      const controller = new AbortController()
      task._abortController = controller

      task.phase = TaskPhase.Loading
      this.inFlight.set(taskIds.get(task), task)

      task
        .load(controller.signal)
        .then(() => {
          this.inFlight.delete(taskIds.get(task))
          if (task.cancelled) {
            return
          }

          task.phase = TaskPhase.Ready
          this.readyQueues.get(task.lane)!.push(taskIds.get(task), task.dynamicPriority, task)
        })
        .catch((err) => {
          console.error('Error in task load function', err)

          this.inFlight.delete(taskIds.get(task))
          if (task.cancelled) {
            return
          }

          task.phase = TaskPhase.Cancelled
          this.tasks.delete(taskIds.get(task))
        })
    }
  }

  protected runReady() {
    const frameBudget = this.config.frameBudgetMs
    let totalSteps = 0

    for (const lane of this.laneOrder) {
      const queue = this.readyQueues.get(lane)!
      const laneBudget = frameBudget * this.config.lanes[lane].budgetRatio

      const start = performance.now()

      while (performance.now() - start < laneBudget && totalSteps < (this.config.maxReadyTasksPerTick ?? Infinity)) {
        const task = queue.pop()
        if (!task) {
          break
        }
        if (task.cancelled) {
          continue
        }

        task.phase = TaskPhase.Finalizing
        const taskId = taskIds.get(task)

        let done = true
        let error: any = null

        if (task.work) {
          const remaining = laneBudget - (performance.now() - start)

          try {
            done = task.work(Math.max(0, remaining))
          } catch (err) {
            error = err
          }
        }

        if (error) {
          task.phase = TaskPhase.Done
          this.tasks.delete(taskId)
          console.error('Error in task work function', error)
        } else if (done) {
          task.phase = TaskPhase.Done
          this.tasks.delete(taskId)
          try {
            task.onDone?.()
          } catch (e) {
            console.error('Error in task onDone callback', e)
          }
        } else {
          task.phase = TaskPhase.Ready
          queue.push(taskId, task.dynamicPriority, task)
        }

        totalSteps++
      }
    }
  }

  public getStats(stats?: SchedulerStats): SchedulerStats {
    stats ||= {} as SchedulerStats
    stats.pending = this.pending.size()
    stats.inFlight = this.inFlight.size
    stats.total = this.tasks.size
    return stats
  }
}
