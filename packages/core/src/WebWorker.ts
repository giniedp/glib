import { JsonRPCRequest, JsonRPCResponse } from './JsonRpc'
import { Log } from './Log'

/**
 * A function that can be registered at the `WebWorker` class
 *
 * @public
 */
export type WebWorkerFunction<T> = (...args: any[]) => T | Promise<T>

/**
 * A function that has been registered at `WebWorker` class
 *
 * @public
 */
export type WebWorkerAsyncFunction<T> = (...args: any[]) => Promise<T>

interface Task<T> {
  name: string
  action: WebWorkerFunction<T>
  thread: number
}

const workers: WebWorker[] = []
const tasks = new Map<string, Task<any>>()
let requestCounter = 0

/**
 * Provides a mechanism for registering functions as background tasks which can be executed on a worker thread
 *
 * @public
 * @remarks
 * The class is a wrapper around the {@link https://developer.mozilla.org/en-US/docs/Web/API/Worker/Worker | Web Worker Api}.
 *
 * To enable the functionality it is required that the `workerUrl` is set and points to
 * a worker script which should run in the worker thread.
 *
 * Functions that should run on the worker thread may be registered at any time, before or after
 * the functionality is enabled.
 *
 * It is important that this class and the registry of background tasks are all bundled
 * in the application bundle as well as in the worker bundle
 *
 * @example
 * const myTask = WebWorker.task("myBackgroundTask", () => {
 *   // do heavy things
 * })
 *
 * WebWorker.enable('http://example.com/gglib.umd.js')
 *
 * myTask()                           // will run on a worker thread
 * WebWorker.exec("myBackgroundTask") // same task as above
 *
 * WebWorker.disable()                // disables webworker functionality
 * myTask()                           // will run on main thread
 * WebWorker.exec("myBackgroundTask") // same task as above
 */
export class WebWorker {

  /**
   * Determines whether this context is inside a web worker
   *
   * @public
   */
  public static readonly isWorkerContext = typeof self['importScripts'] === 'function'

  /**
   * Determines whether this context is inside a browser window
   *
   * @public
   */
  public static readonly isWindowContext = typeof self['importScripts'] !== 'function'

  /**
   * Determines whether web porker api is supported
   *
   * @public
   */
  public static readonly isSupported = typeof Worker !== 'undefined'

  /**
   * Enables a webworker and limits to the number of threads
   *
   * @public
   * @param workerCount - Total number of workers to activate
   */
  public static enable(workerUrl: string, workerCount: number = 1): boolean {
    if (!WebWorker.isSupported || WebWorker.isWorkerContext) {
      return false
    }
    WebWorker.disable()
    while (workerCount > 0) {
      workers.push(new WebWorker(workerUrl))
    }
    return true
  }

  /**
   * Disables a webworker script
   *
   * @remarks if `script` is not given all webworker are disabled
   *
   * @public
   */
  public static disable() {
    while (workers.length) {
      workers.pop().terminate()
    }
  }

  /**
   * Registers a named function that can be executed in a webworker thread
   *
   * @public
   *
   * @param name - The task name
   * @param action - The task action
   * @param thread - The worker index on which the action should be executed
   */
  public static task<T>(name: string, action: WebWorkerFunction<T>, thread: number = 0): WebWorkerAsyncFunction<T> {
    if (tasks.has(name)) {
      Promise.reject(`Task '${name}' is already defined`)
    }
    tasks.set(name, {
      name: name,
      action: action,
      thread: thread,
    })
    return (...params: any[]) => WebWorker.exec(name, ...params)
  }

  /**
   * Executes a task that has been previously registered with the `task` method.
   *
   * @public
   * @remarks
   * This will execute a registered task in a web worker thread. If web workers
   * are disabled then the task will be executed in the browser thread instead.
   */
  public static exec<T>(method: string, ...params: any[]): Promise<T> {
    if (!tasks.has(method)) {
      return Promise.reject(new Error(`Task '${method}' not found`))
    }

    const task = tasks.get(method)
    const worker = workers[task.thread] || workers[0]
    if (!worker) {
      return Promise.resolve(task.action.call({}, ...params))
    }
    return worker.postMessage<T>({
      method: task.name,
      params: params,
      id: requestCounter++,
    })
  }

  private worker: Worker
  private handler = new Map<number, any>()

  constructor(script: string) {
    this.worker = new Worker(script)
    this.worker.onmessage = this.handleMessage.bind(this)
    this.worker.onerror = (e) => Log.e(e)
  }

  private terminate() {
    this.worker.terminate()
  }

  private postMessage<T>(request: JsonRPCRequest): Promise<T> {
    request.id = request.id || requestCounter++
    if (this.handler.has(request.id)) {
      return Promise.reject(`A request with same id '${request.id}' is already running`)
    }
    return new Promise((resolve, reject) => {
      this.handler.set(request.id, (e: JsonRPCResponse) => {
        this.handler.delete(request.id)
        if (e.error) {
          reject(e.error)
        } else {
          resolve(e.result)
        }
      })
      this.worker.postMessage(request)
    })
  }

  private handleMessage(message: { data: JsonRPCRequest }) {
    if (!('data' in message) || !message.data) {
      return
    }
    const data = message.data
    if (!('id' in data)) {
      return
    }
    const id = data.id
    const handle = this.handler.get(id)
    if (handle) {
      handle(data)
    }
  }
}

if (WebWorker.isWorkerContext) {
  const worker = globalThis as unknown as Worker
  addEventListener('message', (message: { data: JsonRPCRequest }) => {
    if (!('data' in message) || !message.data) {
      return // not for us
    }
    const data = message.data
    const task = tasks.get(data.method)
    if (!task) {
      return // not for us
    }
    Promise.resolve()
      .then(() => task.action.apply({}, data.params))
      .then((result): JsonRPCResponse => {
        return {
          id: data.id,
          result: result,
          error: null,
        }
      })
      .catch((e): JsonRPCResponse => {
        return {
          id: data.id,
          result: null,
          error: e,
        }
      })
      .then((response) => worker.postMessage(response))
  })
}
