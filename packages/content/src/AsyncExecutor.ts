/**
 * Async task executed by an AsyncExecutor.
 * Receives an AbortSignal that should be respected for cancellation.
 */
export type AsyncTask<T> = (signal: AbortSignal) => Promise<T>

/**
 * Executes asynchronous tasks with a defined concurrency policy.
 * Implementations may run tasks immediately or apply scheduling/limiting.
 */
export interface AsyncExecutor {
  /**
   * Executes a single async task.
   * If a signal is provided and already aborted, the task is not started.
   */
  run<T>(task: AsyncTask<T>, signal?: AbortSignal): Promise<T>

  /**
   * Executes multiple async tasks.
   * Default behavior is fail-fast (Promise.all semantics).
   * If a signal is provided and already aborted, no tasks are started.
   */
  runAll<T>(tasks: Array<AsyncTask<T>>, signal: AbortSignal): Promise<T[]>
}

const noopController = new AbortController()
const noopSignal = noopController.signal

/**
 * Naive executor with no concurrency limits.
 * Tasks are executed immediately and in parallel.
 */
export class NaiveAsyncExecutor implements AsyncExecutor {
  /**
   * Executes a task immediately.
   */
  public async run<T>(task: AsyncTask<T>, signal?: AbortSignal): Promise<T> {
    if (signal?.aborted) {
      throw abortError(signal)
    }

    return task(signal ?? noopSignal)
  }

  /**
   * Executes all tasks in parallel using Promise.all.
   */
  public async runAll<T>(tasks: Array<AsyncTask<T>>, signal?: AbortSignal): Promise<T[]> {
    if (signal?.aborted) {
      throw abortError(signal)
    }

    return Promise.all(
      tasks.map((task) => {
        return task(signal ?? noopSignal)
      }),
    )
  }
}

function abortError(signal: AbortSignal): Error {
  if (signal.reason !== undefined) {
    return signal.reason
  }

  return new Error('Aborted')
}

type QueueEntry = {
  resolve: () => void
  reject: (err: unknown) => void
  signal?: AbortSignal
  onAbort?: () => void
}

/**
 * Executes asynchronous tasks with bounded concurrency.
 * Ensures that no more than a fixed number of tasks run in parallel.
 */
export class BoundedAsyncExecutor implements AsyncExecutor {
  private activeCount: number = 0
  private pendingCount: number = 0

  private queue: QueueEntry[] = []

  private readonly maxConcurrent: number

  public constructor(maxConcurrent: number) {
    if (maxConcurrent <= 0) {
      throw new Error('AsyncLimiter: maxConcurrent must be > 0')
    }

    this.maxConcurrent = maxConcurrent
  }

  public get active(): number {
    return this.activeCount
  }

  public get pending(): number {
    return this.pendingCount
  }

  /**
   * Executes a single task subject to the concurrency limit.
   * If a signal is provided and already aborted, the task is not started.
   */
  public async run<T>(task: AsyncTask<T>, signal?: AbortSignal): Promise<T> {
    if (signal?.aborted) {
      throw abortError(signal)
    }

    if (this.activeCount >= this.maxConcurrent) {
      await this.enqueue(signal)
    }

    if (signal?.aborted) {
      throw abortError(signal)
    }

    this.activeCount++

    // create a linked controller so we always pass a signal
    const controller = new AbortController()

    const abortHandler = () => {
      controller.abort(signal?.reason)
    }

    if (signal) {
      signal.addEventListener('abort', abortHandler, { once: true })
    }

    try {
      const result = await task(controller.signal)
      return result
    } catch (error) {
      throw error
    } finally {
      if (signal) {
        signal.removeEventListener('abort', abortHandler)
      }

      this.activeCount--
      this.dequeue()
    }
  }

  /**
   * Executes multiple tasks with bounded concurrency.
   * Each task is scheduled through the shared limiter,
   * ensuring global concurrency constraints are respected.
   */
  public async runAll<T>(tasks: Array<AsyncTask<T>>, signal?: AbortSignal): Promise<T[]> {
    if (signal?.aborted) {
      throw signal.reason ?? new Error('Aborted')
    }

    return Promise.all(
      tasks.map((task) => {
        return this.run(task, signal ?? noopSignal)
      }),
    )
  }

  private enqueue(signal?: AbortSignal): Promise<void> {
    this.pendingCount++

    return new Promise<void>((resolve, reject) => {
      const entry: QueueEntry = {
        resolve: () => {
          this.pendingCount--
          cleanupEntry(entry)
          resolve()
        },
        reject: (err: unknown) => {
          this.pendingCount--
          cleanupEntry(entry)
          reject(err)
        },
        signal,
      }

      if (signal) {
        const onAbort = () => {
          entry.reject(abortError(signal))
        }

        entry.onAbort = onAbort
        signal.addEventListener('abort', onAbort, { once: true })
      }

      this.queue.push(entry)
    })
  }

  private dequeue(): void {
    while (this.queue.length > 0 && this.activeCount < this.maxConcurrent) {
      const entry = this.queue.shift()

      if (!entry) {
        return
      }

      // if aborted while waiting, skip
      if (entry.signal?.aborted) {
        entry.reject(abortError(entry.signal))
        continue
      }

      entry.resolve()
      return
    }
  }
}

function cleanupEntry(entry: QueueEntry): void {
  if (entry.signal && entry.onAbort) {
    entry.signal.removeEventListener('abort', entry.onAbort)
  }
}
