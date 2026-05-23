export type TaskFn<T = unknown> = (context: TaskContext<T>) => void
export interface TaskContext<T = unknown> {
  time: number
  dt: number
  complete(value: T): void
  cancel(reason?: any): void
}

export class Task<T = unknown> {
  public readonly work: TaskFn<T>
  public readonly schedule: Function
  public readonly unschedule: Function
  public readonly context: TaskContext<T>
  public readonly result: Promise<T>
  public get isCompleted() {
    return this.#resolved || this.#rejected
  }

  #resolve: (value: T) => void = null
  #reject: (reason?: any) => void = null
  #resolved = false
  #rejected = false

  public constructor(options: { work: TaskFn<T>; schedule: Function; unschedule: Function }) {
    this.work = options.work
    this.schedule = options.schedule
    this.unschedule = options.unschedule
    this.context = {
      time: 0,
      dt: 0,
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

export class Scheduler {
  private loop = loop((time, dt) => this.tick(time, dt), false)

  private tasks = new Set<Task<any>>()
  private toSchedule: Task<any>[] = []
  private toUnschedule: Task<any>[] = []

  public get size() {
    return this.tasks.size
  }

  /**
   * Creates a new task without adding it to the scheduler
   *
   * @param taskFn The function that will be executed per frame
   */
  public task<T>(taskFn: TaskFn<T>) {
    const task = new Task({
      work: taskFn,
      schedule: () => this.schedule(task),
      unschedule: () => this.unschedule(task),
    })
    return task
  }

  /**
   * Schedules a task for execution in the next tick.
   */
  public schedule<T>(task: Task<T> | TaskFn<T>): Promise<T> {
    if (typeof task === 'function' && !(task instanceof Task)) {
      task = this.task(task)
    }
    if (!task || task.isCompleted) {
      return task?.result || Promise.reject(new Error('Invalid task'))
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
  public unschedule<T>(task: Task<T>) {
    if (task) {
      this.toUnschedule.push(task)
    }
  }

  public add<T = void>(task: TaskFn<T>): Promise<T> {
    return this.schedule(this.task(task))
  }

  public tick(time: number, dt: number) {
    while (this.toSchedule.length > 0) {
      this.tasks.add(this.toSchedule.pop())
    }
    while (this.toUnschedule.length > 0) {
      this.tasks.delete(this.toUnschedule.pop())
    }

    for (const task of this.tasks) {
      try {
        task.context.time = time
        task.context.dt = dt
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

  public dispose() {
    this.loop.stop()
    this.tasks.clear()
    this.toSchedule.length = 0
    this.toUnschedule.length = 0
  }
}

export interface Loop {
  /**
   * Indicates if the loop is currently running
   */
  isRunning: boolean
  /**
   * Starts the loop, if not already running
   */
  start(): void
  /**
   * Stops the loop, if running
   */
  stop(): void
}

export function loop(frame: (timestamp: number, dt: number) => any, autostart = true): Loop {
  let requestId: number = null
  let timestamp: number = getTime()

  function tick() {
    const dt = getTime() - timestamp
    timestamp += dt
    frame(timestamp, dt)
    requestId = requestAnimationFrame(tick)
  }

  function start() {
    if (requestId == null) {
      timestamp = getTime()
      requestId = requestAnimationFrame(tick)
    }
  }

  function stop() {
    if (requestId != null) {
      cancelAnimationFrame(requestId)
      requestId = null
    }
  }

  if (autostart) {
    start()
  }
  return {
    start,
    stop,
    get isRunning() {
      return requestId != null
    },
  }
}

declare const process: any
export const getTime: () => number = (() => {
  if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
    return () => performance.now()
  }

  if (typeof process !== 'undefined' && typeof process.hrtime?.bigint === 'function') {
    const start = process.hrtime.bigint()
    return () => Number(process.hrtime.bigint() - start) / 1_000_000
  }

  return () => Date.now()
})()
