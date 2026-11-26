import { TextureCompression } from '@gglib/graphics'
import { JsonRpcWorker, jsonRpcWorker } from '@gglib/utils'
import { TextureData } from './transcoder/transcode'
import { TranscoderOptions } from './transcoder/types'

interface PoolWorker {
  rpc: JsonRpcWorker
  initialized: Promise<void>
  /**
   * Requests sent and not answered yet
   */
  pending: number
}

/**
 * Transcodes KTX2 (Basis Universal) files in a pool of workers
 */
export class Transcoder {
  private readonly options: TranscoderOptions
  private readonly workers: PoolWorker[] = []
  /**
   * The wasm module, fetched once for all workers. Undefined lets each worker fetch it from `wasmUrl`.
   */
  private readonly wasmBinary: Promise<ArrayBuffer | undefined>

  public constructor(options: TranscoderOptions) {
    this.options = options
    this.wasmBinary = options.wasmBinary ? Promise.resolve(options.wasmBinary) : fetchWasm(options.wasmUrl)
    const count = Math.max(1, options.workers ?? defaultWorkerCount())
    // all workers start right away: a worker needs its wasm module before the first file, starting it on demand
    // puts that on the path of the file that waits for it
    for (let i = 0; i < count; i++) {
      this.workers.push(this.createWorker())
    }
  }

  /**
   * Transcodes a KTX2 file into one of the given compressions.
   *
   * @param data - the file. It is transferred to the worker and detached after the call.
   */
  public async transcode(data: ArrayBuffer, compression: TextureCompression[]): Promise<TextureData> {
    const worker = this.acquireWorker()
    worker.pending++
    try {
      await worker.initialized
      return await worker.rpc.request<TextureData>(
        {
          id: worker.rpc.nextId(),
          method: 'transcode',
          params: [data, compression],
        },
        [data],
      )
    } finally {
      worker.pending--
    }
  }

  /**
   * The worker with the fewest pending requests
   */
  private acquireWorker(): PoolWorker {
    let best = this.workers[0]
    for (const worker of this.workers) {
      if (worker.pending < best.pending) {
        best = worker
      }
    }
    return best
  }

  private createWorker(): PoolWorker {
    const rpc = jsonRpcWorker({
      worker: getWorker(this.options),
    })
    const params = { ...this.options }
    delete params.getWorker
    const initialized = this.wasmBinary.then((wasmBinary) => {
      return rpc.request<void>({
        id: rpc.nextId(),
        method: 'init',
        // each worker gets a copy of the module bytes
        params: [{ ...params, wasmBinary }],
      })
    })
    return { rpc, initialized, pending: 0 }
  }
}

/**
 * Fetches the wasm module on the calling thread. `wasmUrl` resolves against the page here, in a worker against the
 * worker script: an absolute or root relative url is the same in both. Undefined when it fails, the workers then fetch
 * it themselves and report the error.
 */
async function fetchWasm(wasmUrl: string | undefined): Promise<ArrayBuffer | undefined> {
  if (!wasmUrl) {
    return undefined
  }
  try {
    const response = await fetch(wasmUrl)
    if (!response.ok) {
      return undefined
    }
    return await response.arrayBuffer()
  } catch {
    return undefined
  }
}

function defaultWorkerCount() {
  const cores = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 2 : 2
  return Math.min(4, cores - 1)
}

function getWorker(options: TranscoderOptions) {
  let worker: Worker
  if (options.getWorker) {
    worker = options.getWorker()
  } else {
    worker = new Worker(new URL('./ktx.worker.js', import.meta.url), {
      type: 'module',
    })
  }
  return worker
}
