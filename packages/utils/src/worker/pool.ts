import { RpcWorker } from './worker'

export type WorkerSelectionStrategy = (workers: RpcWorker[]) => RpcWorker

export class RpcWorkerPool {
  private workers: RpcWorker[] = []
  private nextIndex = 0
  private select: WorkerSelectionStrategy

  public constructor(scriptUrl: string, count = 1, select?: WorkerSelectionStrategy) {
    this.select = select ?? this.roundRobin()
    for (let i = 0; i < count; i++) {
      this.workers.push(new RpcWorker(scriptUrl))
    }
  }

  public call<T>(method: string, params?: unknown[] | Record<string, unknown>, transfer?: Transferable[]): Promise<T> {
    if (this.workers.length === 0) {
      return Promise.reject(new Error('No workers available'))
    }

    const worker = this.select(this.workers)
    return worker.call<T>(method, params, transfer)
  }

  public roundRobin(): WorkerSelectionStrategy {
    return (workers) => {
      const w = workers[this.nextIndex % workers.length]
      this.nextIndex++
      return w
    }
  }

  public terminateAll() {
    for (const w of this.workers) {
      w.terminate()
    }
    this.workers.length = 0
  }
}
