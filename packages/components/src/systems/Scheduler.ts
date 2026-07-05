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
export class TaskCancelledError extends Error {
  public constructor() {
    super('Task cancelled')
    this.name = 'TaskCancelledError'
  }
}

export interface ScheduledTask<T = any> {
  lane: PriorityLane
  label?: string
  basePriority?: number
  dynamicPriority?: number
  phase?: TaskPhase
  cancelled?: boolean

  /**
   * The entity this task is associated with. Can be used for auto priority
   * updates based on spatial data.
   */
  entity?: GameEntity

  /**
   * Shared mutable context for the task. May be set on construction and
   * read/written by load, work, and finalize.
   */
  context?: T

  /**
   * Async loading function. Write results into `task.context`.
   * If omitted the task moves straight to Ready.
   */
  load?: (task: ScheduledTask<T>, signal: AbortSignal) => Promise<void>

  /**
   * Main work function. Read/write `task.context` as needed.
   * Return `true` when complete, `false` to be rescheduled for the next tick.
   */
  work?: (task: ScheduledTask<T>, budgetMs: number) => boolean

  /**
   * Called when the task reaches any terminal state.
   *
   * - `error` is `undefined`          → completed successfully
   * - `error` is `TaskCancelledError` → cancelled by user or superseded
   * - `error` is any other `Error`    → load or work threw
   *
   * `task.context` is accessible here for cleanup.
   */
  finalize?: (task: ScheduledTask<T>, error?: TaskCancelledError | Error) => void

  /** @internal */
  _abortController?: AbortController
}

// ---------------------------------------------------------------------------
// Config / Stats
// ---------------------------------------------------------------------------

export interface LaneConfig {
  /**
   * Frame budget ratio for this lane (0–1).
   */
  budgetRatio: number
}

export interface SchedulerConfig {
  /**
   * Maximum number of concurrently in-flight async loads.
   */
  maxConcurrent: number

  /**
   * Total frame budget in milliseconds across all lanes.
   */
  frameBudgetMs: number

  /**
   * Safety cap on ready tasks processed per tick (default: `Infinity`).
   * Prevents frame drops when many cheap tasks are ready simultaneously.
   */
  maxReadyTasksPerTick?: number

  /**
   * Per-lane configuration.
   */
  lanes: Record<PriorityLane, LaneConfig>
}

export interface SchedulerStats {
  pending: number
  inFlight: number
  total: number
}

const taskIds = idProvider(Symbol('SchedulerTask'))

function effectivePriority(task: ScheduledTask): number {
  return (task.basePriority ?? 0) + (task.dynamicPriority ?? 0)
}

export class AsyncScheduler {
  private readonly pending = new PriorityQueue<number, ScheduledTask<any>>()
  private readonly readyQueues = new Map<PriorityLane, PriorityQueue<number, ScheduledTask<any>>>()
  private readonly inFlight = new Map<number, ScheduledTask<any>>()
  private readonly tasks = new Map<number, ScheduledTask<any>>()

  private readonly config: Required<SchedulerConfig>
  private readonly laneOrder: PriorityLane[]

  public constructor(config: SchedulerConfig) {
    this.config = {
      maxReadyTasksPerTick: Infinity,
      ...config,
    }
    this.laneOrder = (Object.keys(config.lanes) as unknown as PriorityLane[])
      .map((k) => Number(k) as PriorityLane)
      .sort((a, b) => a - b)

    for (const lane of this.laneOrder) {
      this.readyQueues.set(lane, new PriorityQueue<number, ScheduledTask>())
    }
  }

  public get pendingEntries(): ReadonlyArray<Readonly<{ value: ScheduledTask }>> {
    return this.pending.entries
  }

  public enqueue<T = unknown>(task: ScheduledTask<T>): void {
    task.lane ??= PriorityLane.Medium
    task.basePriority ??= 0
    task.dynamicPriority ??= 0
    task.phase = TaskPhase.Idle
    task.cancelled = false

    if (!this.laneOrder.includes(task.lane)) {
      throw new Error(`Unknown lane ${task.lane}. Add it to SchedulerConfig.lanes.`)
    }

    const id = taskIds.getOrCreate(task)
    if (this.tasks.has(id)) {
      throw new Error(`Task ${id} is already queued. Cancel it before re-enqueueing.`)
    }

    this.tasks.set(id, task)
    this.pending.push(id, effectivePriority(task), task)
  }

  public cancel(task: ScheduledTask<any>): void {
    if (!task) {
      return
    }

    const id = taskIds.get(task)
    if (id == null) {
      return
    }

    if (!this.tasks.has(id)) {
      return
    }

    task.cancelled = true
    task.phase = TaskPhase.Cancelled

    this.pending.remove(id)
    this.inFlight.delete(id)
    for (const queue of this.readyQueues.values()) {
      queue.remove(id)
    }
    this.tasks.delete(id)

    task._abortController?.abort()
    task._abortController = undefined

    this.invokeFinalize(task, new TaskCancelledError())
  }

  public cancelAll(): void {
    for (const task of [...this.tasks.values()]) {
      this.cancel(task)
    }
  }

  /**
   * Update the priority (and optionally the lane) of a queued or ready task.
   * No-op if the task is not tracked (already done / cancelled).
   */
  public reprioritize(task: ScheduledTask, newPriority: number, newLane?: PriorityLane): void {
    if (!task) {
      return
    }

    const id = taskIds.get(task)
    if (id == null || !this.tasks.has(id)) {
      return
    }

    if (newLane != null && newLane !== task.lane) {
      if (!this.laneOrder.includes(newLane)) {
        throw new Error(`Unknown lane ${newLane}. Add it to SchedulerConfig.lanes.`)
      }

      const oldQueue = this.readyQueues.get(task.lane)
      const newQueue = this.readyQueues.get(newLane)!

      if (oldQueue?.remove(id)) {
        newQueue.push(id, newPriority, task)
      }

      task.lane = newLane
    }

    task.dynamicPriority = newPriority
    const priority = effectivePriority(task)

    if (this.pending.has(id)) {
      this.pending.updatePriority(id, priority)
    } else {
      this.readyQueues.get(task.lane)?.updatePriority(id, priority)
    }
  }

  /**
   * Drive one scheduler tick: pump async loads then process ready work.
   */
  public tick(): void {
    this.pumpAsync()
    this.runReady()
  }

  public getStats(stats?: SchedulerStats): SchedulerStats {
    stats ??= {} as SchedulerStats
    stats.pending = this.pending.size()
    stats.inFlight = this.inFlight.size
    stats.total = this.tasks.size
    return stats
  }

  protected pumpAsync(): void {
    while (this.inFlight.size < this.config.maxConcurrent && this.pending.size() > 0) {
      const task = this.pending.pop()
      if (!task) {
        break
      }

      if (task.cancelled) {
        continue
      }

      const id = taskIds.get(task)

      if (!task.load) {
        task.phase = TaskPhase.Ready
        this.getReadyQueue(task.lane).push(id, effectivePriority(task), task)
        continue
      }

      const controller = new AbortController()
      task._abortController = controller
      task.phase = TaskPhase.Loading
      this.inFlight.set(id, task)

      Promise.resolve(task.load(task, controller.signal))
        .then(() => {
          this.inFlight.delete(id)
          task._abortController = undefined

          if (task.cancelled) {
            return
          }

          task.phase = TaskPhase.Ready
          this.getReadyQueue(task.lane).push(id, effectivePriority(task), task)
        })
        .catch((err) => {
          this.inFlight.delete(id)
          task._abortController = undefined

          if (task.cancelled) {
            return
          }

          console.error('[AsyncScheduler] Error in task load function', err)
          this.finaliseTask(task, id, err instanceof Error ? err : new Error(String(err)))
        })
    }
  }

  protected runReady(): void {
    const { frameBudgetMs, maxReadyTasksPerTick, lanes } = this.config
    let totalSteps = 0

    for (const lane of this.laneOrder) {
      if (totalSteps >= maxReadyTasksPerTick) {
        break
      }

      const queue = this.readyQueues.get(lane)!
      const laneBudget = frameBudgetMs * lanes[lane].budgetRatio
      const laneStart = performance.now()

      while (performance.now() - laneStart < laneBudget && totalSteps < maxReadyTasksPerTick) {
        const task = queue.pop()
        if (!task) {
          break
        }

        if (task.cancelled) {
          continue
        }

        const id = taskIds.get(task)
        task.phase = TaskPhase.Finalizing

        const remaining = laneBudget - (performance.now() - laneStart)
        let done = true
        let error: Error | undefined

        if (task.work) {
          try {
            const result = task.work(task, Math.max(0, remaining))
            done = result ?? true
            if (result == null) {
              console.warn('[AsyncScheduler] task.work returned null/undefined — treating as done', task)
            }
          } catch (err) {
            error = err instanceof Error ? err : new Error(String(err))
          }
        }

        if (error) {
          console.error('[AsyncScheduler] Error in task work function', error)
          this.finaliseTask(task, id, error)
        } else if (done) {
          this.finaliseTask(task, id, undefined)
        } else {
          task.phase = TaskPhase.Ready
          queue.push(id, effectivePriority(task), task)
        }

        totalSteps++
      }
    }
  }

  private getReadyQueue(lane: PriorityLane): PriorityQueue<number, ScheduledTask> {
    const queue = this.readyQueues.get(lane)
    if (!queue) {
      throw new Error(
        `[AsyncScheduler] No ready queue for lane ${lane}. ` + `Ensure the lane is declared in SchedulerConfig.lanes.`,
      )
    }
    return queue
  }

  private finaliseTask(task: ScheduledTask, id: number, error: Error | undefined): void {
    task.phase = error ? TaskPhase.Cancelled : TaskPhase.Done
    if (error) {
      task.cancelled = true
    }
    this.tasks.delete(id)
    this.invokeFinalize(task, error)
  }

  private invokeFinalize(task: ScheduledTask, error: Error | undefined): void {
    try {
      task.finalize?.(task, error)
    } catch (e) {
      console.error('[AsyncScheduler] Error in task finalize callback', e)
    }
  }
}
