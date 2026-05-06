import { JsonRpcClient, JsonRpcRequest, JsonRpcResponse } from '../types'

export class RpcWorker {
  private worker: Worker
  private client: JsonRpcClient

  public constructor(scriptUrl: string) {
    this.worker = new Worker(scriptUrl)
    this.client = new JsonRpcClient((request, transfer) => {
      this.worker.postMessage(request, transfer ?? [])
    })
    this.worker.onmessage = (e: MessageEvent<JsonRpcResponse>) => {
      this.client.handleResponse(e.data)
    }
    this.worker.onerror = (e) => {
      console.error('Worker error', e)
    }
  }

  public call<T>(
    method: JsonRpcRequest['method'],
    params?: JsonRpcRequest['params'],
    transfer?: Transferable[],
  ): Promise<T> {
    return this.client.sendRequest<T>({ method, params, id: null }, transfer)
  }

  public terminate() {
    this.worker.terminate()
  }
}
