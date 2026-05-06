/**
 * @public
 */
export interface JsonRpcRequest {
  /**
   * The method name to call
   */
  method: string
  /**
   * The parameter to be used for the method call
   */
  params: unknown[] | Record<string, unknown>
  /**
   * A request id
   */
  id: string
}

/**
 * @public
 */
export interface JsonRpcError {
  /**
   * The error code
   */
  code: number
  /**
   * The error message
   */
  message: string
  /**
   * The error data
   */
  data?: unknown
}

/**
 * @public
 */
export interface JsonRpcResponse<T = unknown> {
  /**
   * A request id
   */
  id: string
  /**
   * The result
   */
  result?: T
  /**
   * The error
   */
  error?: JsonRpcError
}

export interface PendingRequest<T = unknown> {
  /**
   * The request id
   */
  id: string
  /**
   * The original request object for reference
   */
  request: JsonRpcRequest
  /**
   * The resolve function to call when the task is done
   */
  resolve: (value?: T) => void
  /**
   * The reject function to call when the task fails
   */
  reject: (reason?: any) => void
}

export type JsonRpcDelegate = (task: JsonRpcRequest, transfer: Transferable[]) => void

export class JsonRpcClient {
  private delegate: JsonRpcDelegate
  private pending: Map<string, PendingRequest> = new Map()
  private idCounter: number = 0

  public nextId(): string {
    return `rpc:${this.idCounter++}`
  }

  public constructor(delegate: JsonRpcDelegate) {
    this.delegate = delegate
  }

  public sendRequest<T>(rpc: JsonRpcRequest, transfer?: Transferable[], timeoutMs = 0): Promise<T> {
    return new Promise<any>((resolve, reject) => {
      if (!rpc.id) {
        console.warn('RPC request is missing an id. Assigning a generated id to the request.', rpc)
        rpc.id = this.nextId()
      }
      const id = rpc.id

      let timer: any
      if (timeoutMs > 0) {
        timer = setTimeout(() => {
          this.pending.delete(id)
          reject(new Error(`RPC request timed out after ${timeoutMs}ms. Request: ${rpc.method}`))
        }, timeoutMs)
      }

      this.pending.set(rpc.id, {
        id: rpc.id,
        request: rpc,
        resolve: (value) => {
          if (timer) {
            clearTimeout(timer)
          }
          resolve(value)
        },
        reject: (reason) => {
          if (timer) {
            clearTimeout(timer)
          }
          reject(reason)
        },
      })

      this.delegate(rpc, transfer)
    })
  }

  public handleResponse(response: JsonRpcResponse): void {
    const pending = this.pending.get(response.id)
    if (!pending) {
      return
    }
    this.pending.delete(response.id)
    if (response.error == null) {
      pending.resolve(response.result)
    } else {
      pending.reject?.(response.error)
    }
  }
}
