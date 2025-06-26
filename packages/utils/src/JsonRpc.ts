/**
 * @public
 */
export interface JsonRPCRequest {
  /**
   * The method name to call
   */
  method: string
  /**
   * The parameter to be used for the method call
   */
  params: any[]
  /**
   * A request id
   */
  id?: any
}

/**
 * @public
 */
export interface JsonRPCResponse<T = any> {
  /**
   * The result
   */
  result: T
  /**
   * The error
   */
  error: Error
  /**
   * A request id
   */
  id?: any
}

export interface RpcTask<T = any> {
  /**
   * The request id
   */
  id: string
  /**
   * The resolve function to call when the task is done
   */
  resolve: (value: T) => void
  /**
   * The reject function to call when the task fails
   */
  reject: (reason?: any) => void
}

export type RpcTaskScheduler = (task: JsonRPCRequest, transfer: Transferable[]) => void

export class RpcTaskManager {
  private schedule: RpcTaskScheduler
  private tasks: Map<string, RpcTask> = new Map()
  private idCounter: number = 0

  public constructor(options: { schedule: RpcTaskScheduler }) {
    this.schedule = options.schedule
  }

  public request<T>(rpc: JsonRPCRequest, transfer?: Transferable[]): Promise<T> {
    return new Promise((resolve, reject) => {
      if (!rpc.id) {
        rpc.id = (this.idCounter++).toString()
      }
      this.tasks.set(rpc.id, {
        id: rpc.id,
        resolve: resolve,
        reject: reject,
      })
      this.schedule(rpc, transfer)
    })
  }

  public response(response: JsonRPCResponse): void {
    if (!response.id || !this.tasks.has(response.id)) {
      return
    }
    const task = this.tasks.get(response.id)
    if (!task) {
      return
    }
    this.tasks.delete(response.id)
    if (response.error) {
      task.reject?.(response.error)
    } else {
      task.resolve(response.result)
    }
  }
}
