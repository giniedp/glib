import { JsonRpcRequest, JsonRpcResponse } from '../types'
import { RpcWorkerPool } from './pool'
import { RpcMethodRegistry } from './registry'
import { getWorkerContext, isWorkerContext, isWorkerSupported } from './utils'

export interface WorkerEcecutorOptions {
  pool: RpcWorkerPool
  registry: RpcMethodRegistry
}

export class WorkerExecutor {
  private static global = new WorkerExecutor({
    pool: null,
    registry: new RpcMethodRegistry(),
  })

  /**
   * Enables global worker executor
   *
   * @remarks
   * In worker context, it will attach the server handler to process incoming requests
   * In main context, it will create a worker pool with the given script url and worker count
   *
   * @param workerUrl - The url of the worker script to execute. Should be a same-origin url or a blob url.
   * @param workerCount - The number of workers to create in the pool (default: 1)
   */
  public static enable(workerUrl: string, workerCount: number = 1) {
    if (isWorkerContext) {
      this.global.attachServerHandler()
    } else if (!isWorkerSupported) {
      console.warn('Web Worker is not supported in this environment')
    } else {
      this.global.pool?.terminateAll()
      this.global.pool = new RpcWorkerPool(workerUrl, workerCount)
    }
  }

  /**
   * Disables global worker executor
   *
   * @remarks
   * In worker context, it will detach the server handler for incoming requests
   * In main context, it will terminate all workers in the pool
   */
  public static disable() {
    if (isWorkerContext) {
      this.global.detachServerHandler()
    } else {
      this.global.pool?.terminateAll()
      this.global.pool = null
    }
  }

  /**
   * Registers a named function in a global registry that can be executed in a worker thread
   *
   * @param name
   * @param fn
   * @returns
   */
  static register<T>(name: string, fn: (...args: any[]) => T | Promise<T>): (...args: any[]) => Promise<T> {
    WorkerExecutor.global.registry.register(name, fn)
    return (...args: any[]) => {
      return WorkerExecutor.call<T>(name, ...args)
    }
  }

  static call<T>(method: string, ...params: any[]): Promise<T> {
    return WorkerExecutor.global.call<T>(method, ...params)
  }

  private pool?: RpcWorkerPool
  private registry: RpcMethodRegistry

  public constructor(options: WorkerEcecutorOptions) {
    this.pool = options.pool
    this.registry = options.registry
  }

  public async call<T>(method: string, ...params: any[]): Promise<T> {
    const hasWorkers = !!this.pool
    const hasLocal = this.registry.has(method)

    if (hasWorkers) {
      return await this.pool!.call<T>(method, params)
    }

    if (hasLocal) {
      return this.executeLocal<T>(method, params)
    }

    throw new Error(`Method '${method}' not available`)
  }

  private executeLocal<T>(method: string, params: any[]): Promise<T> {
    const fn = this.registry.get<T>(method)
    if (!fn) {
      return Promise.reject(new Error(`Method '${method}' not registered locally`))
    }

    try {
      return Promise.resolve<T>(fn(...params))
    } catch (e) {
      return Promise.reject(e)
    }
  }

  /**
   * Should only be called in worker context to attach the server handler for incoming requests
   */
  public attachServerHandler() {
    if (isWorkerContext) {
      globalThis.addEventListener('message', this.serverHandler)
    } else {
      console.warn('attachServerHandler should only be called in worker context')
    }
  }

  /**
   * Should only be called in worker context to detach the server handler for incoming requests
   */
  public detachServerHandler() {
    const worker = getWorkerContext()
    if (!worker) {
      throw new Error('detachWorkerServer can only be used in a worker context')
    }

    globalThis.removeEventListener('message', this.serverHandler)
  }

  /**
   * The server handler to process incoming requests in worker context
   */
  public serverHandler = async (event: MessageEvent<JsonRpcRequest>) => {
    const req = event.data

    if (!req || typeof req.method !== 'string') {
      return
    }

    const handler = this.registry.get(req.method)
    if (!handler) {
      return
    }

    try {
      const result = await handler(...(Array.isArray(req.params) ? req.params : []))

      const response: JsonRpcResponse = {
        id: req.id,
        result,
      }

      globalThis.postMessage(response)
    } catch (e: any) {
      const response: JsonRpcResponse = {
        id: req.id,
        error: {
          code: -32000,
          message: e?.message ?? 'Worker error',
          data: e,
        },
      }

      globalThis.postMessage(response)
    }
  }
}
