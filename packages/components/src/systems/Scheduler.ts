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
  /**
   * A load of this lane is started only while fewer than this many loads (of any lane) are in flight.
   * Lower lanes use smaller values to keep connection slots free for higher lanes.
   * Defaults to {@link SchedulerConfig.maxConcurrent}.
   */
  maxConcurrent?: number
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
  /**
   * Pending tasks by lane. Loads are started lane by lane, so a higher lane always goes first.
   */
  private readonly pendingQueues = new Map<PriorityLane, PriorityQueue<number, ScheduledTask<any>>>()
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
      this.pendingQueues.set(lane, new PriorityQueue<number, ScheduledTask>())
      this.readyQueues.set(lane, new PriorityQueue<number, ScheduledTask>())
    }
  }

  /**
   * Iterates all pending tasks. The queues must not be modified during iteration.
   */
  public *pendingTasks(): Iterable<ScheduledTask> {
    // TODO: this is called every frame. don't use a generator function to avoid GC work
    for (const queue of this.pendingQueues.values()) {
      for (const entry of queue.entries) {
        yield entry.value
      }
    }
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
    this.pendingQueues.get(task.lane)!.push(id, effectivePriority(task), task)
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

    this.inFlight.delete(id)
    for (const queue of this.pendingQueues.values()) {
      queue.remove(id)
    }
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

      const oldLane = task.lane
      task.lane = newLane
      if (this.pendingQueues.get(oldLane)?.remove(id)) {
        this.pendingQueues.get(newLane)!.push(id, effectivePriority(task), task)
      } else if (this.readyQueues.get(oldLane)?.remove(id)) {
        this.readyQueues.get(newLane)!.push(id, effectivePriority(task), task)
      }
    }

    task.dynamicPriority = newPriority
    const priority = effectivePriority(task)

    const pending = this.pendingQueues.get(task.lane)
    if (pending?.has(id)) {
      pending.updatePriority(id, priority)
    } else {
      this.readyQueues.get(task.lane)?.updatePriority(id, priority)
    }
  }

  /**
   * Releases pending tasks that were cancelled by setting `task.cancelled`.
   * Lower lanes may not be pumped for a long time, so their cancelled tasks would linger otherwise.
   */
  public releaseCancelled(): void {
    let cancelled: ScheduledTask[] | null = null
    for (const task of this.pendingTasks()) {
      if (task.cancelled) {
        cancelled ??= []
        cancelled.push(task)
      }
    }
    if (!cancelled) {
      return
    }
    for (const task of cancelled) {
      this.cancel(task)
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
    stats.pending = 0
    for (const queue of this.pendingQueues.values()) {
      stats.pending += queue.size()
    }
    stats.inFlight = this.inFlight.size
    stats.total = this.tasks.size
    return stats
  }

  protected pumpAsync(): void {
    // Loads cancelled by flag are aborted right away, so they do not hold a slot until the load settles
    for (const [id, task] of this.inFlight) {
      if (task.cancelled) {
        this.inFlight.delete(id)
        this.dropCancelled(task, id)
      }
    }

    for (const lane of this.laneOrder) {
      const queue = this.pendingQueues.get(lane)!
      const limit = Math.min(this.config.maxConcurrent, this.config.lanes[lane].maxConcurrent ?? Infinity)
      while (queue.size() > 0) {
        const task = queue.peek()!
        const id = taskIds.get(task)

        if (task.cancelled) {
          queue.pop()
          this.dropCancelled(task, id)
          continue
        }

        if (!task.load) {
          // nothing to load, does not need a slot
          queue.pop()
          task.phase = TaskPhase.Ready
          this.getReadyQueue(task.lane).push(id, effectivePriority(task), task)
          continue
        }

        if (this.inFlight.size >= limit) {
          break
        }
        queue.pop()
        this.startLoad(task, id)
      }
    }
  }

  private startLoad(task: ScheduledTask, id: number): void {
    const controller = new AbortController()
    task._abortController = controller
    task.phase = TaskPhase.Loading
    this.inFlight.set(id, task)

    Promise.resolve(task.load(task, controller.signal))
      .then(() => {
        this.inFlight.delete(id)
        task._abortController = undefined

        if (task.cancelled) {
          this.dropCancelled(task, id)
          return
        }

        task.phase = TaskPhase.Ready
        this.getReadyQueue(task.lane).push(id, effectivePriority(task), task)
      })
      .catch((err) => {
        this.inFlight.delete(id)
        task._abortController = undefined

        if (task.cancelled) {
          this.dropCancelled(task, id)
          return
        }

        console.error('[AsyncScheduler] Error in task load function', err)
        this.finaliseTask(task, id, err instanceof Error ? err : new Error(String(err)))
      })
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

        const id = taskIds.get(task)
        if (task.cancelled) {
          this.dropCancelled(task, id)
          continue
        }

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

  /**
   * Releases a task that was cancelled by setting `task.cancelled` instead of calling {@link cancel}.
   * No-op for tasks that are no longer tracked, e.g. cancelled with {@link cancel}.
   */
  private dropCancelled(task: ScheduledTask, id: number): void {
    if (!this.tasks.has(id)) {
      return
    }
    this.tasks.delete(id)
    task.phase = TaskPhase.Cancelled
    task._abortController?.abort()
    task._abortController = undefined
    this.invokeFinalize(task, new TaskCancelledError())
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
