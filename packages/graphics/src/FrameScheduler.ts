import { loop } from '@gglib/utils'

export type FrameFn<T = unknown> = (context: FrameContext<T>) => void
export interface FrameContext<T = unknown> {
  /**
   * The frame number
   */
  frame: number
  /**
   * Current time in seconds
   */
  time: number
  /**
   * Delta time in seconds since last frame
   */
  delta: number
  /**
   * Marks the task as complete with given result value
   *
   * @param value
   */
  complete(value: T): void
  /**
   * Cancels the task with given reason or error
   *
   * @param reason
   */
  cancel(reason?: any): void
}

export interface FrameTaskOptions<T> {
  work: FrameFn<T>
  schedule: Function
  unschedule: Function
  signal?: AbortSignal
}

export class FrameTask<T = unknown> {
  public readonly work: FrameFn<T>
  public readonly schedule: Function
  public readonly unschedule: Function
  public readonly context: FrameContext<T>
  public readonly result: Promise<T>
  public readonly signal: AbortSignal

  public get isCompleted() {
    return this.#resolved || this.#rejected || !!this.signal?.aborted
  }

  #resolve: (value: T) => void = null
  #reject: (reason?: any) => void = null
  #resolved = false
  #rejected = false

  public constructor(options: FrameTaskOptions<T>) {
    this.work = options.work
    this.schedule = options.schedule
    this.unschedule = options.unschedule
    this.signal = options.signal
    this.context = {
      frame: 0,
      time: 0,
      delta: 0,
      complete: (value: T) => this.complete(value),
      cancel: (reason?: any) => this.cancel(reason),
    }
    this.result = new Promise<T>((onResolve, onReject) => {
      this.#resolve = onResolve
      this.#reject = onReject
    })
  }

  public complete(value: T) {
    this.#resolved = true
    this.#resolve(value)
  }

  public cancel(reason?: any) {
    this.#rejected = true
    this.#reject(reason)
  }
}

export class FrameScheduler {
  private frame = 0
  private loop = loop((time, dt) => this.tick(time, dt), false)

  private tasks = new Set<FrameTask<any>>()
  private toSchedule: FrameTask<any>[] = []
  private toUnschedule: FrameTask<any>[] = []

  public get size() {
    return this.tasks.size
  }

  /**
   * Creates a new task without adding it to the scheduler
   *
   * @param taskFn The function that will be executed per frame
   */
  public task<T>(taskFn: FrameFn<T>, signal?: AbortSignal) {
    const task = new FrameTask({
      work: taskFn,
      schedule: () => this.schedule(task),
      unschedule: () => this.unschedule(task),
      signal,
    })
    return task
  }

  /**
   * Schedules a task for execution starting on next frame until cancelled
   */
  public schedule<T>(task: FrameTask<T>): Promise<T>
  /**
   * Schedules a function for execution starting on next frame until cancelled
   */
  public schedule<T>(task: FrameFn<T>, signal?: AbortSignal): Promise<T>
  public schedule<T>(task: FrameTask<T> | FrameFn<T>, signal?: AbortSignal): Promise<T> {
    console.assert(!!task, 'Scheduled task must not be null')
    if (typeof task === 'function' && !(task instanceof FrameTask)) {
      task = this.task(task, signal)
    }
    this.toSchedule.push(task)
    if (!this.loop.isRunning) {
      this.loop.start()
    }
    return task.result
  }

  /**
   * Unschedules a task, preventing it from being executed in the next tick.
   */
  public unschedule<T>(task: FrameTask<T>) {
    if (task) {
      this.toUnschedule.push(task)
    }
  }

  /**
   * Executes a single frame by running all registered tasks
   *
   * @param time Current time in secods
   * @param dt Time since last tick in seconds
   */
  public tick(time: number, dt: number) {
    this.frame += 1
    while (this.toSchedule.length > 0) {
      this.tasks.add(this.toSchedule.pop())
    }
    while (this.toUnschedule.length > 0) {
      this.tasks.delete(this.toUnschedule.pop())
    }

    for (const task of this.tasks) {
      try {
        task.context.frame = this.frame
        task.context.time = time
        task.context.delta = dt
        task.work(task.context)
      } catch (error) {
        task.context.cancel(error)
      }
      if (task.isCompleted) {
        this.toUnschedule.push(task)
      }
    }

    while (this.toUnschedule.length > 0) {
      this.tasks.delete(this.toUnschedule.pop())
    }

    if (this.tasks.size === 0) {
      this.loop.stop()
    }
  }

  /**
   * Stops the loop and clears all registered tasks
   */
  public dispose() {
    this.loop.stop()
    this.tasks.clear()
    this.toSchedule.length = 0
    this.toUnschedule.length = 0
  }
}
