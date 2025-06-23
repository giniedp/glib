import { loop } from '@gglib/utils'

export type Task<T = unknown> = (context: TaskContext<T>) => void
export interface TaskContext<T = unknown> {
  time: number
  dt: number
  finish: (value: T) => void
}

interface ScheduledTask<T = unknown> {
  run: Task<T>
  context: TaskContext<T>
  resolve: (value: T) => void
  reject: (reason?: any) => void
}

export class Scheduler {
  private loop = loop((time, dt) => this.tick(time, dt), false)

  private toExecute: ScheduledTask[] = []
  private toRemove: ScheduledTask[] = []
  private tasks = new Set<ScheduledTask>()

  public get size() {
    return this.tasks.size
  }

  public add<T = void>(task: Task<T>): Promise<T> {
    const scheduledTask: ScheduledTask<T> = {
      run: task,
      context: {
        time: 0,
        dt: 0,
        finish: (value: T) => this.finish(scheduledTask, value),
      },
      resolve: null,
      reject: null,
    }

    const result = new Promise<T>((resolve, reject) => {
      scheduledTask.resolve = resolve
      scheduledTask.reject = reject
      this.tasks.add(scheduledTask)
    })
    if (!this.loop.isRunning) {
      this.loop.start()
    }
    return result
  }

  public tick(time: number, dt: number) {
    this.toExecute.length = 0
    for (const task of this.tasks) {
      this.toExecute.push(task)
    }

    for (const task of this.toExecute) {
      try {
        task.context.time = time
        task.context.dt = dt
        task.run(task.context)
      } catch (error) {
        task.reject(error)
        this.toRemove.push(task)
        continue
      }
    }

    while (this.toRemove.length > 0) {
      const task = this.toRemove.pop()
      this.tasks.delete(task)
    }

    if (this.tasks.size === 0) {
      this.loop.stop()
    }
  }

  private finish<T>(task: ScheduledTask<T>, value: T) {
    task.resolve(value)
    this.toRemove.push(task)
  }

  public dispose() {
    this.loop.stop()
    this.tasks.clear()
    this.toRemove.length = 0
    this.toExecute.length = 0
  }
}
